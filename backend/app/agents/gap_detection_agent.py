from typing import List
from backend.app.models.gap import ResearchGap
from backend.app.services.gap_service import GapService


class GapDetectionAgent:
    def __init__(self, gap_service: GapService):
        self.gap_service = gap_service

    def detect_candidate_gaps(self, research_id: str) -> List[ResearchGap]:
        return self.gap_service.detect_gaps(research_id=research_id)
