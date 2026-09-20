from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.repositories import ResearchRepository, PaperRepository
from backend.app.models.research import (
    ResearchProjectCreate,
    ResearchProjectResponse,
    ResearchStatusResponse,
)
from backend.app.services.research_service import ResearchService
from backend.app.services.paper_search import PaperSearchService

router = APIRouter(prefix="/research", tags=["Research"])


@router.post("", response_model=ResearchProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_research_project(
    payload: ResearchProjectCreate,
    db: Session = Depends(get_db),
):
    repo = ResearchRepository(db)
    project = repo.create_project(
        title=payload.title,
        topic=payload.topic,
        description=payload.description,
        configuration=payload.configuration,
    )
    search_service = PaperSearchService()
    try:
        results = await search_service.search(queries=[payload.topic], limit=10)
        paper_repo = PaperRepository(db)
        for item in results:
            paper_repo.create_paper(
                research_id=project.id,
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
    except Exception:
        pass
    return project


@router.get("", response_model=List[ResearchProjectResponse])
def list_research_projects(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    repo = ResearchRepository(db)
    return repo.list_projects(limit=limit)


@router.get("/{research_id}", response_model=ResearchProjectResponse)
def get_research_project(
    research_id: str,
    db: Session = Depends(get_db),
):
    repo = ResearchRepository(db)
    project = repo.get_project(research_id)
    if not project:
        raise HTTPException(status_code=404, detail="Research project not found")
    return project


@router.post("/{research_id}/start", response_model=ResearchStatusResponse)
async def start_research_workflow(
    research_id: str,
    db: Session = Depends(get_db),
):
    repo = ResearchRepository(db)
    project = repo.get_project(research_id)
    if not project:
        raise HTTPException(status_code=404, detail="Research project not found")

    research_service = ResearchService()
    job_id = research_service.start_research_workflow(research_id=research_id, db=db)

    return ResearchStatusResponse(
        research_id=research_id,
        status="planning",
        progress=0.05,
        current_agent="planner",
        active_job_id=job_id,
        updated_at=project.updated_at,
    )


@router.get("/{research_id}/status", response_model=ResearchStatusResponse)
def get_research_status(
    research_id: str,
    db: Session = Depends(get_db),
):
    repo = ResearchRepository(db)
    project = repo.get_project(research_id)
    if not project:
        raise HTTPException(status_code=404, detail="Research project not found")

    latest_job = repo.get_latest_job(research_id)

    return ResearchStatusResponse(
        research_id=research_id,
        status=project.status,
        progress=project.progress,
        current_agent=latest_job.current_agent if latest_job else "planner",
        active_job_id=latest_job.id if latest_job else None,
        error_message=latest_job.error_message if latest_job else None,
        updated_at=project.updated_at,
    )
