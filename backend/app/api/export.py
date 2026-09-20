from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.repositories import DraftRepository, ResearchRepository
from backend.app.services.draft_service import DraftService
from backend.app.services.export_service import ExportService

router = APIRouter(prefix="/research/{research_id}/export", tags=["Export"])


@router.api_route("/docx", methods=["GET", "POST"])
def export_docx(
    research_id: str,
    target: Optional[str] = Query("draft", description="'draft' or 'review'"),
    db: Session = Depends(get_db),
):
    export_service = ExportService()
    research_repo = ResearchRepository(db)
    project = research_repo.get_project(research_id)
    topic = project.topic if project else "Scientific Research"

    if target == "review":
        service = DraftService(db)
        review_data = service.generate_literature_review(research_id)
        docx_bytes = export_service.export_literature_review_to_docx(review_data.model_dump(), topic=topic)
        filename = f"scilens_lit_review_{research_id[:8]}.docx"
    else:
        draft_repo = DraftRepository(db)
        draft = draft_repo.get_draft(research_id)
        if not draft:
            service = DraftService(db)
            draft = service.generate_full_draft(research_id)
        docx_bytes = export_service.export_to_docx(draft)
        filename = f"scilens_research_{research_id[:8]}.docx"

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.api_route("/pdf", methods=["GET", "POST"])
def export_pdf(
    research_id: str,
    target: Optional[str] = Query("draft", description="'draft' or 'review'"),
    db: Session = Depends(get_db),
):
    export_service = ExportService()
    research_repo = ResearchRepository(db)
    project = research_repo.get_project(research_id)
    topic = project.topic if project else "Scientific Research"

    if target == "review":
        service = DraftService(db)
        review_data = service.generate_literature_review(research_id)
        pdf_bytes = export_service.export_literature_review_to_pdf(review_data.model_dump(), topic=topic)
        filename = f"scilens_lit_review_{research_id[:8]}.pdf"
    else:
        draft_repo = DraftRepository(db)
        draft = draft_repo.get_draft(research_id)
        if not draft:
            service = DraftService(db)
            draft = service.generate_full_draft(research_id)
        pdf_bytes = export_service.export_to_pdf(draft)
        filename = f"scilens_research_{research_id[:8]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.api_route("/md", methods=["GET", "POST"])
@router.api_route("/markdown", methods=["GET", "POST"])
def export_markdown(
    research_id: str,
    target: Optional[str] = Query("draft", description="'draft' or 'review'"),
    db: Session = Depends(get_db),
):
    export_service = ExportService()
    research_repo = ResearchRepository(db)
    project = research_repo.get_project(research_id)
    topic = project.topic if project else "Scientific Research"

    if target == "review":
        service = DraftService(db)
        review_data = service.generate_literature_review(research_id)
        md_bytes = export_service.export_literature_review_to_markdown(review_data.model_dump(), topic=topic)
        filename = f"scilens_lit_review_{research_id[:8]}.md"
    else:
        draft_repo = DraftRepository(db)
        draft = draft_repo.get_draft(research_id)
        if not draft:
            service = DraftService(db)
            draft = service.generate_full_draft(research_id)
        md_bytes = export_service.export_to_markdown(draft)
        filename = f"scilens_research_{research_id[:8]}.md"

    return Response(
        content=md_bytes,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

