from backend.app.models.gap import ResearchLandscapeResponse
from backend.app.services.landscape_service import LandscapeService


class LandscapeAgent:
    def __init__(self, landscape_service: LandscapeService):
        self.landscape_service = landscape_service

    def build_landscape(self, research_id: str) -> ResearchLandscapeResponse:
        return self.landscape_service.generate_landscape(research_id=research_id)
