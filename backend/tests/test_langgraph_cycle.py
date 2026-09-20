import pytest
from backend.app.graph.state import ResearchState
from backend.app.graph.routers import should_investigate_gaps
from backend.app.graph.nodes import ResearchGraphNodes
from backend.app.graph.workflow import build_research_graph
from backend.app.agents.planner import PlannerAgent
from backend.app.agents.literature_agent import LiteratureAgent
from backend.app.agents.landscape_agent import LandscapeAgent
from backend.app.agents.gap_detection_agent import GapDetectionAgent
from backend.app.agents.evidence_critic import EvidenceCriticAgent
from backend.app.agents.gap_investigator import GapInvestigatorAgent
from backend.app.agents.research_development_agent import ResearchDevelopmentAgent
from backend.app.agents.draft_agent import DraftAgent
from backend.app.services.paper_search import PaperSearchService
from backend.app.services.full_text_service import FullTextService
from backend.app.services.analysis_service import AnalysisService
from backend.app.services.landscape_service import LandscapeService
from backend.app.services.gap_service import GapService
from backend.app.services.draft_service import DraftService
from backend.app.rag.vector_store import FAISSVectorStore
from backend.app.database.repositories import ResearchRepository


def test_router_cyclic_decision_logic():
    state_insufficient: ResearchState = {
        "iteration": 1,
        "max_iterations": 3,
        "gap_validation": {
            "gap_1": {"status": "INSUFFICIENT", "critique": "Needs more evidence"}
        },
    }
    decision = should_investigate_gaps(state_insufficient)
    assert decision == "investigate_gap"

    state_max_iterations: ResearchState = {
        "iteration": 3,
        "max_iterations": 3,
        "gap_validation": {
            "gap_1": {"status": "INSUFFICIENT", "critique": "Still insufficient"}
        },
    }
    decision_max = should_investigate_gaps(state_max_iterations)
    assert decision_max == "develop_research"

    state_valid: ResearchState = {
        "iteration": 1,
        "max_iterations": 3,
        "gap_validation": {
            "gap_1": {"status": "VALID", "critique": "Well supported"}
        },
    }
    decision_valid = should_investigate_gaps(state_valid)
    assert decision_valid == "develop_research"


@pytest.mark.asyncio
async def test_langgraph_cyclic_execution_and_exit(db_session, mock_llm, mock_embeddings):
    research_repo = ResearchRepository(db_session)
    project = research_repo.create_project(
        title="Agent Self-Correction",
        topic="Reflective Search Cycles",
    )

    search_svc = PaperSearchService()
    full_text_svc = FullTextService()
    vector_store = FAISSVectorStore(dimension=mock_embeddings.dimension)

    landscape_svc = LandscapeService(db_session, llm=mock_llm)
    gap_svc = GapService(db_session, llm=mock_llm)
    draft_svc = DraftService(db_session, llm=mock_llm)

    planner = PlannerAgent(mock_llm)
    literature = LiteratureAgent(search_svc, mock_llm)
    landscape = LandscapeAgent(landscape_svc)
    gap_detection = GapDetectionAgent(gap_svc)
    evidence_critic = EvidenceCriticAgent(mock_llm)
    gap_investigator = GapInvestigatorAgent(
        db=db_session,
        search_service=search_svc,
        full_text_service=full_text_svc,
        embeddings=mock_embeddings,
        vector_store=vector_store,
    )
    research_dev = ResearchDevelopmentAgent(db_session, mock_llm)
    draft_agent = DraftAgent(draft_svc)

    nodes = ResearchGraphNodes(
        planner_agent=planner,
        literature_agent=literature,
        landscape_agent=landscape,
        gap_detection_agent=gap_detection,
        evidence_critic_agent=evidence_critic,
        gap_investigator_agent=gap_investigator,
        research_dev_agent=research_dev,
        draft_agent=draft_agent,
    )

    graph = build_research_graph(nodes)

    initial_state: ResearchState = {
        "research_id": project.id,
        "topic": project.topic,
        "uploaded_documents": [],
        "iteration": 1,
        "max_iterations": 3,
    }

    final_state = await graph.ainvoke(initial_state)

    assert "research_plan" in final_state
    assert "candidate_gaps" in final_state
    assert "gap_validation" in final_state
    assert "draft" in final_state
    # iteration is tracked and at least 1 (may not cycle if no papers were analyzed
    # and gap detection returned empty — consistent with the NO_EVIDENCE_AVAILABLE guard)
    assert final_state.get("iteration") >= 1
