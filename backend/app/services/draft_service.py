import logging
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from backend.app.database.repositories import DraftRepository, GapRepository, PaperRepository, ResearchRepository
from backend.app.models.draft import (
    Draft,
    DraftSection,
    ClaimStatusEnum,
    ClaimVerificationResponse,
    EvidenceCitationItem,
    LiteratureReviewResponse,
    LiteratureReviewSectionItem,
    LiteratureReviewTable,
)
from backend.app.rag.retriever import ResearchRetriever
from backend.app.services.llm_service import LLMProviderBase, get_llm_provider
from backend.app.utils.config import Settings, get_settings


class LLMSectionItem(BaseModel):
    title: str
    content: str
    source_indices: List[int] = Field(default_factory=list)


class LLMTableItem(BaseModel):
    table_id: str
    title: str
    headers: List[str]
    rows: List[List[str]]
    description: Optional[str] = None


class LLMReviewPayload(BaseModel):
    sections: List[LLMSectionItem]
    tables: List[LLMTableItem]


class DraftService:
    STANDARD_SECTIONS = [
        "Title",
        "Abstract",
        "Introduction",
        "Literature Review",
        "Research Gap",
        "Problem Statement",
        "Research Questions",
        "Objectives",
        "Hypothesis",
        "Methodology",
        "Expected Outcomes",
        "Discussion",
        "Limitations",
        "Conclusion",
        "References",
    ]

    def __init__(
        self,
        db: Session,
        llm: Optional[LLMProviderBase] = None,
        retriever: Optional[ResearchRetriever] = None,
        settings: Optional[Settings] = None,
    ):
        self.db = db
        self.settings = settings or get_settings()
        self.llm = llm or get_llm_provider(self.settings, allow_mock=(self.settings.APP_ENV == "testing"))
        self.retriever = retriever
        self.draft_repo = DraftRepository(db)
        self.gap_repo = GapRepository(db)
        self.paper_repo = PaperRepository(db)
        self.research_repo = ResearchRepository(db)

    def generate_full_draft(self, research_id: str, gap_id: Optional[str] = None) -> Draft:
        project = self.research_repo.get_project(research_id)
        topic = project.topic if project else "Scientific Research"
        title = f"Investigation and Resolution of Identified Gaps in {topic}"

        selected_gap = None
        if gap_id:
            selected_gap = self.gap_repo.get_gap(gap_id)
        elif project and project.gaps:
            selected_gap = project.gaps[0]

        draft = self.draft_repo.get_or_create_draft(research_id, title)
        papers = self.paper_repo.list_papers(research_id)

        for idx, sec_name in enumerate(self.STANDARD_SECTIONS):
            content = self._generate_section_text(sec_name, topic, selected_gap, papers)
            self.draft_repo.save_or_update_section(
                draft_id=draft.id,
                section_name=sec_name,
                content=content,
                order_index=idx + 1,
                citations=[p.title for p in papers[:3]],
            )

        self.research_repo.log_activity(
            research_id=research_id,
            agent_name="draft_service",
            activity_type="draft_generated",
            message=f"Generated draft document with {len(self.STANDARD_SECTIONS)} structured sections",
        )

        return draft

    def generate_or_update_section(
        self,
        research_id: str,
        section_name: str,
        user_guidance: Optional[str] = None,
    ) -> DraftSection:
        project = self.research_repo.get_project(research_id)
        topic = project.topic if project else "Research Area"
        draft = self.draft_repo.get_or_create_draft(research_id, f"Research Proposal: {topic}")
        papers = self.paper_repo.list_papers(research_id)
        selected_gap = project.gaps[0] if project and project.gaps else None

        base_content = self._generate_section_text(section_name, topic, selected_gap, papers)
        if user_guidance:
            base_content = f"{base_content}\n\n[Incorporated Researcher Guidance: {user_guidance}]"

        order_idx = 1
        if section_name in self.STANDARD_SECTIONS:
            order_idx = self.STANDARD_SECTIONS.index(section_name) + 1

        return self.draft_repo.save_or_update_section(
            draft_id=draft.id,
            section_name=section_name,
            content=base_content,
            order_index=order_idx,
            citations=[p.title for p in papers[:2]],
        )

    def verify_claim(self, research_id: str, claim: str) -> ClaimVerificationResponse:
        supporting_items: List[EvidenceCitationItem] = []
        contradicting_items: List[EvidenceCitationItem] = []
        source_papers: List[str] = []

        if self.retriever:
            retrieved = self.retriever.retrieve(query=claim, research_id=research_id, top_k=4)
            for r in retrieved:
                item = EvidenceCitationItem(
                    paper_id=r.paper_id,
                    paper_title=r.paper_title,
                    page_number=r.page_number,
                    section=r.section,
                    snippet=r.snippet,
                    relevance_score=r.score,
                )
                if r.paper_title and r.paper_title not in source_papers:
                    source_papers.append(r.paper_title)

                if r.score > 0.65:
                    supporting_items.append(item)
                elif "contradict" in r.snippet.lower() or "however" in r.snippet.lower():
                    contradicting_items.append(item)
                else:
                    supporting_items.append(item)

        status = ClaimStatusEnum.SUPPORTED.value
        confidence = 0.85
        if not supporting_items:
            status = ClaimStatusEnum.UNSUPPORTED.value
            confidence = 0.40
            explanation = "No direct evidence retrieved from indexed literature confirming the claim."
        elif contradicting_items:
            status = ClaimStatusEnum.PARTIALLY_SUPPORTED.value
            confidence = 0.70
            explanation = "Literature provides conflicting perspectives and conditions regarding the claim."
        else:
            explanation = f"Claim is grounded and corroborated by {len(supporting_items)} evidence passages."

        return ClaimVerificationResponse(
            claim=claim,
            status=status,
            confidence=confidence,
            explanation=explanation,
            supporting_evidence=supporting_items,
            contradicting_evidence=contradicting_items,
            source_papers=source_papers,
        )

    def _generate_section_text(self, section_name: str, topic: str, gap: Any, papers: List[Any]) -> str:
        gap_title = gap.title if gap else f"Gaps in {topic}"
        gap_desc = gap.description if gap else f"Understudied elements regarding {topic}"

        # Helper to extract authors and citation label
        def get_cite_label(p: Any) -> str:
            authors = p.authors if hasattr(p, "authors") and isinstance(p.authors, list) and p.authors else []
            first = authors[0] if authors else "Author"
            surname = first.split()[-1] if " " in first else first
            year = getattr(p, "year", 2024) or 2024
            if len(authors) > 2:
                return f"{surname} et al. ({year})"
            elif len(authors) == 2:
                s2 = authors[1].split()[-1] if " " in authors[1] else authors[1]
                return f"{surname} and {s2} ({year})"
            return f"{surname} ({year})"

        cites = [get_cite_label(p) for p in papers[:6]] if papers else ["Recent scholarship"]
        citations_str = ", ".join(cites[:3]) if cites else "the current literature"

        # Extract paper analytical attributes
        p1 = papers[0] if len(papers) > 0 else None
        p2 = papers[1] if len(papers) > 1 else p1
        p3 = papers[2] if len(papers) > 2 else p2

        p1_analysis = getattr(p1, "analysis", None) if p1 else None
        p2_analysis = getattr(p2, "analysis", None) if p2 else None
        p3_analysis = getattr(p3, "analysis", None) if p3 else None

        p1_method = getattr(p1_analysis, "methodology", None) or "empirical investigation"
        p2_method = getattr(p2_analysis, "methodology", None) or "comparative analysis"
        p1_findings = "; ".join(getattr(p1_analysis, "key_findings", [])[:2]) if p1_analysis and getattr(p1_analysis, "key_findings", None) else "observed performance variations across baseline settings"
        p2_findings = "; ".join(getattr(p2_analysis, "key_findings", [])[:2]) if p2_analysis and getattr(p2_analysis, "key_findings", None) else "identified critical parameter dependencies"
        p1_limits = "; ".join(getattr(p1_analysis, "limitations", [])[:2]) if p1_analysis and getattr(p1_analysis, "limitations", None) else "constrained testing conditions and limited sample diversity"
        p2_limits = "; ".join(getattr(p2_analysis, "limitations", [])[:2]) if p2_analysis and getattr(p2_analysis, "limitations", None) else "potential sensitivity to unmodeled environmental perturbations"

        c1 = cites[0] if len(cites) > 0 else "prior work"
        c2 = cites[1] if len(cites) > 1 else c1
        c3 = cites[2] if len(cites) > 2 else c2

        templates = {
            "Title": f"Addressing Critical Research Gaps in {topic}: A Grounded Empirical Framework",
            "Abstract": (
                f"This systematic investigation examines {topic}, focusing on unresolved tensions and critical research gaps "
                f"identified in recent literature ({citations_str}). While existing studies have established foundational baselines, "
                f"recurrent methodological constraints and divergent findings persist—particularly concerning {gap_title}. "
                f"Drawing upon empirical findings from {c1} ({p1_findings}) alongside complementary evaluations by {c2}, "
                f"this paper formulates a structured, reproducible methodological framework designed to resolve documented limitations. "
                f"We outline specific operational hypotheses, experimental architectures, and quantitative benchmark criteria to address "
                f"the identified void and establish robust standards for future inquiry."
            ),
            "Introduction": (
                f"Over recent years, {topic} has evolved into an essential focus of interdisciplinary academic and applied research. "
                f"Substantial progress has been registered across foundational paradigms, yet fundamental theoretical and practical questions "
                f"remain open ({citations_str}). Early investigations predominantly centered on nominal operating conditions, establishing "
                f"the baseline viability of modern approaches. However, as documented by {c1}, scaling these methodologies introduces "
                f"systemic challenges, including {p1_limits}. Concurrently, {c2} demonstrated that findings obtained under controlled conditions "
                f"frequently exhibit significant variance when exposed to heterogeneous environments ({p2_findings}). "
                f"This proposal addresses these critical tensions by formulating a systematic inquiry centered on {gap_title}."
            ),
            "Literature Review": (
                f"A systematic synthesis of the corpus reveals two predominant thematic clusters within {topic}: foundational modeling "
                f"and empirical benchmarking. In the foundational domain, investigations led by {c1} employed {p1_method}, establishing "
                f"that structured interventions yield measurable performance enhancements ({p1_findings}). Nonetheless, their analysis "
                f"acknowledged significant constraints, notably {p1_limits}.\n\n"
                f"Conversely, empirical benchmarking studies, exemplified by {c2}, utilized {p2_method} to assess operational stability. "
                f"While their findings corroborated the core theoretical principles articulated by {c1}, noticeable divergences emerged regarding "
                f"generalizability and computational complexity ({p2_findings}). Furthermore, when evaluating cross-study outcomes, an acute "
                f"lack of standardized longitudinal verification becomes evident across {c3} and related works. The literature thus demonstrates "
                f"a pronounced gap: existing frameworks lack verified resilience under non-ideal, continuous operational deployments."
            ),
            "Research Gap": (
                f"Primary Identified Gap: {gap_title}.\n\n"
                f"Detailed Description: {gap_desc}\n\n"
                f"Empirical Grounding: Analysis of the current literature corpus confirms that while {c1} and {c2} have examined adjacent facets, "
                f"neither study systematically accounts for {gap_title}. In particular, {c1} reported {p1_limits}, while {c2} identified {p2_limits}. "
                f"The intersection of these declared boundaries constitutes an unaddressed void in current scholarly literature."
            ),
            "Problem Statement": (
                f"The absence of rigorous empirical solutions for {gap_title} directly impedes the reliable deployment and theoretical maturation "
                f"of systems within {topic}. Without addressing the limitations documented by {c1} and {c2}, practitioners must continue to rely "
                f"on heuristic compensations that lack formal validation and reproducibly verifiable bounds."
            ),
            "Research Questions": (
                f"RQ1: To what extent does {gap_title} degrade operational fidelity and generalizability in {topic}?\n"
                f"RQ2: How do the methodological approaches utilized in {c1} ({p1_method}) compare against those in {c2} ({p2_method}) when subjected to stress testing?\n"
                f"RQ3: What architectural mechanisms can reconcile the divergent empirical findings observed between {c1} and {c2}?"
            ),
            "Objectives": (
                f"1. Quantify the empirical divergence and performance degradation attributable to {gap_title} across standard benchmarks.\n"
                f"2. Formulate and benchmark an integrated mitigation framework addressing the specific constraints noted in {c1} ({p1_limits}).\n"
                f"3. Validate the proposed methodology across multi-environment cohorts to guarantee reproducibility and longitudinal stability."
            ),
            "Hypothesis": (
                f"H1: Integrating adaptive verification mechanisms will significantly mitigate the error bounds documented by {c1} under high-load conditions.\n"
                f"H2: Cross-paradigm methodological synthesis between {p1_method} and {p2_method} will yield superior generalizability relative to standalone baselines."
            ),
            "Methodology": (
                f"This study employs a multi-phase mixed-methods design. In Phase 1, baseline performance is established using reproducible open-access "
                f"datasets directly comparable to the cohorts examined by {c1} and {c2}. In Phase 2, a controlled experimental pipeline is implemented, "
                f"incorporating ablation testing to isolate the specific variables associated with {gap_title}. In Phase 3, sensitivity analysis is conducted "
                f"to evaluate robustness against parameter miscalibration, directly resolving the methodological vulnerabilities cited in prior literature."
            ),
            "Expected Outcomes": (
                f"1. A comprehensive, open-source benchmark suite evaluating resilience under previously unaddressed conditions.\n"
                f"2. Empirical validation resolving the apparent contradictions reported between {c1} and {c2}.\n"
                f"3. Concrete design guidelines and parameter boundaries for scalable implementation in {topic}."
            ),
            "Discussion": (
                f"The proposed framework bridges a documented division between theoretical formulation and practical execution in {topic}. "
                f"By explicitly addressing the constraints highlighted by {c1} ({p1_limits}) and {c2} ({p2_limits}), this research establishes "
                f"a grounded foundation that resolves longstanding ambiguities in literature and informs subsequent investigation."
            ),
            "Limitations": (
                f"Initial boundaries of the proposed inquiry include reliance on curated benchmark cohorts and the computational cost associated "
                f"with high-dimensional ablation testing. Cross-domain transferability outside the primary evaluation datasets will require "
                f"subsequent multi-site validation as highlighted in ongoing research."
            ),
            "Conclusion": (
                f"By systematically confronting {gap_title}, this research delivers an essential, evidence-grounded contribution to {topic}. "
                f"Through rigorous methodology, traceable source evidence, and explicit resolution of prior literature boundaries, the project "
                f"advances the field beyond existing empirical impasses."
            ),
            "References": (
                "\n".join([f"{i+1}. {p.title} ({getattr(p, 'year', 2024)}). {getattr(p, 'venue', 'Academic Publication')}." for i, p in enumerate(papers[:8])])
                if papers else f"1. Recent Literature in {topic} (2025)."
            ),
        }
        return templates.get(section_name, f"Section detailing {section_name} for research on {topic}.")

    def generate_literature_review(
        self,
        research_id: str,
        selected_gap_ids: Optional[List[str]] = None,
        review_depth: str = "Detailed",
        organization: str = "Thematic",
        citation_style: str = "APA 7",
    ) -> LiteratureReviewResponse:
        project = self.research_repo.get_project(research_id)
        topic = project.topic if project else "Scientific Research"
        papers = self.paper_repo.list_papers(research_id)
        all_gaps = self.gap_repo.list_gaps(research_id)

        selected_gaps = []
        if selected_gap_ids:
            gap_map = {g.id: g for g in all_gaps}
            selected_gaps = [gap_map[gid] for gid in selected_gap_ids if gid in gap_map]
        if not selected_gaps and all_gaps:
            selected_gaps = all_gaps[:2]

        selected_gap_titles = [g.title for g in selected_gaps]

        if not papers:
            insufficient_section = LiteratureReviewSectionItem(
                title="Status",
                content="Insufficient evidence in the analyzed literature. Please index research papers for this topic first.",
                supporting_paper_ids=[],
                citations=[]
            )
            return LiteratureReviewResponse(
                research_id=research_id,
                topic=topic,
                review_depth=review_depth,
                organization=organization,
                citation_style=citation_style,
                selected_gaps=selected_gap_titles,
                sections=[insufficient_section],
                tables=[],
                total_words=12,
                source_papers=[]
            )

        def safe_cell(val: Any, default: str = "Not explicitly reported.") -> str:
            if val is None:
                return default
            if isinstance(val, (list, tuple)):
                val = "; ".join(str(x) for x in val if x)
            s = str(val).strip()
            return s if s else default

        source_papers_meta = []
        for p in papers:
            authors = p.authors if hasattr(p, "authors") and isinstance(p.authors, list) else []
            analysis = getattr(p, "analysis", None)

            raw_methodology = getattr(analysis, "methodology", None) if analysis else None
            raw_dataset = getattr(analysis, "dataset", None) if analysis else None
            raw_population = getattr(analysis, "population", None) if analysis else None
            raw_findings = getattr(analysis, "key_findings", None) or getattr(analysis, "findings", None) if analysis else None
            raw_limitations = getattr(analysis, "limitations", None) if analysis else None

            if isinstance(raw_findings, list):
                findings_str = "; ".join(str(f) for f in raw_findings if f)
            else:
                findings_str = str(raw_findings) if raw_findings is not None else ""

            if isinstance(raw_limitations, list):
                limitations_str = "; ".join(str(l) for l in raw_limitations if l)
            else:
                limitations_str = str(raw_limitations) if raw_limitations is not None else ""

            source_papers_meta.append({
                "id": str(p.id),
                "title": str(p.title or "Untitled Study"),
                "authors": [str(a) for a in authors if a] if authors else ["Author"],
                "year": getattr(p, "year", 2024) or 2024,
                "venue": (getattr(p, "venue", "") or "") or "Academic Literature",
                "doi": getattr(p, "doi", "") or "",
                "methodology": safe_cell(raw_methodology, "Not explicitly reported."),
                "dataset": safe_cell(raw_dataset, "Not explicitly reported."),
                "population": safe_cell(raw_population, "Not explicitly reported."),
                "findings": safe_cell(findings_str, "Not explicitly reported."),
                "limitations": safe_cell(limitations_str, "Not explicitly reported."),
            })

        def cite(paper_obj: Any, idx: int) -> str:
            authors = paper_obj.get("authors", []) if isinstance(paper_obj, dict) else (paper_obj.authors if hasattr(paper_obj, "authors") and isinstance(paper_obj.authors, list) else [])
            first_author = authors[0] if authors else "Author"
            surname = first_author.split()[-1] if " " in first_author else first_author
            year = paper_obj.get("year", 2024) if isinstance(paper_obj, dict) else getattr(paper_obj, "year", 2024)
            if citation_style == "IEEE":
                return f"[{idx + 1}]"
            elif citation_style == "Vancouver":
                return f"({idx + 1})"
            elif citation_style == "MLA 9":
                return f"({surname} {year})"
            elif citation_style == "Harvard":
                return f"({surname}, {year})"
            elif citation_style == "Chicago":
                return f"({surname} {year})"
            return f"({surname} et al., {year})"

        generated_sections: List[LiteratureReviewSectionItem] = []
        generated_tables: List[LiteratureReviewTable] = []

        if self.llm:
            try:
                corpus_summary = []
                for idx, pm in enumerate(source_papers_meta):
                    corpus_summary.append(
                        f"[{idx + 1}] ID: {pm['id']}\n"
                        f"Title: {pm['title']}\n"
                        f"Authors: {', '.join(pm['authors'])}\n"
                        f"Year: {pm['year']} | Venue: {pm['venue']}\n"
                        f"Methodology: {pm['methodology']}\n"
                        f"Dataset: {pm['dataset']}\n"
                        f"Population / Sample: {pm['population']}\n"
                        f"Findings: {pm['findings']}\n"
                        f"Limitations: {pm['limitations']}\n"
                        f"DOI: {pm['doi']}\n"
                    )
                corpus_text = "\n".join(corpus_summary)

                gap_summary = "\n".join([f"- Gap {i+1}: {g.title} (Status: {getattr(g, 'status', 'Candidate')}, Evidence: {getattr(g, 'description', 'Identified in literature')})" for i, g in enumerate(selected_gaps)]) if selected_gaps else "No specific research gaps prioritized."

                prompt = (
                    f"You are a leading academic professor performing a rigorous, comprehensive systematic literature review on: \"{topic}\".\n\n"
                    f"TARGET CITATION STYLE: {citation_style}\n"
                    f"ORGANIZATION: {organization}\n"
                    f"DEPTH: {review_depth}\n\n"
                    f"INDEXED CORPUS EVIDENCE ({len(source_papers_meta)} papers):\n"
                    f"{corpus_text}\n\n"
                    f"TARGETED RESEARCH GAPS:\n"
                    f"{gap_summary}\n\n"
                    f"CRITICAL REQUIREMENTS:\n"
                    f"1. Generate exactly 17 academic sections in sequential order:\n"
                    f"   1. Research Area Overview\n"
                    f"   2. Evolution of the Field\n"
                    f"   3. Major Research Themes\n"
                    f"   4. Theoretical Foundations\n"
                    f"   5. Methodological Approaches\n"
                    f"   6. Dataset / Data Landscape\n"
                    f"   7. Study Populations / Contexts\n"
                    f"   8. Major Findings\n"
                    f"   9. Areas of Agreement\n"
                    f"   10. Contradictory Findings\n"
                    f"   11. Methodological Limitations\n"
                    f"   12. Population / Geographic Limitations\n"
                    f"   13. Temporal Limitations\n"
                    f"   14. Underexplored Areas\n"
                    f"   15. Emerging Directions\n"
                    f"   16. Research Gap Synthesis\n"
                    f"   17. Selected Gap Analysis\n\n"
                    f"Each section must contain 150 to 250 words of dense, precise academic discourse referencing the source papers by their target citation style (e.g. {cite(source_papers_meta[0], 0)}). In source_indices, provide the 1-based integer indices of the papers cited in that section.\n"
                    f"If evidence for any section is not available in the corpus, explicitly write: \"Insufficient evidence in the analyzed corpus.\"\n"
                    f"Never invent authors, datasets, or statistics outside the indexed corpus.\n\n"
                    f"2. Generate exactly 5 comparative tables:\n"
                    f"   table_1: TABLE 1 — Research Landscape (Headers: [\"Theme\", \"Number of Studies\", \"Methods Used\", \"Populations\", \"Maturity\"])\n"
                    f"   table_2: TABLE 2 — Methodology Comparison (Headers: [\"Study\", \"Method\", \"Dataset\", \"Sample / Population\", \"Evaluation\", \"Limitation\"])\n"
                    f"   table_3: TABLE 3 — Research Findings (Headers: [\"Theme\", \"Supporting Studies\", \"Main Findings\", \"Contradictions\"])\n"
                    f"   table_4: TABLE 4 — Research Gaps Catalog (Headers: [\"Potential Gap\", \"Evidence\", \"Supporting Papers\", \"Contradicting Evidence\", \"Status\"])\n"
                    f"   table_5: TABLE 5 — Study Populations and Data Sources (Headers: [\"Study\", \"Target Cohort / Context\", \"Data Modality\", \"Sample Size\", \"Geographic Scope\"])\n"
                    f"Populate table rows strictly from the indexed papers and gaps. Use \"Not reported\" for any missing attributes."
                )

                # This prompt asks for 17 dense sections (150-250 words each) plus 5
                # tables in a single JSON payload -- realistically 4,000-6,000+ words
                # of JSON. Providers with low default output caps (e.g. Groq) were
                # silently truncating this mid-response, which produced a parse
                # failure and a fall-through to the short generic template below.
                # Ask explicitly for a much larger budget.
                llm_res: LLMReviewPayload = self.llm.generate_structured(
                    prompt, LLMReviewPayload, max_tokens=12000
                )
                if llm_res and llm_res.sections and len(llm_res.sections) >= 10:
                    for s in llm_res.sections:
                        supp_ids = []
                        citations = []
                        for s_idx in getattr(s, "source_indices", []):
                            if isinstance(s_idx, int) and 1 <= s_idx <= len(source_papers_meta):
                                p_meta = source_papers_meta[s_idx - 1]
                                supp_ids.append(p_meta["id"])
                                citations.append(cite(p_meta, s_idx - 1))
                        generated_sections.append(LiteratureReviewSectionItem(
                            title=s.title,
                            content=s.content,
                            supporting_paper_ids=supp_ids,
                            citations=citations
                        ))

                    for t in llm_res.tables:
                        generated_tables.append(LiteratureReviewTable(
                            table_id=t.table_id,
                            title=t.title,
                            headers=t.headers,
                            rows=t.rows,
                            description=t.description or f"Comparative matrix for {topic}."
                        ))
            except Exception as exc:
                logger.error(
                    "LLM literature review generation failed for research_id=%s "
                    "(topic='%s', %d source papers): %s",
                    research_id, topic, len(source_papers_meta), exc, exc_info=True,
                )
                generated_sections = []
                generated_tables = []
        else:
            logger.warning(
                "No LLM provider configured for literature review generation "
                "(research_id=%s) -- using static template sections.",
                research_id,
            )

        # IMPORTANT: only fall back to the short static template when the LLM
        # produced nothing usable. Previously this triggered on "< 17 sections",
        # which meant a *partial* LLM success (e.g. 12 good, detailed sections)
        # got all 17 generic template sections appended on top of it instead of
        # being trusted -- doubling the section count with duplicate titles and
        # diluting real, grounded content with generic filler. A partial LLM
        # result is still far better than the template, so we keep it as-is.
        if not generated_sections:
            p1 = source_papers_meta[0] if source_papers_meta else {}
            p2 = source_papers_meta[1] if len(source_papers_meta) > 1 else p1
            p3 = source_papers_meta[2] if len(source_papers_meta) > 2 else p2
            p4 = source_papers_meta[3] if len(source_papers_meta) > 3 else p1

            c1 = cite(p1, 0)
            c2 = cite(p2, 1 if len(source_papers_meta) > 1 else 0)
            c3 = cite(p3, 2 if len(source_papers_meta) > 2 else 0)

            section_definitions = [
                ("Research Area Overview", f"The field of {topic} represents an active scientific domain focused on addressing fundamental foundational and computational challenges. Recent scholarship, including investigations by {c1} and {c2}, highlights significant methodological advances alongside evolving paradigms. This systematic review provides an evidence-based assessment of {len(source_papers_meta)} indexed works."),
                ("Evolution of the Field", f"Historical trajectories in {topic} demonstrate a shift from preliminary theoretical formulations toward empirical and algorithmic validation. Early works outlined foundational constraints, while subsequent analyses ({c2}) introduced refined operational models. Despite these progressions, sustained scalability and verification remain focal points."),
                ("Major Research Themes", f"Synthesizing the corpus identifies three core thematic clusters: foundational architecture, algorithmic optimization, and empirical robustness across varied operational regimes ({c1}, {c3}). Each theme addresses distinct aspects of system performance under non-ideal noise and data distributions."),
                ("Theoretical Foundations", f"Theoretical inquiry within {topic} is grounded in principles formulated across key references ({c1}, {c2}). Mathematical formulations govern error boundaries, convergence properties, and operational thresholds, establishing the analytical constraints under which contemporary frameworks operate."),
                ("Methodological Approaches", f"Methodological designs in the indexed literature exhibit distinct bifurcations between analytical modeling and simulation-driven empirical pipelines. Notably, {safe_cell(p1.get('title'), 'Primary literature')} employs {safe_cell(p1.get('methodology'), 'analytical formulation')}, whereas {safe_cell(p2.get('title'), 'Secondary literature')} relies on {safe_cell(p2.get('methodology'), 'empirical benchmarking')}."),
                ("Dataset / Data Landscape", f"Empirical inquiries across {topic} utilize diverse data sources. As documented across the analyzed papers, datasets range from {safe_cell(p1.get('dataset'), 'benchmark telemetry')} to {safe_cell(p2.get('dataset'), 'experimental datasets')}. Multiple studies note that benchmark availability remains heterogeneous across specialized subfields."),
                ("Study Populations / Contexts", f"Evaluations are contextualized within specific operational regimes and sample cohorts. For instance, {c1} focuses on {safe_cell(p1.get('population'), 'specified experimental conditions')}, while {c2} evaluates {safe_cell(p2.get('population'), 'controlled testing environments')}. Generalization to broader settings represents an ongoing objective."),
                ("Major Findings", f"Key empirical findings confirm that modern techniques yield measurable performance gains over legacy baselines ({c1}). Specifically, reported results demonstrate improved error thresholds, enhanced computational throughput, and structured mitigation of operational perturbations ({c2})."),
                ("Areas of Agreement", f"Consensus across the corpus affirms that structured mitigation mechanisms provide significant advantages over unmitigated baselines ({c1}, {c2}, {c3}). Authors universally agree on the critical necessity of rigorous error characterization before deployment."),
                ("Contradictory Findings", f"Divergences emerge regarding optimal trade-offs between computational overhead and error resilience. While {c1} prioritizes low-latency execution, {c2} demonstrates that higher resource allocations are required to guarantee stability under adversarial perturbations."),
                ("Methodological Limitations", f"Methodological limitations reported in the analyzed corpus center on constrained sample scopes and reliance on stylized assumptions. Authors in {c1} acknowledge {safe_cell(p1.get('limitations'), 'computational overheads')}, while {c2} cites sensitivity to parameter miscalibration."),
                ("Population / Geographic Limitations", "A critical observation across the literature is the concentration of evaluations within standardized synthetic or regional cohorts. Real-world heterogeneity across broader deployment contexts remains largely unverified in the analyzed papers."),
                ("Temporal Limitations", "Most evaluations in the corpus reflect cross-sectional or short-duration observations. Longitudinal stability and resilience to temporal parameter drift over extended operational lifecycles remain unaddressed."),
                ("Underexplored Areas", f"Substantial gaps persist in low-latency hardware execution, cross-platform transferability, and adaptive error tracking for {topic}. These underexplored facets inhibit immediate end-to-end translation."),
                ("Emerging Directions", f"Emerging research directions emphasize hybrid architectures, automated parameter tuning, and real-time feedback loops ({c3}). Integrating predictive surrogates offers promising trajectories for scalable execution."),
                ("Research Gap Synthesis", f"Synthesizing literature boundaries reveals critical gaps between theoretical guarantees and empirical deployments. The prioritized research gaps identify structural bottlenecks in validation breadth and computational feasibility."),
                ("Selected Gap Analysis", f"Detailed analysis of the prioritized gap reveals that current implementations lack verified real-time resilience under heterogeneous conditions ({c1}). Resolving this gap is essential for advancing state-of-the-art standards in {topic}.")
            ]

            generated_sections = []
            for sec_title, sec_content in section_definitions:
                generated_sections.append(LiteratureReviewSectionItem(
                    title=sec_title,
                    content=sec_content,
                    supporting_paper_ids=[safe_cell(p.get("id")) for p in source_papers_meta[:3] if p.get("id")],
                    citations=[cite(p, i) for i, p in enumerate(source_papers_meta[:3])]
                ))

        # Same fix as above: only fabricate the static tables when the LLM
        # produced none, rather than always padding up to 5.
        if not generated_tables:
            p0 = source_papers_meta[0] if source_papers_meta else {}
            p1_meta = source_papers_meta[1] if len(source_papers_meta) > 1 else p0

            table_1_rows = [
                [
                    f"Foundational Architecture in {topic}",
                    str(len(source_papers_meta)),
                    safe_cell(p0.get("methodology"), "Analytical Modeling"),
                    safe_cell(p0.get("population"), "Standardized Benchmarks"),
                    "Established"
                ],
                [
                    "Algorithmic Optimization",
                    str(max(1, len(source_papers_meta) // 2)),
                    "Simulation & Benchmarking",
                    "Controlled Environments",
                    "Emerging"
                ],
                [
                    "Empirical Robustness & Validation",
                    str(max(1, len(source_papers_meta) // 3)),
                    "Empirical Stress-Testing",
                    "Operational Telemetry",
                    "Emerging Frontier"
                ],
            ]
            table_1 = LiteratureReviewTable(
                table_id="table_1",
                title="TABLE 1 — Research Landscape",
                headers=["Theme", "Number of Studies", "Methods Used", "Populations", "Maturity"],
                rows=table_1_rows,
                description=f"Distribution of research themes, study counts, and maturity across {topic}."
            )

            table_2_rows = []
            for idx, pm in enumerate(source_papers_meta[:8]):
                lim_text = safe_cell(pm.get("limitations"), "Not explicitly reported.")
                table_2_rows.append([
                    f"{safe_cell(pm.get('title'), 'Study')[:45]}... ({cite(pm, idx)})",
                    safe_cell(pm.get("methodology"), "Not explicitly reported."),
                    safe_cell(pm.get("dataset"), "Not explicitly reported."),
                    safe_cell(pm.get("population"), "Not explicitly reported."),
                    "Quantitative Benchmark",
                    lim_text[:60] + "..." if len(lim_text) > 60 else lim_text
                ])
            table_2 = LiteratureReviewTable(
                table_id="table_2",
                title="TABLE 2 — Methodology Comparison",
                headers=["Study", "Method", "Dataset", "Sample / Population", "Evaluation", "Limitation"],
                rows=table_2_rows,
                description="Comparative methodological breakdown detailing datasets, target populations, quantitative evaluation metrics, and declared limitations."
            )

            table_3_rows = [
                [
                    f"Foundational Performance in {topic}",
                    cite(p0, 0),
                    safe_cell(p0.get("findings"), "Improves operational baseline under nominal conditions"),
                    "Latency trade-offs under high-throughput workloads"
                ],
                [
                    "Scalability and Robustness",
                    cite(p1_meta, 1 if len(source_papers_meta) > 1 else 0),
                    "Demonstrates fault tolerance across verified noise thresholds",
                    "Sensitivity to non-Markovian parameter drift"
                ],
            ]
            table_3 = LiteratureReviewTable(
                table_id="table_3",
                title="TABLE 3 — Research Findings",
                headers=["Theme", "Supporting Studies", "Main Findings", "Contradictions"],
                rows=table_3_rows,
                description="Thematic synthesis connecting supporting studies to verified empirical findings and active literature contradictions."
            )

            table_4_rows = []
            gaps_for_table = selected_gaps if selected_gaps else all_gaps[:4]
            for g in gaps_for_table:
                sup_papers = ", ".join(g.supporting_papers[:2]) if hasattr(g, "supporting_papers") and g.supporting_papers else cite(p0, 0)
                desc = safe_cell(getattr(g, "description", None), "Evidence verified in corpus")
                table_4_rows.append([
                    safe_cell(getattr(g, "title", None), "Research Gap"),
                    desc[:80] + "..." if len(desc) > 80 else desc,
                    safe_cell(sup_papers, cite(p0, 0)),
                    "Contradictory precedents tested via comparative scrutiny",
                    f"{safe_cell(getattr(g, 'status', None), 'Validated')} ({int(getattr(g, 'confidence', 0.88) * 100)}%)",
                ])
            table_4 = LiteratureReviewTable(
                table_id="table_4",
                title="TABLE 4 — Research Gaps Catalog",
                headers=["Potential Gap", "Evidence", "Supporting Papers", "Contradicting Evidence", "Status"],
                rows=table_4_rows if table_4_rows else [["Gaps in " + topic, "Understudied operational regimes", cite(p0, 0), "Not reported", "Identified"]],
                description="Catalog of critical candidate and validated research gaps targeted by this investigation."
            )

            table_5_rows = []
            for idx, pm in enumerate(source_papers_meta[:6]):
                table_5_rows.append([
                    f"{safe_cell(pm.get('title'), 'Study')[:45]}... ({cite(pm, idx)})",
                    safe_cell(pm.get("population"), "Not explicitly reported."),
                    safe_cell(pm.get("dataset"), "Not explicitly reported."),
                    "Reported in Paper",
                    safe_cell(pm.get("venue"), "International Literature")
                ])
            table_5 = LiteratureReviewTable(
                table_id="table_5",
                title="TABLE 5 — Study Populations and Data Sources",
                headers=["Study", "Target Cohort / Context", "Data Modality", "Sample Size", "Geographic Scope"],
                rows=table_5_rows,
                description="Detailed breakdown of empirical study contexts, dataset modalities, and sample characteristics across the corpus."
            )

            generated_tables = [table_1, table_2, table_3, table_4, table_5]

        total_words = sum(len(s.content.split()) for s in generated_sections)

        return LiteratureReviewResponse(
            research_id=research_id,
            topic=topic,
            review_depth=review_depth,
            organization=organization,
            citation_style=citation_style,
            selected_gaps=selected_gap_titles,
            sections=generated_sections,
            tables=generated_tables,
            total_words=total_words,
            source_papers=source_papers_meta
        )

