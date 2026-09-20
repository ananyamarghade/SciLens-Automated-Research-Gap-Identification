from typing import Dict, Any, Optional
from backend.app.models.paper import PaperAnalysisSchema
from backend.app.services.analysis_service import AnalysisService


class PaperAnalysisAgent:
    def __init__(self, analysis_service: AnalysisService):
        self.analysis_service = analysis_service

    def analyze(self, paper_id: str, context_text: Optional[str] = None) -> PaperAnalysisSchema:
        return self.analysis_service.analyze_paper(paper_id=paper_id, context_text=context_text)
