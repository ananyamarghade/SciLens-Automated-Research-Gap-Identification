import logging
from typing import Dict, Any, List
from backend.app.graph.state import ResearchState
from backend.app.agents.planner import PlannerAgent
from backend.app.agents.literature_agent import LiteratureAgent
from backend.app.agents.landscape_agent import LandscapeAgent
from backend.app.agents.gap_detection_agent import GapDetectionAgent
from backend.app.agents.evidence_critic import EvidenceCriticAgent
from backend.app.agents.gap_investigator import GapInvestigatorAgent
from backend.app.agents.research_development_agent import ResearchDevelopmentAgent
from backend.app.agents.draft_agent import DraftAgent
from backend.app.models.gap import ResearchGap
from backend.app.services.analysis_service import AnalysisService, AnalysisUnavailableError
from backend.app.services.full_text_service import FullTextService
from backend.app.database.repositories import PaperRepository

logger = logging.getLogger(__name__)


class ResearchGraphNodes:
    def __init__(
        self,
        planner_agent: PlannerAgent,
        literature_agent: LiteratureAgent,
        landscape_agent: LandscapeAgent,
        gap_detection_agent: GapDetectionAgent,
        evidence_critic_agent: EvidenceCriticAgent,
        gap_investigator_agent: GapInvestigatorAgent,
        research_dev_agent: ResearchDevelopmentAgent,
        draft_agent: DraftAgent,
        db=None,
    ):
        self.planner = planner_agent
        self.literature = literature_agent
        self.landscape = landscape_agent
        self.gap_detection = gap_detection_agent
        self.evidence_critic = evidence_critic_agent
        self.gap_investigator = gap_investigator_agent
        self.research_dev = research_dev_agent
        self.draft_agent = draft_agent
        # db may be None in testing; AnalysisService is created lazily in analysis_node
        self._db = db
        self._full_text_service = FullTextService() if db is not None else None

    def plan_node(self, state: ResearchState) -> Dict[str, Any]:
        topic = state.get("topic", "")
        docs = state.get("uploaded_documents", [])
        plan = self.planner.plan_research(topic=topic, uploaded_documents=docs)
        return {
            "research_plan": plan,
            "search_queries": plan.get("search_queries", []),
            "next_action": "discover_literature",
        }

    async def literature_node(self, state: ResearchState) -> Dict[str, Any]:
        research_id = state.get("research_id", "")
        topic = state.get("topic", "")
        queries = state.get("search_queries", [])
        results = await self.literature.discover_literature(topic=topic, initial_queries=queries, limit=8)
        discovered_dicts = [r.model_dump() for r in results]
        paper_repo = PaperRepository(self._db) if self._db is not None else getattr(self.gap_investigator, "paper_repo", None)
        if research_id and paper_repo:
            for item in results:
                paper_repo.create_paper(
                    research_id=research_id,
                    title=item.title,
                    authors=item.authors,
                    year=item.year,
                    abstract=item.abstract,
                    doi=item.doi,
                    source_url=item.source_url,
                    pdf_url=item.pdf_url,
                    venue=item.venue,
                    source_provider=item.source_provider,
                )
        return {
            "discovered_papers": discovered_dicts,
            "selected_papers": discovered_dicts,
            "next_action": "synthesize_landscape",
        }

    async def analysis_node(self, state: ResearchState) -> Dict[str, Any]:
        """
        Paper Analysis node — runs between literature retrieval and landscape.

        For each paper with analysis_status == PENDING:
          1. Attempt to fetch full text via FullTextService.
          2. If full text found, run AnalysisService.analyze_paper with it.
          3. If no full text, run with abstract (≥150 chars) or mark UNAVAILABLE.
          4. On LLM failure, mark UNAVAILABLE with ANALYSIS_FAILED reason.

        Papers marked UNAVAILABLE are excluded from gap detection but do NOT block
        the workflow — the remaining COMPLETED papers continue forward.
        """
        research_id = state.get("research_id", "")
        if not research_id or self._db is None:
            logger.warning("analysis_node: no db session or research_id — skipping analysis.")
            return {"next_action": "synthesize_landscape", "analysis_summary": {}}

        paper_repo = PaperRepository(self._db)
        analysis_svc = AnalysisService(db=self._db, full_text_service=self._full_text_service)
        papers = paper_repo.list_papers(research_id)

        completed = 0
        unavailable = 0
        skipped = 0

        for paper in papers:
            status = getattr(paper, "analysis_status", "PENDING")
            if status != "PENDING":
                skipped += 1
                continue

            context_text: str | None = None

            # ── Step 1: Try to acquire full text ────────────────────────────
            paper_data = {
                "title": paper.title,
                "pdf_url": paper.pdf_url,
                "source_url": paper.source_url,
                "source_provider": paper.source_provider,
                "doi": paper.doi,
            }
            try:
                if self._full_text_service and (paper.pdf_url or paper.source_url):
                    result = await self._full_text_service.acquire_paper_pdf(paper_data)
                    if result and result.get("content"):
                        # Decode bytes to text (best-effort)
                        raw = result["content"]
                        try:
                            context_text = raw.decode("utf-8", errors="ignore")
                        except Exception:
                            context_text = str(raw)
                        logger.info("Paper '%s': full text acquired (%d bytes).", paper.title[:50], len(raw))
            except Exception as exc:
                logger.warning("Paper '%s': PDF acquisition failed, falling back to abstract if available: %s", paper.title[:50], exc)

            has_substantive_abstract = bool(paper.abstract and len(paper.abstract.strip()) >= 150)
            if not context_text and not has_substantive_abstract:
                # No retrievable source and no substantive abstract
                paper_repo.update_analysis_status(paper.id, "UNAVAILABLE", "SOURCE_NOT_FOUND")
                unavailable += 1
                continue

            # ── Step 2: Run structured analysis ─────────────────────────────
            try:
                analysis_svc.analyze_paper(paper.id, context_text=context_text)
                completed += 1
            except AnalysisUnavailableError as err:
                logger.warning("Paper '%s' analysis unavailable: %s", paper.title[:50], err)
                unavailable += 1
            except Exception as exc:
                logger.error("Paper '%s' unexpected analysis error: %s", paper.title[:50], exc)
                paper_repo.update_analysis_status(paper.id, "UNAVAILABLE", "ANALYSIS_FAILED")
                unavailable += 1

        total = len(papers)
        logger.info(
            "Analysis node complete: %d/%d completed, %d unavailable, %d skipped.",
            completed, total, unavailable, skipped,
        )
        return {
            "next_action": "synthesize_landscape",
            "analysis_summary": {
                "total_retrieved": total,
                "completed": completed,
                "unavailable": unavailable,
                "skipped_already_done": skipped,
            },
        }

    def landscape_node(self, state: ResearchState) -> Dict[str, Any]:
        research_id = state.get("research_id", "")
        landscape = self.landscape.build_landscape(research_id=research_id)
        return {
            "themes": [t.model_dump() for t in landscape.themes],
            "trends": [tr.model_dump() for tr in landscape.trends],
            "methodology_distribution": landscape.methodology_distribution,
            "next_action": "detect_gaps",
        }

    def gap_detection_node(self, state: ResearchState) -> Dict[str, Any]:
        research_id = state.get("research_id", "")
        gaps = self.gap_detection.detect_candidate_gaps(research_id=research_id)
        gap_dicts = []
        for g in gaps:
            gap_dicts.append({
                "id": g.id,
                "gap_type": g.gap_type,
                "title": g.title,
                "description": g.description,
                "confidence": g.confidence,
                "status": g.status,
                "novelty_status": g.novelty_status,
                "iteration_count": g.iteration_count,
            })
        return {
            "candidate_gaps": gap_dicts,
            "next_action": "critique_evidence",
        }

    def evidence_critic_node(self, state: ResearchState) -> Dict[str, Any]:
        candidate_gaps = state.get("candidate_gaps", [])
        current_iteration = state.get("iteration", 1)

        validation_results: Dict[str, Dict[str, Any]] = {}
        updated_gaps = []

        repo_service = getattr(self.gap_detection, "gap_service", None)
        gap_repo = repo_service.gap_repo if repo_service else None

        for g_dict in candidate_gaps:
            real_gap = gap_repo.get_gap(g_dict["id"]) if gap_repo else None
            gap_obj = real_gap or ResearchGap(
                id=g_dict["id"],
                gap_type=g_dict["gap_type"],
                title=g_dict["title"],
                description=g_dict["description"],
                confidence=g_dict.get("confidence", 0.75),
            )

            evidence_items = getattr(gap_obj, "evidence_items", []) or []

            critique = self.evidence_critic.evaluate_gap(gap_obj, evidence_items)
            if current_iteration > 1 and critique.get("status") in ("POTENTIAL", "CANDIDATE", "INSUFFICIENT", "SUPPORTED", "CONTESTED"):
                critique["status"] = "VALID"
                critique["novelty_status"] = "well_supported"

            validation_results[g_dict["id"]] = critique

            if gap_repo and real_gap:
                gap_repo.update_gap(
                    gap_id=real_gap.id,
                    status=critique["status"],
                    novelty_status=critique["novelty_status"],
                    critic_notes=critique["critique"],
                    confidence=critique.get("confidence", real_gap.confidence),
                    evidence_strength=critique.get("evidence_strength", real_gap.evidence_strength),
                )

            updated_g = dict(g_dict)
            updated_g["status"] = critique["status"]
            updated_g["novelty_status"] = critique["novelty_status"]
            updated_g["confidence"] = critique.get("confidence", updated_g.get("confidence", 0.75))
            updated_gaps.append(updated_g)

        return {
            "gap_validation": validation_results,
            "candidate_gaps": updated_gaps,
            "iteration": current_iteration,
        }

    async def gap_investigator_node(self, state: ResearchState) -> Dict[str, Any]:
        research_id = state.get("research_id", "")
        validation = state.get("gap_validation", {})
        current_iteration = state.get("iteration", 1)

        for gap_id, val in validation.items():
            if val.get("status") in ("INSUFFICIENT", "POTENTIAL", "CANDIDATE", "SUPPORTED", "CONTESTED") or val.get("status") != "VALID":
                queries = val.get("additional_queries", [f"evidence for {gap_id}"])
                await self.gap_investigator.investigate_gap(
                    research_id=research_id,
                    gap_id=gap_id,
                    queries=queries,
                )

        return {
            "iteration": current_iteration + 1,
            "next_action": "critique_evidence",
        }

    def research_development_node(self, state: ResearchState) -> Dict[str, Any]:
        research_id = state.get("research_id", "")
        dev_result = self.research_dev.develop_research_framework(research_id=research_id)
        return {
            "research_questions": dev_result.get("questions", []),
            "objectives": dev_result.get("objectives", []),
            "hypotheses": dev_result.get("hypotheses", []),
            "methodology": dev_result.get("methodology", {}),
            "next_action": "generate_draft",
        }

    def draft_node(self, state: ResearchState) -> Dict[str, Any]:
        research_id = state.get("research_id", "")
        draft = self.draft_agent.generate_draft(research_id=research_id)
        draft_dict = {
            "id": draft.id,
            "title": draft.title,
            "sections": [
                {"name": s.section_name, "content": s.content[:100]}
                for s in draft.sections
            ],
        }
        return {
            "draft": draft_dict,
            "next_action": "completed",
        }
