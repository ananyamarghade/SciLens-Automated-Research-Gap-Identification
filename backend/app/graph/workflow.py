from langgraph.graph import StateGraph, START, END
from backend.app.graph.state import ResearchState
from backend.app.graph.nodes import ResearchGraphNodes
from backend.app.graph.routers import should_investigate_gaps


def build_research_graph(nodes: ResearchGraphNodes):
    builder = StateGraph(ResearchState)

    builder.add_node("planner", nodes.plan_node)
    builder.add_node("literature", nodes.literature_node)
    # analysis node: full-text acquisition + source-grounded LLM analysis per paper
    builder.add_node("analysis", nodes.analysis_node)
    builder.add_node("landscape", nodes.landscape_node)
    builder.add_node("gap_detection", nodes.gap_detection_node)
    builder.add_node("evidence_critic", nodes.evidence_critic_node)
    builder.add_node("gap_investigator", nodes.gap_investigator_node)
    builder.add_node("research_development", nodes.research_development_node)
    builder.add_node("draft", nodes.draft_node)

    builder.add_edge(START, "planner")
    builder.add_edge("planner", "literature")
    # Literature → Analysis (mandatory per-paper analysis) → Landscape → Gap Detection
    builder.add_edge("literature", "analysis")
    builder.add_edge("analysis", "landscape")
    builder.add_edge("landscape", "gap_detection")
    builder.add_edge("gap_detection", "evidence_critic")

    builder.add_conditional_edges(
        "evidence_critic",
        should_investigate_gaps,
        {
            "investigate_gap": "gap_investigator",
            "develop_research": "research_development",
        },
    )

    builder.add_edge("gap_investigator", "evidence_critic")
    builder.add_edge("research_development", "draft")
    builder.add_edge("draft", END)

    return builder.compile()
