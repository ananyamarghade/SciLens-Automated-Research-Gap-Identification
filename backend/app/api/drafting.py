from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.repositories import DraftRepository, ResearchRepository
from backend.app.models.draft import (
    DraftSchema,
    DraftSectionSchema,
    DraftGenerationRequest,
    DraftSectionCreateRequest,
    DraftSectionUpdateRequest,
    ClaimVerificationRequest,
    ClaimVerificationResponse,
    LiteratureReviewRequest,
    LiteratureReviewResponse,
)
from backend.app.services.draft_service import DraftService
from backend.app.rag.embeddings import get_embeddings_engine
from backend.app.rag.vector_store import FAISSVectorStore
from backend.app.rag.retriever import ResearchRetriever

router = APIRouter(prefix="/research/{research_id}/draft", tags=["Drafting & Claim Verification"])


@router.get("", response_model=DraftSchema)
def get_draft(
    research_id: str,
    db: Session = Depends(get_db),
):
    repo = DraftRepository(db)
    draft = repo.get_draft(research_id)
    if not draft:
        service = DraftService(db)
        draft = service.generate_full_draft(research_id)

    sections = [
        DraftSectionSchema(
            id=s.id,
            draft_id=s.draft_id,
            section_name=s.section_name,
            content=s.content,
            order_index=s.order_index,
            citations=s.citations or [],
        )
        for s in draft.sections
    ]

    return DraftSchema(
        id=draft.id,
        research_id=draft.research_id,
        title=draft.title,
        status=draft.status,
        version=draft.version,
        created_at=draft.created_at,
        updated_at=draft.updated_at,
        sections=sections,
    )


@router.post("", response_model=DraftSchema)
def generate_draft(
    research_id: str,
    payload: Optional[DraftGenerationRequest] = None,
    db: Session = Depends(get_db),
):
    service = DraftService(db)
    gap_id = payload.gap_id if payload else None
    draft = service.generate_full_draft(research_id=research_id, gap_id=gap_id)

    sections = [
        DraftSectionSchema(
            id=s.id,
            draft_id=s.draft_id,
            section_name=s.section_name,
            content=s.content,
            order_index=s.order_index,
            citations=s.citations or [],
        )
        for s in draft.sections
    ]

    return DraftSchema(
        id=draft.id,
        research_id=draft.research_id,
        title=draft.title,
        status=draft.status,
        version=draft.version,
        created_at=draft.created_at,
        updated_at=draft.updated_at,
        sections=sections,
    )


@router.post("/section", response_model=DraftSectionSchema)
def generate_section(
    research_id: str,
    payload: DraftSectionCreateRequest,
    db: Session = Depends(get_db),
):
    service = DraftService(db)
    section = service.generate_or_update_section(
        research_id=research_id,
        section_name=payload.section_name,
        user_guidance=payload.user_guidance,
    )
    return DraftSectionSchema(
        id=section.id,
        draft_id=section.draft_id,
        section_name=section.section_name,
        content=section.content,
        order_index=section.order_index,
        citations=section.citations or [],
    )


@router.put("/section/{section_id}", response_model=DraftSectionSchema)
def update_section(
    research_id: str,
    section_id: str,
    payload: DraftSectionUpdateRequest,
    db: Session = Depends(get_db),
):
    repo = DraftRepository(db)
    section = repo.get_section(section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Draft section not found")

    section.content = payload.content
    if payload.citations is not None:
        section.citations = payload.citations
    db.commit()
    db.refresh(section)

    return DraftSectionSchema(
        id=section.id,
        draft_id=section.draft_id,
        section_name=section.section_name,
        content=section.content,
        order_index=section.order_index,
        citations=section.citations or [],
    )


@router.post("/verify-claim", response_model=ClaimVerificationResponse)
def verify_claim(
    research_id: str,
    payload: ClaimVerificationRequest,
    db: Session = Depends(get_db),
):
    embeddings = get_embeddings_engine()
    vector_store = FAISSVectorStore(dimension=embeddings.dimension)
    retriever = ResearchRetriever(embeddings=embeddings, vector_store=vector_store)
    service = DraftService(db, retriever=retriever)
    return service.verify_claim(research_id=research_id, claim=payload.claim)


@router.post("/literature-review", response_model=LiteratureReviewResponse)
def generate_literature_review_endpoint(
    research_id: str,
    payload: Optional[LiteratureReviewRequest] = None,
    db: Session = Depends(get_db),
):
    service = DraftService(db)
    selected_gap_ids = payload.selected_gap_ids if payload else None
    review_depth = payload.review_depth if payload else "Detailed"
    organization = payload.organization if payload else "Thematic"
    citation_style = payload.citation_style if payload else "APA 7"
    return service.generate_literature_review(
        research_id=research_id,
        selected_gap_ids=selected_gap_ids,
        review_depth=review_depth,
        organization=organization,
        citation_style=citation_style,
    )
