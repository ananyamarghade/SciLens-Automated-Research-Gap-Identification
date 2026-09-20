from backend.app.api.research import router as research_router
from backend.app.api.papers import router as papers_router
from backend.app.api.landscape import router as landscape_router
from backend.app.api.gaps import router as gaps_router
from backend.app.api.development import router as development_router
from backend.app.api.drafting import router as drafting_router
from backend.app.api.citations import router as citations_router
from backend.app.api.export import router as export_router
from backend.app.api.agent_activity import router as agent_activity_router

__all__ = [
    "research_router",
    "papers_router",
    "landscape_router",
    "gaps_router",
    "development_router",
    "drafting_router",
    "citations_router",
    "export_router",
    "agent_activity_router",
]
