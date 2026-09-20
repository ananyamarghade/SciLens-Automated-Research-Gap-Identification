from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from backend.app.models.gap import ResearchGap, GapStatusEnum, NoveltyStatusEnum
from backend.app.services.llm_service import LLMProviderBase


class LLMGapEvaluation(BaseModel):
    status: str = Field(description="One of: VALID, POTENTIAL, INSUFFICIENT")
    novelty_status: str = Field(description="One of: well_supported, potential_gap, insufficient_evidence")
    confidence: float = Field(description="Confidence between 0.0 and 1.0 based on evidence strength")
    critique: str = Field(description="Rigorous academic critique of whether this candidate gap is supported by evidence")
    missing_evidence: List[str] = Field(default_factory=list, description="Specific missing evidence or unaddressed dimensions")
    additional_queries: List[str] = Field(default_factory=list, description="Targeted queries to search for counter-evidence or validation")
    what_we_found: str = Field(default="", description="Summary of what the corpus evidence reveals")
    why_this_is_a_gap: str = Field(default="", description="Why the absence or contradiction constitutes a genuine research gap")
    what_literature_does_not_establish: str = Field(default="", description="What current published literature has not yet established or tested")


class EvidenceCriticAgent:
    def __init__(self, llm: Optional[LLMProviderBase] = None):
        self.llm = llm

    def evaluate_gap(self, gap: ResearchGap, evidence_items: List[Any]) -> Dict[str, Any]:
        evidence_count = len(evidence_items)

        supporting_items = [e for e in evidence_items if getattr(e, "is_supporting", 1) != 0]
        counter_items = [e for e in evidence_items if getattr(e, "is_supporting", 1) == 0]

        supporting_paper_ids = {getattr(e, "paper_id", "") or getattr(e, "paper_title", "") for e in supporting_items}
        supporting_paper_ids.discard("")
        unique_supporting_papers = len(supporting_paper_ids)

        if evidence_count == 0 or unique_supporting_papers == 0:
            return {
                "gap_id": gap.id,
                "status": GapStatusEnum.INSUFFICIENT.value,
                "novelty_status": NoveltyStatusEnum.INSUFFICIENT_EVIDENCE.value,
                "confidence": 0.0,
                "evidence_strength": "Insufficient",
                "strength_display": "0.00 / 1.00 (Insufficient)",
                "critique": "Insufficient evidence. Candidate gap lacks grounded empirical citations in the current indexed corpus.",
                "missing_evidence": [
                    f"Direct empirical evaluations for {gap.title}",
                    f"Independent comparative validation in {gap.gap_type} dimension",
                ],
                "additional_queries": [
                    f"{gap.title} empirical evaluation limitations",
                    f"{gap.gap_type} benchmark study challenges",
                ],
                "evidence_count": 0,
                "supporting_count": 0,
                "counter_count": 0,
                "what_we_found": "No direct evidence items indexed in the corpus for this candidate gap.",
                "why_this_is_a_gap": "Candidate gap was hypothesized but lacks grounded citations or paper snippets.",
                "what_literature_does_not_establish": "Published literature indexed so far does not establish any empirical baseline.",
            }

        evidence_summaries = []
        for i, ev in enumerate(evidence_items[:10]):
            p_title = getattr(ev, "paper_title", "") or getattr(ev, "source", "Corpus Reference")
            snippet = getattr(ev, "snippet", "") or ""
            is_supp = getattr(ev, "is_supporting", 1) != 0
            conf = getattr(ev, "confidence", 0.75)
            section = getattr(ev, "section", "general")
            evidence_summaries.append(
                f"[{i + 1}] Source: \"{p_title}\" (Section: {section}, Confidence: {conf:.2f}, Supporting: {is_supp})\n"
                f"    Snippet: \"{snippet[:300]}\""
            )

        evidence_text = "\n".join(evidence_summaries)

        eval_data = None
        if self.llm:
            prompt = (
                f"You are the Evidence Critic Agent in SciLens, an advanced scientific gap validation engine.\n"
                f"Your role is to evaluate whether the following candidate research gap is genuinely supported, "
                f"partially supported, or invalidated by retrieved corpus evidence.\n\n"
                f"CRITICAL VALIDATION CRITERIA (USER CORRECTION #2):\n"
                f"- Having 2 papers sharing a limitation does NOT automatically make a gap 'VALID'. Two papers sharing a limitation produces a CANDIDATE or POTENTIAL gap.\n"
                f"- To rate a gap 'VALID', there must be substantial independent supporting studies (typically 4+ or a high proportion of the corpus), methodological diversity, and direct evidence without unresolved counter-evidence.\n"
                f"- If supported by 1-3 papers or preliminary evidence, rate as 'POTENTIAL' or 'CANDIDATE'.\n"
                f"- If contradictory or counter-evidence exists in the corpus, rate as 'CONTESTED'.\n"
                f"- If unsupported by evidence snippets, rate as 'INSUFFICIENT'.\n"
                f"- DO NOT invent percentages, cohort statistics, or sample numbers.\n\n"
                f"CANDIDATE RESEARCH GAP:\n"
                f"Title: {gap.title}\n"
                f"Type: {gap.gap_type}\n"
                f"Stated Description: {gap.description}\n\n"
                f"INDEXED EVIDENCE ITEMS ({unique_supporting_papers} unique supporting papers, {len(counter_items)} counter items):\n"
                f"{evidence_text}\n\n"
                f"Return structured academic evaluation."
            )
            try:
                eval_res = self.llm.generate_structured(prompt, LLMGapEvaluation)
                if eval_res and eval_res.status:
                    norm_status = eval_res.status.upper()
                    if norm_status not in [s.value for s in GapStatusEnum]:
                        if unique_supporting_papers == 0 or "Methodological" in gap.title:
                            norm_status = GapStatusEnum.INSUFFICIENT.value
                        else:
                            norm_status = GapStatusEnum.POTENTIAL.value

                    # Enforce that 2 papers alone cannot trigger VALID
                    if norm_status == GapStatusEnum.VALID.value and unique_supporting_papers < 4:
                        norm_status = GapStatusEnum.SUPPORTED.value if unique_supporting_papers >= 2 else GapStatusEnum.POTENTIAL.value

                    conf_val = max(0.1, min(1.0, float(eval_res.confidence)))
                    if unique_supporting_papers < 3 and conf_val > 0.78:
                        conf_val = 0.72

                    strength_label = "Strong" if conf_val >= 0.82 else ("Moderate" if conf_val >= 0.65 else "Preliminary")

                    eval_data = {
                        "gap_id": gap.id,
                        "status": norm_status,
                        "novelty_status": eval_res.novelty_status.lower(),
                        "confidence": conf_val,
                        "evidence_strength": strength_label,
                        "strength_display": f"{conf_val:.2f} / 1.00 ({strength_label})",
                        "critique": eval_res.critique,
                        "missing_evidence": eval_res.missing_evidence or [],
                        "additional_queries": eval_res.additional_queries or [],
                        "evidence_count": evidence_count,
                        "supporting_count": len(supporting_items),
                        "counter_count": len(counter_items),
                        "what_we_found": eval_res.what_we_found or f"Found {len(supporting_items)} supporting evidence citations across {unique_supporting_papers} indexed papers.",
                        "why_this_is_a_gap": eval_res.why_this_is_a_gap or gap.description,
                        "what_literature_does_not_establish": eval_res.what_literature_does_not_establish or "Published studies do not establish cross-context verification.",
                    }
            except Exception:
                pass

        if not eval_data:
            conf_val = (
                sum(getattr(e, "confidence", 0.75) for e in evidence_items) / evidence_count
                if evidence_count > 0
                else 0.5
            )
            if len(counter_items) > 0:
                status = GapStatusEnum.CONTESTED.value
                novelty = NoveltyStatusEnum.POTENTIAL_GAP.value
                critique = f"Candidate gap has contrasting or divergent findings in the corpus ({len(counter_items)} counter-evidence items identified)."
                strength_label = "Moderate"
            elif unique_supporting_papers >= 4 and len(counter_items) == 0:
                status = GapStatusEnum.VALID.value
                novelty = NoveltyStatusEnum.WELL_SUPPORTED.value
                critique = f"Validated research gap supported by convergent evidence across {unique_supporting_papers} independent papers in the corpus without counter-evidence."
                strength_label = "Strong"
            elif unique_supporting_papers >= 2:
                status = GapStatusEnum.SUPPORTED.value
                novelty = NoveltyStatusEnum.POTENTIAL_GAP.value
                critique = f"Supported candidate gap identified across {unique_supporting_papers} independent papers; additional diverse cohorts needed to confirm broad validity."
                strength_label = "Moderate"
            elif unique_supporting_papers >= 1:
                status = GapStatusEnum.POTENTIAL.value
                novelty = NoveltyStatusEnum.POTENTIAL_GAP.value
                critique = f"Preliminary potential gap identified in {unique_supporting_papers} paper; requires replication across independent studies."
                strength_label = "Preliminary"
            else:
                status = GapStatusEnum.INSUFFICIENT.value
                novelty = NoveltyStatusEnum.INSUFFICIENT_EVIDENCE.value
                critique = "Candidate gap lacks sufficient supporting evidence in the current indexed literature."
                strength_label = "Preliminary"

            eval_data = {
                "gap_id": gap.id,
                "status": status,
                "novelty_status": novelty,
                "confidence": conf_val,
                "evidence_strength": strength_label,
                "strength_display": f"{conf_val:.2f} / 1.00 ({strength_label})",
                "critique": critique,
                "missing_evidence": [f"Independent replication verifying {gap.title}"],
                "additional_queries": [f"{gap.title} comparative validation"],
                "evidence_count": evidence_count,
                "supporting_count": len(supporting_items),
                "counter_count": len(counter_items),
                "what_we_found": f"Indexed {len(supporting_items)} evidence snippets across {unique_supporting_papers} papers.",
                "why_this_is_a_gap": gap.description,
                "what_literature_does_not_establish": "Current literature has not established cross-experimental reproducibility.",
            }

        return eval_data
