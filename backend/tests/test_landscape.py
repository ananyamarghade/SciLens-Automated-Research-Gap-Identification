from backend.app.database.repositories import ResearchRepository, PaperRepository
from backend.app.services.landscape_service import LandscapeService


def test_landscape_synthesis(db_session, mock_llm):
    research_repo = ResearchRepository(db_session)
    paper_repo = PaperRepository(db_session)

    project = research_repo.create_project(title="Quantum AI", topic="Quantum Neural Networks")

    p1 = paper_repo.create_paper(
        research_id=project.id,
        title="Variational Quantum Circuits for Classification",
        authors=["Alice Smith"],
        year=2023,
    )
    paper_repo.save_analysis(p1.id, {
        "methodology": "Quantitative Experiment",
        "population": "Standard Benchmarks",
        "geography": "North America",
    })

    p2 = paper_repo.create_paper(
        research_id=project.id,
        title="Error Mitigation in NISQ Architectures",
        authors=["Bob Jones"],
        year=2024,
    )
    paper_repo.save_analysis(p2.id, {
        "methodology": "Empirical Simulation",
        "population": "Hardware Emulators",
        "geography": "Europe",
    })

    landscape_svc = LandscapeService(db_session, llm=mock_llm)
    landscape = landscape_svc.generate_landscape(project.id)

    assert landscape.total_papers == 2
    assert len(landscape.themes) >= 1
    assert len(landscape.trends) == 2
    assert len(landscape.network.nodes) >= 2
    assert len(landscape.network.edges) >= 1
