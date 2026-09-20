from backend.app.database.repositories import ResearchRepository, PaperRepository
from backend.app.services.gap_service import GapService


def test_gap_detection_and_heatmap(db_session, mock_llm):
    research_repo = ResearchRepository(db_session)
    paper_repo = PaperRepository(db_session)

    project = research_repo.create_project(title="Autonomous Agents", topic="AI Agent Memory Systems")

    p1 = paper_repo.create_paper(
        research_id=project.id,
        title="Episodic Memory in Agent Architectures",
        authors=["Carol White"],
        year=2023,
    )
    paper_repo.save_analysis(p1.id, {
        "limitations": ["Memory retrieval latency degrades in large-scale deployments beyond 10k entries."],
        "future_work": ["Investigate hierarchical persistent memory structures."],
    })
    # Mark as COMPLETED so gap detection considers this paper
    paper_repo.update_analysis_status(p1.id, "COMPLETED")

    p2 = paper_repo.create_paper(
        research_id=project.id,
        title="Scaling Vector Retrieval for Memory",
        authors=["Dave Miller"],
        year=2024,
    )
    paper_repo.save_analysis(p2.id, {
        "limitations": ["Memory retrieval latency limits real-time performance in streaming agent architectures."],
        "future_work": ["Explore hardware-accelerated approximate nearest neighbor search."],
    })
    # Mark as COMPLETED so gap detection considers this paper
    paper_repo.update_analysis_status(p2.id, "COMPLETED")

    gap_svc = GapService(db_session, llm=mock_llm)
    gaps = gap_svc.detect_gaps(project.id)

    # Both papers share 'memory' in their limitations — expect at least 1 cross-paper gap
    assert len(gaps) >= 1, f"Expected >= 1 gap from cross-paper limitation clustering, got {len(gaps)}"
    gap_types = [g.gap_type for g in gaps]
    assert "methodological" in gap_types

    first_gap = gaps[0]
    assert len(first_gap.evidence_items) > 0
    assert first_gap.evidence_items[0].snippet != ""
    assert first_gap.derived_from is not None
    assert len(first_gap.derived_from) > 0
    assert "paper_id" in first_gap.derived_from[0]
    assert "source_section" in first_gap.derived_from[0]
    assert first_gap.cross_paper_pattern is not None and first_gap.cross_paper_pattern != ""
    assert first_gap.missing_evidence is not None and first_gap.missing_evidence != ""
    assert first_gap.confidence_rationale is not None and first_gap.confidence_rationale != ""

    heatmap = gap_svc.get_heatmap_data(project.id)
    assert len(heatmap.cells) > 0
    assert len(heatmap.x_categories) > 0
    assert len(heatmap.y_categories) > 0

    underexplored = gap_svc.get_underexplored_areas(project.id)
    assert len(underexplored) >= 2
