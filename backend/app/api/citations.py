from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.repositories import CitationRepository, PaperRepository
from backend.app.models.citation import (
    CitationFormatRequest,
    FormattedCitationResponse,
    ReferenceResponse,
    CitationStyleEnum,
)
from backend.app.services.citation_service import CitationService

router = APIRouter(tags=["Citations & References"])


@router.post("/citations/format", response_model=FormattedCitationResponse)
def format_citation(
    payload: CitationFormatRequest,
    db: Session = Depends(get_db),
):
    service = CitationService()
    title = payload.title or ""
    authors = payload.authors or []
    year = payload.year
    venue = payload.venue
    doi = payload.doi
    url = payload.url

    if payload.paper_id:
        paper_repo = PaperRepository(db)
        paper = paper_repo.get_paper(payload.paper_id)
        if paper:
            title = paper.title
            authors = paper.authors or []
            year = paper.year
            venue = paper.venue
            doi = paper.doi
            url = paper.source_url

    return service.format_citation(
        style=payload.style,
        title=title,
        authors=authors,
        year=year,
        venue=venue,
        volume=payload.volume,
        issue=payload.issue,
        pages=payload.pages,
        doi=doi,
        url=url,
    )


@router.get("/research/{research_id}/references", response_model=List[ReferenceResponse])
def get_references(
    research_id: str,
    db: Session = Depends(get_db),
):
    paper_repo = PaperRepository(db)
    papers = paper_repo.list_papers(research_id)
    citation_service = CitationService()

    responses = []
    for idx, p in enumerate(papers):
        apa = citation_service.format_citation(
            style=CitationStyleEnum.APA7,
            title=p.title,
            authors=p.authors or [],
            year=p.year,
            venue=p.venue,
            doi=p.doi,
            url=p.source_url,
            index=idx + 1,
        )
        ieee = citation_service.format_citation(
            style=CitationStyleEnum.IEEE,
            title=p.title,
            authors=p.authors or [],
            year=p.year,
            venue=p.venue,
            doi=p.doi,
            url=p.source_url,
            index=idx + 1,
        )
        responses.append(
            ReferenceResponse(
                id=f"ref_{p.id}",
                research_id=research_id,
                paper_id=p.id,
                citation_key=f"ref_{idx + 1}",
                title=p.title,
                authors=p.authors or [],
                year=p.year,
                venue=p.venue,
                doi=p.doi,
                url=p.source_url,
                formatted={"apa7": apa.bibliography_entry, "ieee": ieee.bibliography_entry},
            )
        )
    return responses


@router.get("/research/{research_id}/citations")
def get_citations_by_style(
    research_id: str,
    style: str = "APA 7",
    db: Session = Depends(get_db),
):
    paper_repo = PaperRepository(db)
    papers = paper_repo.list_papers(research_id)
    citation_service = CitationService()

    style_enum = CitationStyleEnum.APA7
    lower = style.lower().replace(" ", "").replace("-", "")
    if "ieee" in lower:
        style_enum = CitationStyleEnum.IEEE
    elif "mla" in lower:
        style_enum = CitationStyleEnum.MLA9
    elif "harvard" in lower:
        style_enum = CitationStyleEnum.HARVARD
    elif "chicago" in lower:
        style_enum = CitationStyleEnum.CHICAGO
    elif "vancouver" in lower:
        style_enum = CitationStyleEnum.VANCOUVER

    formatted_list = []
    for idx, p in enumerate(papers):
        res = citation_service.format_citation(
            style=style_enum,
            title=p.title,
            authors=p.authors or [],
            year=p.year,
            venue=p.venue,
            doi=p.doi,
            url=p.source_url,
            index=idx + 1,
        )
        formatted_list.append({
            "id": f"cit_{p.id}",
            "paperId": p.id,
            "style": style,
            "inText": res.in_text_citation,
            "fullReference": res.bibliography_entry,
            "authors": p.authors or [],
            "year": p.year or 2024,
            "title": p.title,
            "venue": p.venue or "Academic Press",
            "doi": p.doi,
            "verified": bool(p.doi or p.source_url),
            "sourceAvailable": True,
        })
    return formatted_list
