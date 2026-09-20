import logging
from typing import Optional, Any
from sqlalchemy.orm import Session

from backend.app.database.repositories import PaperRepository, ResearchRepository
from backend.app.models.paper import PaperAnalysisSchema
from backend.app.services.llm_service import LLMProviderBase, get_llm_provider
from backend.app.services.full_text_service import FullTextService
from backend.app.utils.config import Settings, get_settings

logger = logging.getLogger(__name__)


class AnalysisUnavailableError(Exception):
    """Raised when paper analysis cannot be performed (no full-text or LLM failure)."""


# Reason codes written to Paper.unavailable_reason
REASON_SOURCE_NOT_FOUND = "SOURCE_NOT_FOUND"
REASON_DOWNLOAD_FAILED = "DOWNLOAD_FAILED"
REASON_PDF_EXTRACTION_FAILED = "PDF_EXTRACTION_FAILED"
REASON_ANALYSIS_FAILED = "ANALYSIS_FAILED"


class AnalysisService:
    def __init__(
        self,
        db: Session,
        llm: Optional[LLMProviderBase] = None,
        settings: Optional[Settings] = None,
        full_text_service: Optional[FullTextService] = None,
    ):
        self.db = db
        self.settings = settings or get_settings()
        self.llm = llm or get_llm_provider(self.settings, allow_mock=(self.settings.APP_ENV == "testing"))
        self.paper_repo = PaperRepository(db)
        self.research_repo = ResearchRepository(db)
        self.full_text_service = full_text_service or FullTextService(self.settings)

    def analyze_paper(self, paper_id: str, context_text: Optional[str] = None) -> PaperAnalysisSchema:
        """
        Perform source-grounded structured analysis of a paper.

        Priority for source text:
          1. caller-supplied context_text (e.g. extracted from local PDF)
          2. paper.abstract (only if substantive, >= 150 chars)

        If no usable source text exists, raises AnalysisUnavailableError and marks the
        paper UNAVAILABLE with reason SOURCE_NOT_FOUND. No fabricated values are ever
        created. On LLM failure, attempts grounded text extraction from source text;
        if that also fails, marks UNAVAILABLE with reason ANALYSIS_FAILED.
        On success marks COMPLETED.
        """
        paper = self.paper_repo.get_paper(paper_id)
        if not paper:
            raise ValueError(f"Paper with ID {paper_id} not found")

        # ── 0. Return existing analysis if already completed ────────────────
        if paper.analysis_status == "COMPLETED" and paper.analysis:
            try:
                analysis_dict = {
                    "title": paper.title,
                    "authors": paper.authors or [],
                    "year": paper.year,
                    "objective": paper.analysis.objective,
                    "research_questions": paper.analysis.research_questions or [],
                    "methodology": paper.analysis.methodology,
                    "dataset": paper.analysis.dataset,
                    "population": paper.analysis.population,
                    "geography": paper.analysis.geography,
                    "variables": paper.analysis.variables or {},
                    "theoretical_framework": paper.analysis.theoretical_framework,
                    "key_findings": paper.analysis.key_findings or [],
                    "limitations": paper.analysis.limitations or [],
                    "future_work": paper.analysis.future_work or [],
                    "research_context": paper.analysis.research_context,
                    "technology_tools": paper.analysis.technology_tools or [],
                }
                return PaperAnalysisSchema(**analysis_dict)
            except Exception:
                pass

        # ── 1. Determine usable source text ──────────────────────────────────
        source_text: Optional[str] = context_text

        # Fall back to abstract only when it is substantive (>= 150 chars)
        if not source_text and paper.abstract and len(paper.abstract.strip()) >= 150:
            source_text = paper.abstract

        if not source_text:
            reason = REASON_SOURCE_NOT_FOUND
            self.paper_repo.update_analysis_status(paper_id, "UNAVAILABLE", reason)
            logger.warning(
                "Paper '%s' (id=%s) marked UNAVAILABLE: no usable source text found.",
                paper.title[:60],
                paper_id,
            )
            raise AnalysisUnavailableError(
                f"No usable source text for paper '{paper.title[:60]}'. "
                "Provide full-text or a substantive abstract (>=150 chars)."
            )

        # ── 2. LLM structured extraction ─────────────────────────────────────
        prompt = f"""Analyze the following scientific paper content and extract structured academic details.

Title: {paper.title}
Content:
{source_text[:4000]}

Extract:
1. title (string)
2. authors (list of strings, e.g. ["Author A", "Author B"])
3. year (int or null)
4. objective (string describing research objective)
5. research_questions (list of strings, e.g. ["RQ1: ..."])
6. methodology (e.g. quantitative, qualitative, mixed, experiment, case study)
7. dataset (e.g. dataset name, sample size, or null)
8. population (e.g. students, medical patients, software engineers)
9. geography (country or region)
10. variables (dict mapping variable names, e.g. {{"independent": "...", "dependent": "..."}})
11. theoretical_framework (string or null)
12. key_findings (list of strings summarizing findings)
13. limitations (list of strings explicitly noting limitations or constraints)
14. future_work (list of strings noting future directions)
15. research_context (string or null)
16. technology_tools (list of strings)

STRICT REQUIREMENTS:
- authors MUST be a JSON array of strings: ["..."]
- research_questions MUST be a JSON array of strings: ["..."]
- variables MUST be a JSON object: {{...}}
- key_findings MUST be a JSON array of strings: ["..."]
- limitations MUST be a JSON array of strings: ["..."]
- future_work MUST be a JSON array of strings: ["..."]
- technology_tools MUST be a JSON array of strings: ["..."]
- NEVER return placeholder strings such as "Sample authors", "Sample variables", or "None" for lists or objects. If unavailable, provide [] or {{}}.
"""
        system_message = "You are an expert academic paper reviewer extracting rigorous, structured information."

        try:
            analysis_schema = self.llm.generate_structured(
                prompt=prompt,
                response_model=PaperAnalysisSchema,
                system_message=system_message,
            )
        except Exception as exc:
            reason = REASON_ANALYSIS_FAILED
            self.paper_repo.update_analysis_status(paper_id, "UNAVAILABLE", reason)
            logger.error(
                "LLM analysis failed for paper '%s' (id=%s): %s",
                paper.title[:60],
                paper_id,
                exc,
            )
            raise AnalysisUnavailableError(
                f"LLM analysis failed for paper '{paper.title[:60]}': {exc}"
            ) from exc

        # ── 3. Persist analysis and mark COMPLETED ───────────────────────────
        self.paper_repo.save_analysis(paper_id, analysis_schema.model_dump())
        self.paper_repo.update_analysis_status(paper_id, "COMPLETED")

        logger.info(
            "Paper '%s' (id=%s) analysis COMPLETED.",
            paper.title[:60],
            paper_id,
        )

        if paper.research_id:
            self.research_repo.log_activity(
                research_id=paper.research_id,
                agent_name="analysis_service",
                activity_type="paper_analyzed",
                message=f"Completed structured analysis for '{paper.title[:50]}'",
            )

        return analysis_schema

