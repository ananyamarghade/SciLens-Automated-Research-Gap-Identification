from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.repositories import GapRepository, ResearchRepository
from backend.app.models.gap import (
    ResearchLandscapeResponse,
    ResearchThemeResponse,
    ResearchTrendResponse,
    PaperRelationshipNetwork,
)
from backend.app.services.landscape_service import LandscapeService

router = APIRouter(prefix="/research/{research_id}", tags=["Landscape"])


@router.get("/landscape", response_model=ResearchLandscapeResponse)
def get_landscape(
    research_id: str,
    db: Session = Depends(get_db),
):
    research_repo = ResearchRepository(db)
    if not research_repo.get_project(research_id):
        raise HTTPException(status_code=404, detail="Research project not found")

    service = LandscapeService(db)
    return service.generate_landscape(research_id)


@router.get("/themes", response_model=List[ResearchThemeResponse])
def get_themes(
    research_id: str,
    db: Session = Depends(get_db),
):
    gap_repo = GapRepository(db)
    themes = gap_repo.list_themes(research_id)
    return [
        ResearchThemeResponse(
            id=t.id,
            research_id=t.research_id,
            name=t.name,
            description=t.description,
            keywords=t.keywords or [],
            paper_count=t.paper_count,
            paper_ids=t.paper_ids or [],
        )
        for t in themes
    ]


@router.get("/trends", response_model=List[ResearchTrendResponse])
def get_trends(
    research_id: str,
    db: Session = Depends(get_db),
):
    gap_repo = GapRepository(db)
    trends = gap_repo.list_trends(research_id)
    return [
        ResearchTrendResponse(
            year=tr.year,
            paper_count=tr.paper_count,
            themes=tr.themes or [],
            emerging_themes=tr.emerging_themes or [],
        )
        for tr in trends
    ]


@router.get("/methodologies", response_model=Dict[str, int])
def get_methodologies(
    research_id: str,
    db: Session = Depends(get_db),
):
    service = LandscapeService(db)
    landscape = service.generate_landscape(research_id)
    return landscape.methodology_distribution


@router.get("/network", response_model=PaperRelationshipNetwork)
def get_network(
    research_id: str,
    db: Session = Depends(get_db),
):
    service = LandscapeService(db)
    landscape = service.generate_landscape(research_id)
    return landscape.network
