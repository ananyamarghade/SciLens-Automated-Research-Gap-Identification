from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.repositories import GapRepository, ResearchRepository
from backend.app.models.gap import (
    ResearchGapSchema,
    GapEvidenceSchema,
    GapHeatmapData,
    UnderexploredArea,
    ContradictionResponse,
)
from backend.app.services.gap_service import GapService
from backend.app.agents.evidence_critic import EvidenceCriticAgent
from backend.app.agents.gap_investigator import GapInvestigatorAgent
from backend.app.services.llm_service import get_llm_provider
from backend.app.services.paper_search import PaperSearchService
from backend.app.services.full_text_service import FullTextService
from backend.app.rag.embeddings import get_embeddings_engine
from backend.app.rag.vector_store import FAISSVectorStore

router = APIRouter(prefix="/research/{research_id}", tags=["Research Gaps"])


@router.get("/gaps", response_model=List[ResearchGapSchema])
def list_gaps(
    research_id: str,
    db: Session = Depends(get_db),
):
    repo = GapRepository(db)
    gaps = repo.list_gaps(research_id)
    results = []
    for g in gaps:
        ev_items = [
            GapEvidenceSchema(
                id=e.id,
                paper_id=e.paper_id,
                document_id=e.document_id,
                paper_title=e.paper_title,
                page_number=e.page_number,
                section=e.section,
                chunk_id=e.chunk_id,
                snippet=e.snippet,
                source_url=e.source_url,
                retrieval_score=e.retrieval_score,
                confidence=e.confidence,
                evidence_strength=e.evidence_strength,
                is_supporting=bool(e.is_supporting),
                doi=getattr(e, "doi", None),
                exact_source_text=getattr(e, "exact_source_text", None),
                evidence_type=getattr(e, "evidence_type", "PARAPHRASE") or "PARAPHRASE",
                extraction_method=getattr(e, "extraction_method", "automated_analysis") or "automated_analysis",
                relevance_tier=getattr(e, "relevance_tier", "RELATED") or "RELATED",
            )
            for e in g.evidence_items
        ]
        results.append(
            ResearchGapSchema(
                id=g.id,
                research_id=g.research_id,
                gap_type=g.gap_type,
                title=g.title,
                description=g.description,
                affected_themes=g.affected_themes or [],
                evidence_strength=g.evidence_strength,
                confidence=g.confidence,
                status=g.status,
                novelty_status=g.novelty_status,
                critic_notes=g.critic_notes,
                derived_from=getattr(g, "derived_from", []) or [],
                cross_paper_pattern=getattr(g, "cross_paper_pattern", None),
                missing_evidence=getattr(g, "missing_evidence", None),
                confidence_rationale=getattr(g, "confidence_rationale", None),
                iteration_count=g.iteration_count,
                created_at=g.created_at,
                evidence=ev_items,
            )
        )
    return results


@router.get("/gaps/heatmap", response_model=GapHeatmapData)
def get_gap_heatmap(
    research_id: str,
    db: Session = Depends(get_db),
):
    service = GapService(db)
    return service.get_heatmap_data(research_id)


@router.get("/gaps/underexplored", response_model=List[UnderexploredArea])
def get_underexplored_areas(
    research_id: str,
    db: Session = Depends(get_db),
):
    service = GapService(db)
    return service.get_underexplored_areas(research_id)


@router.get("/contradictions", response_model=List[ContradictionResponse])
def get_contradictions(
    research_id: str,
    db: Session = Depends(get_db),
):
    repo = GapRepository(db)
    contradictions = repo.list_contradictions(research_id)
    return [
        ContradictionResponse(
            id=c.id,
            topic=c.topic,
            paper_a_id=c.paper_a_id,
            paper_a_title=c.paper_a_title,
            finding_a=c.finding_a,
            paper_b_id=c.paper_b_id,
            paper_b_title=c.paper_b_title,
            finding_b=c.finding_b,
            context=c.context,
            methodology_differences=c.methodology_differences,
            population_differences=c.population_differences,
            possible_explanation=c.possible_explanation,
            contradiction_type=c.contradiction_type,
            evidence=c.evidence or [],
        )
        for c in contradictions
    ]


@router.get("/gaps/{gap_id}", response_model=ResearchGapSchema)
def get_gap(
    research_id: str,
    gap_id: str,
    db: Session = Depends(get_db),
):
    repo = GapRepository(db)
    g = repo.get_gap(gap_id)
    if not g or g.research_id != research_id:
        raise HTTPException(status_code=404, detail="Research gap not found")

    ev_items = [
        GapEvidenceSchema(
            id=e.id,
            paper_id=e.paper_id,
            document_id=e.document_id,
            paper_title=e.paper_title,
            page_number=e.page_number,
            section=e.section,
            chunk_id=e.chunk_id,
            snippet=e.snippet,
            source_url=e.source_url,
            retrieval_score=e.retrieval_score,
            confidence=e.confidence,
            evidence_strength=e.evidence_strength,
            is_supporting=bool(e.is_supporting),
            doi=getattr(e, "doi", None),
            exact_source_text=getattr(e, "exact_source_text", None),
            evidence_type=getattr(e, "evidence_type", "PARAPHRASE") or "PARAPHRASE",
            extraction_method=getattr(e, "extraction_method", "automated_analysis") or "automated_analysis",
            relevance_tier=getattr(e, "relevance_tier", "RELATED") or "RELATED",
        )
        for e in g.evidence_items
    ]

    return ResearchGapSchema(
        id=g.id,
        research_id=g.research_id,
        gap_type=g.gap_type,
        title=g.title,
        description=g.description,
        affected_themes=g.affected_themes or [],
        evidence_strength=g.evidence_strength,
        confidence=g.confidence,
        status=g.status,
        novelty_status=g.novelty_status,
        critic_notes=g.critic_notes,
        derived_from=getattr(g, "derived_from", []) or [],
        cross_paper_pattern=getattr(g, "cross_paper_pattern", None),
        missing_evidence=getattr(g, "missing_evidence", None),
        confidence_rationale=getattr(g, "confidence_rationale", None),
        iteration_count=g.iteration_count,
        created_at=g.created_at,
        evidence=ev_items,
    )


@router.post("/gaps/detect", response_model=List[ResearchGapSchema])
def trigger_gap_detection(
    research_id: str,
    db: Session = Depends(get_db),
):
    service = GapService(db)
    service.detect_gaps(research_id)
    all_papers = service.paper_repo.list_papers(research_id)
    analyzed_papers = service.paper_repo.list_analyzed_papers(research_id)
    if all_papers and not analyzed_papers:
        reasons = [p.unavailable_reason for p in all_papers if p.unavailable_reason]
        reason_info = f" (reasons: {set(reasons)})" if reasons else ""
        raise HTTPException(
            status_code=422,
            detail=f"Upstream paper analysis failed for all {len(all_papers)} retrieved papers{reason_info}. Cannot detect research gaps without analyzed evidence.",
        )
    return list_gaps(research_id=research_id, db=db)


@router.post("/gaps/{gap_id}/investigate")
async def investigate_gap(
    research_id: str,
    gap_id: str,
    db: Session = Depends(get_db),
):
    repo = GapRepository(db)
    gap = repo.get_gap(gap_id)
    if not gap or gap.research_id != research_id:
        raise HTTPException(status_code=404, detail="Research gap not found")

    search_service = PaperSearchService()
    full_text_service = FullTextService()
    embeddings = get_embeddings_engine()
    vector_store = FAISSVectorStore(dimension=embeddings.dimension)

    llm = get_llm_provider()
    investigator = GapInvestigatorAgent(
        db=db,
        search_service=search_service,
        full_text_service=full_text_service,
        embeddings=embeddings,
        vector_store=vector_store,
        llm=llm,
    )

    queries = [f"{gap.title} empirical evaluation", f"{gap.gap_type} benchmark study"]
    result = await investigator.investigate_gap(
        research_id=research_id,
        gap_id=gap_id,
        queries=queries,
    )
    return result


@router.post("/gaps/{gap_id}/validate")
def validate_gap(
    research_id: str,
    gap_id: str,
    db: Session = Depends(get_db),
):
    repo = GapRepository(db)
    gap = repo.get_gap(gap_id)
    if not gap or gap.research_id != research_id:
        raise HTTPException(status_code=404, detail="Research gap not found")

    llm = get_llm_provider()
    critic = EvidenceCriticAgent(llm)
    evaluation = critic.evaluate_gap(gap, gap.evidence_items)

    repo.update_gap(
        gap_id=gap.id,
        status=evaluation["status"],
        novelty_status=evaluation["novelty_status"],
        critic_notes=evaluation["critique"],
        confidence=evaluation.get("confidence", gap.confidence),
        evidence_strength=evaluation.get("evidence_strength", gap.evidence_strength),
    )

    return evaluation
