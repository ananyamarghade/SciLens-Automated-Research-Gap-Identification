from typing import Optional
from backend.app.models.draft import Draft
from backend.app.services.draft_service import DraftService


class DraftAgent:
    def __init__(self, draft_service: DraftService):
        self.draft_service = draft_service

    def generate_draft(self, research_id: str, gap_id: Optional[str] = None) -> Draft:
        return self.draft_service.generate_full_draft(research_id=research_id, gap_id=gap_id)
