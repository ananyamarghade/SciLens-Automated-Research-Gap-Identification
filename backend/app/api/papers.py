from typing import List, Optional, Union
import math
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.repositories import PaperRepository, ResearchRepository
from backend.app.models.research import (
    ResearchDocumentResponse,
    DocumentUploadResultItem,
    BatchUploadResponse,
)
from backend.app.models.paper import (
    PaperResponse,
    PaginatedPapersResponse,
    PaperSearchRequest,
    PaperDiscoverRequest,
    PaperSearchResultItem,
    PaperAnalysisSchema,
    PaperCompareRequest,
    PaperCompareResponse,
)
from backend.app.services.paper_service import PaperService
from backend.app.services.paper_search import PaperSearchService
from backend.app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/research/{research_id}", tags=["Papers & Documents"])


@router.post("/documents", response_model=Union[BatchUploadResponse, List[ResearchDocumentResponse]], status_code=status.HTTP_201_CREATED)
async def upload_documents(
    research_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    research_repo = ResearchRepository(db)
    project = research_repo.get_project(research_id)
    if not project:
        raise HTTPException(status_code=404, detail="Research project not found")

    paper_service = PaperService(db)
    results: List[DocumentUploadResultItem] = []

    for file in files:
        fname = file.filename or "uploaded_file"
        file_bytes = await file.read()

        # Check if file is a ZIP archive
        is_zip = fname.lower().endswith(".zip") or file_bytes.startswith(b"PK\x03\x04")

        if is_zip:
            try:
                zip_results = paper_service.process_uploaded_zip(
                    research_id=research_id,
                    filename=fname,
                    zip_bytes=file_bytes,
                )
                for item in zip_results:
                    results.append(DocumentUploadResultItem(
                        filename=item.get("filename", fname),
                        status=item.get("status", "failed"),
                        document_id=item.get("document_id"),
                        paper_id=item.get("paper_id"),
                        pages=item.get("pages"),
                        chunks=item.get("chunks"),
                        error=item.get("error"),
                        extracted_from=fname,
                    ))
            except Exception as err:
                results.append(DocumentUploadResultItem(
                    filename=fname,
                    status="failed",
                    error=f"ZIP extraction error: {str(err)}",
                ))
        else:
            # Process as PDF
            try:
                pdf_res = paper_service.process_uploaded_pdf(
                    research_id=research_id,
                    filename=fname if fname.lower().endswith(".pdf") else f"{fname}.pdf",
                    file_bytes=file_bytes,
                )
                results.append(DocumentUploadResultItem(
                    filename=pdf_res.get("filename", fname),
                    status="completed",
                    document_id=pdf_res.get("document_id"),
                    paper_id=pdf_res.get("paper_id"),
                    pages=pdf_res.get("pages"),
                    chunks=pdf_res.get("chunks"),
                ))
            except Exception as err:
                results.append(DocumentUploadResultItem(
                    filename=fname,
                    status="failed",
                    error=str(err),
                ))

    docs = research_repo.list_documents(research_id)
    doc_responses = [ResearchDocumentResponse.model_validate(d) for d in docs]
    processed = sum(1 for r in results if r.status == "completed")
    failed = sum(1 for r in results if r.status == "failed")

    return BatchUploadResponse(
        total_files_received=len(files),
        processed_count=processed,
        failed_count=failed,
        results=results,
        documents=doc_responses,
    )



@router.get("/documents", response_model=List[ResearchDocumentResponse])
def list_documents(
    research_id: str,
    db: Session = Depends(get_db),
):
    repo = ResearchRepository(db)
    return repo.list_documents(research_id)


@router.get("/papers", response_model=Union[PaginatedPapersResponse, List[PaperResponse]])
def list_papers(
    research_id: str,
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=200),
    db: Session = Depends(get_db),
):
    repo = PaperRepository(db)
    papers = repo.list_papers(research_id)
    total = len(papers)

    is_paginated = page is not None and page_size is not None
    if is_paginated:
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        selected_papers = papers[start_idx:end_idx]
    else:
        selected_papers = papers

    results = []
    for p in selected_papers:
        analysis_data = None
        if p.analysis:
            analysis_data = PaperAnalysisSchema(
                title=p.title,
                authors=p.authors or [],
                year=p.year,
                objective=p.analysis.objective,
                research_questions=p.analysis.research_questions or [],
                methodology=p.analysis.methodology,
                dataset=p.analysis.dataset,
                population=p.analysis.population,
                geography=p.analysis.geography,
                variables=p.analysis.variables or {},
                theoretical_framework=p.analysis.theoretical_framework,
                key_findings=p.analysis.key_findings or [],
                limitations=p.analysis.limitations or [],
                future_work=p.analysis.future_work or [],
                research_context=p.analysis.research_context,
                technology_tools=p.analysis.technology_tools or [],
            )
        elif len(results) < 3:
            try:
                analysis_data = AnalysisService(db).analyze_paper(p.id)
            except Exception:
                analysis_data = None
        results.append(
            PaperResponse(
                id=p.id,
                research_id=p.research_id,
                document_id=p.document_id,
                title=p.title,
                authors=p.authors or [],
                year=p.year,
                abstract=p.abstract,
                doi=p.doi,
                source_url=p.source_url,
                pdf_url=p.pdf_url,
                citation_count=p.citation_count,
                venue=p.venue,
                source_provider=p.source_provider,
                is_uploaded=p.is_uploaded,
                relevance_tier=getattr(p, "relevance_tier", "RELATED") or "RELATED",
                created_at=p.created_at,
                analysis=analysis_data,
            )
        )

    if is_paginated:
        total_pages = math.ceil(total / page_size) if page_size > 0 else 1
        return PaginatedPapersResponse(
            items=results,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    return results


@router.get("/papers/{paper_id}", response_model=PaperResponse)
def get_paper(
    research_id: str,
    paper_id: str,
    db: Session = Depends(get_db),
):
    repo = PaperRepository(db)
    p = repo.get_paper(paper_id)
    if not p or p.research_id != research_id:
        raise HTTPException(status_code=404, detail="Paper not found")

    analysis_data = None
    if p.analysis:
        analysis_data = PaperAnalysisSchema(
            title=p.title,
            authors=p.authors or [],
            year=p.year,
            objective=p.analysis.objective,
            research_questions=p.analysis.research_questions or [],
            methodology=p.analysis.methodology,
            dataset=p.analysis.dataset,
            population=p.analysis.population,
            geography=p.analysis.geography,
            variables=p.analysis.variables or {},
            theoretical_framework=p.analysis.theoretical_framework,
            key_findings=p.analysis.key_findings or [],
            limitations=p.analysis.limitations or [],
            future_work=p.analysis.future_work or [],
            research_context=p.analysis.research_context,
            technology_tools=p.analysis.technology_tools or [],
        )
    else:
        try:
            analysis_data = AnalysisService(db).analyze_paper(p.id)
        except Exception:
            analysis_data = None

    return PaperResponse(
        id=p.id,
        research_id=p.research_id,
        document_id=p.document_id,
        title=p.title,
        authors=p.authors or [],
        year=p.year,
        abstract=p.abstract,
        doi=p.doi,
        source_url=p.source_url,
        pdf_url=p.pdf_url,
        citation_count=p.citation_count,
        venue=p.venue,
        source_provider=p.source_provider,
        is_uploaded=p.is_uploaded,
        relevance_tier=getattr(p, "relevance_tier", "RELATED") or "RELATED",
        created_at=p.created_at,
        analysis=analysis_data,
    )


@router.post("/papers/search", response_model=List[PaperSearchResultItem])
async def search_papers(
    research_id: str,
    payload: PaperSearchRequest,
    db: Session = Depends(get_db),
):
    search_service = PaperSearchService()
    results = await search_service.search(
        queries=[payload.query],
        limit=payload.limit,
        target_providers=payload.providers,
    )
    repo = PaperRepository(db)
    for item in results:
        repo.create_paper(
            research_id=research_id,
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
    return results


@router.post("/papers/discover", response_model=List[PaperSearchResultItem])
async def discover_papers(
    research_id: str,
    payload: PaperDiscoverRequest,
    db: Session = Depends(get_db),
):
    search_service = PaperSearchService()
    results = await search_service.discover_for_topic(
        topic=payload.topic,
        target_count=payload.limit,
        target_providers=payload.providers,
    )
    repo = PaperRepository(db)
    for item in results:
        repo.create_paper(
            research_id=research_id,
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
    return results



@router.post("/papers/{paper_id}/analyze", response_model=PaperAnalysisSchema)
def analyze_paper(
    research_id: str,
    paper_id: str,
    db: Session = Depends(get_db),
):
    analysis_service = AnalysisService(db)
    return analysis_service.analyze_paper(paper_id=paper_id)


@router.post("/papers/compare", response_model=PaperCompareResponse)
def compare_papers(
    research_id: str,
    payload: PaperCompareRequest,
    db: Session = Depends(get_db),
):
    paper_service = PaperService(db)
    return paper_service.compare_papers(research_id=research_id, paper_ids=payload.paper_ids)
