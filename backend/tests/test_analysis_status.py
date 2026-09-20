"""
Tests for the mandatory paper analysis lifecycle and fake-fallback removal.

Scenarios covered:
1. Paper with substantive abstract → analysis_status COMPLETED
2. Paper without source (no pdf_url, no source_url, no abstract) → UNAVAILABLE / SOURCE_NOT_FOUND
3. LLM failure → UNAVAILABLE / ANALYSIS_FAILED, no PaperAnalysis record
4. Gap detection uses only COMPLETED papers; UNAVAILABLE papers are excluded
5. Zero eligible papers → detect_gaps returns [] (NO_EVIDENCE_AVAILABLE)
6. Metadata-only paper stays UNAVAILABLE and is excluded from gap detection
7. No fabricated analysis data appears when LLM fails
"""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock

from backend.app.database.repositories import PaperRepository, ResearchRepository
from backend.app.services.analysis_service import AnalysisService, AnalysisUnavailableError
from backend.app.services.gap_service import GapService
from backend.app.models.paper import PaperAnalysis, PaperAnalysisSchema


# ─────────────────────────────────────────────────────────────
# Scenario 1: Substantive abstract → COMPLETED
# ─────────────────────────────────────────────────────────────
def test_analysis_completed_with_abstract(db_session):
    """A paper with a substantive abstract (≥150 chars) should be marked COMPLETED after analysis."""
    research_repo = ResearchRepository(db_session)
    paper_repo = PaperRepository(db_session)
    project = research_repo.create_project(title="Test Project", topic="Quantum Computing")
    paper = paper_repo.create_paper(
        research_id=project.id,
        title="Quantum Error Correction Overview",
        authors=["Alice"],
        year=2024,
        abstract="A" * 200,  # substantive abstract
    )

    # Use a MagicMock LLM that returns a valid PaperAnalysisSchema
    llm = MagicMock()
    llm.generate_structured.return_value = PaperAnalysisSchema(
        title=paper.title,
        authors=["Alice"],
        year=2024,
        objective="Study quantum error correction methods.",
        methodology="Experimental",
        key_findings=["Finding A"],
        limitations=["Small sample size"],
    )

    svc = AnalysisService(db=db_session, llm=llm)
    svc.analyze_paper(paper.id)

    db_session.refresh(paper)
    assert paper.analysis_status == "COMPLETED"
    assert paper.unavailable_reason is None

    # Verify PaperAnalysis was saved
    analysis = db_session.query(PaperAnalysis).filter_by(paper_id=paper.id).first()
    assert analysis is not None


# ─────────────────────────────────────────────────────────────
# Scenario 2: No source → UNAVAILABLE / SOURCE_NOT_FOUND
# ─────────────────────────────────────────────────────────────
def test_analysis_unavailable_no_source(db_session, mock_llm):
    """A paper with no pdf_url, no source_url, and a short (< 150 char) abstract
    should be marked UNAVAILABLE with reason SOURCE_NOT_FOUND."""
    research_repo = ResearchRepository(db_session)
    paper_repo = PaperRepository(db_session)
    project = research_repo.create_project(title="Test2", topic="ML")
    paper = paper_repo.create_paper(
        research_id=project.id,
        title="Short Paper",
        authors=["Bob"],
        year=2023,
        abstract="Too short.",  # < 150 chars
        # No pdf_url, no source_url
    )

    svc = AnalysisService(db=db_session, llm=mock_llm)
    with pytest.raises(AnalysisUnavailableError):
        svc.analyze_paper(paper.id)

    db_session.refresh(paper)
    assert paper.analysis_status == "UNAVAILABLE"
    assert paper.unavailable_reason == "SOURCE_NOT_FOUND"

    # No PaperAnalysis should be created
    analysis = db_session.query(PaperAnalysis).filter_by(paper_id=paper.id).first()
    assert analysis is None


# ─────────────────────────────────────────────────────────────
# Scenario 3: LLM failure → UNAVAILABLE / ANALYSIS_FAILED, no fabricated data
# ─────────────────────────────────────────────────────────────
def test_no_fabricated_analysis_on_llm_failure(db_session):
    """When the LLM call fails, no PaperAnalysis is saved and status is UNAVAILABLE."""
    research_repo = ResearchRepository(db_session)
    paper_repo = PaperRepository(db_session)
    project = research_repo.create_project(title="Test3", topic="NLP")
    paper = paper_repo.create_paper(
        research_id=project.id,
        title="LLM Paper",
        authors=["Carol"],
        year=2024,
        abstract="B" * 200,  # substantive abstract so we reach the LLM call
    )

    failing_llm = MagicMock()
    failing_llm.generate_structured.side_effect = RuntimeError("LLM error")

    svc = AnalysisService(db=db_session, llm=failing_llm)
    with pytest.raises(AnalysisUnavailableError):
        svc.analyze_paper(paper.id)

    db_session.refresh(paper)
    assert paper.analysis_status == "UNAVAILABLE"
    assert paper.unavailable_reason == "ANALYSIS_FAILED"

    # Crucially: no PaperAnalysis with fabricated data
    analysis = db_session.query(PaperAnalysis).filter_by(paper_id=paper.id).first()
    assert analysis is None


# ─────────────────────────────────────────────────────────────
# Scenario 4: UNAVAILABLE papers excluded from gap detection
# ─────────────────────────────────────────────────────────────
def test_gap_detection_excludes_unavailable_papers(db_session):
    """Gap detection must only use papers with analysis_status==COMPLETED."""
    research_repo = ResearchRepository(db_session)
    paper_repo = PaperRepository(db_session)
    project = research_repo.create_project(title="Test4", topic="Robotics")

    # COMPLETED paper
    p_completed = paper_repo.create_paper(
        research_id=project.id,
        title="Completed Paper",
        authors=["Dave"],
        year=2023,
        abstract="C" * 200,
    )
    paper_repo.update_analysis_status(p_completed.id, "COMPLETED")
    paper_repo.save_analysis(p_completed.id, {
        "limitations": ["Limited to indoor environments only.", "Single robot tested."],
        "key_findings": ["Achieved 92% success rate indoors."],
        "methodology": "Experimental",
    })

    # UNAVAILABLE paper — should be silently excluded
    p_unavail = paper_repo.create_paper(
        research_id=project.id,
        title="Unavailable Paper",
        authors=["Eve"],
        year=2022,
        abstract="Short",
    )
    paper_repo.update_analysis_status(p_unavail.id, "UNAVAILABLE", "SOURCE_NOT_FOUND")

    # LLM returns no gaps (so deterministic fallback clustering runs)
    llm = MagicMock()
    llm.generate_structured.return_value = MagicMock(gaps=[])

    gap_svc = GapService(db_session, llm=llm)
    # Only 1 COMPLETED paper — may return 0 gaps (limitation clustering requires >= 2)
    # but must NOT include p_unavail in any evidence
    gaps = gap_svc.detect_gaps(project.id)

    for gap in gaps:
        for evidence in gap.evidence_items:
            assert evidence.paper_id != p_unavail.id, (
                "UNAVAILABLE paper must not contribute evidence to any gap"
            )


# ─────────────────────────────────────────────────────────────
# Scenario 5: Zero eligible papers → empty list, no gaps
# ─────────────────────────────────────────────────────────────
def test_gap_detection_no_eligible_papers(db_session, mock_llm):
    """If no papers have analysis_status==COMPLETED, detect_gaps returns []."""
    research_repo = ResearchRepository(db_session)
    paper_repo = PaperRepository(db_session)
    project = research_repo.create_project(title="Test5", topic="Astrophysics")

    p = paper_repo.create_paper(
        research_id=project.id,
        title="Unavailable Only",
        authors=["Frank"],
        year=2021,
    )
    paper_repo.update_analysis_status(p.id, "UNAVAILABLE", "SOURCE_NOT_FOUND")

    gap_svc = GapService(db_session, llm=mock_llm)
    gaps = gap_svc.detect_gaps(project.id)

    assert gaps == [], "Expected empty list when no COMPLETED papers exist"


# ─────────────────────────────────────────────────────────────
# Scenario 6: Metadata-only paper stays UNAVAILABLE
# ─────────────────────────────────────────────────────────────
def test_metadata_only_paper_stays_unavailable(db_session, mock_llm):
    """A paper with only title/authors (no abstract, no URLs) stays UNAVAILABLE
    and is never listed by list_analyzed_papers."""
    research_repo = ResearchRepository(db_session)
    paper_repo = PaperRepository(db_session)
    project = research_repo.create_project(title="Test6", topic="Bioinformatics")
    paper = paper_repo.create_paper(
        research_id=project.id,
        title="Metadata Only Paper",
        authors=["Grace"],
        year=2020,
        # No abstract, no pdf_url, no source_url
    )

    svc = AnalysisService(db=db_session, llm=mock_llm)
    with pytest.raises(AnalysisUnavailableError):
        svc.analyze_paper(paper.id)

    analyzed = paper_repo.list_analyzed_papers(project.id)
    assert paper.id not in [p.id for p in analyzed], (
        "Metadata-only paper must not appear in list_analyzed_papers"
    )


# ─────────────────────────────────────────────────────────────
# Scenario 7: No fabricated values in analysis schema
# ─────────────────────────────────────────────────────────────
def test_no_fabricated_values_in_analysis(db_session, mock_llm):
    """Verify that fabricated placeholder strings from the old except block are gone."""
    research_repo = ResearchRepository(db_session)
    paper_repo = PaperRepository(db_session)
    project = research_repo.create_project(title="Test7", topic="Finance")
    paper = paper_repo.create_paper(
        research_id=project.id,
        title="Finance AI Paper",
        authors=["Henry"],
        year=2024,
        abstract="D" * 200,
    )

    failing_llm = MagicMock()
    failing_llm.generate_structured.side_effect = RuntimeError("LLM unavailable")

    svc = AnalysisService(db=db_session, llm=failing_llm)
    try:
        svc.analyze_paper(paper.id)
    except AnalysisUnavailableError:
        pass

    # Check that no PaperAnalysis was saved with fake placeholders
    analysis = db_session.query(PaperAnalysis).filter_by(paper_id=paper.id).first()
    assert analysis is None, "No PaperAnalysis should be persisted on LLM failure"

    # Specifically check none of the old fake strings appear if somehow an object was written
    if analysis:
        assert "Investigation of" not in (analysis.objective or "")
        assert "Benchmark Corpus" not in (analysis.dataset or "")
        assert "Target Cohort" not in (analysis.population or "")
        assert "Foundational Domain Theory" not in (analysis.theoretical_framework or "")
