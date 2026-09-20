from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.repositories import ResearchRepository
from backend.app.models.research import AgentActivityResponse

router = APIRouter(prefix="/research/{research_id}", tags=["Agent Activity"])


@router.get("/agent-activity", response_model=List[AgentActivityResponse])
def get_agent_activity(
    research_id: str,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    repo = ResearchRepository(db)
    if not repo.get_project(research_id):
        raise HTTPException(status_code=404, detail="Research project not found")

    activities = repo.list_activities(research_id=research_id, limit=limit)
    return [
        AgentActivityResponse(
            id=a.id,
            research_id=a.research_id,
            agent_name=a.agent_name,
            activity_type=a.activity_type,
            message=a.message,
            details=a.details,
            timestamp=a.timestamp,
        )
        for a in activities
    ]
