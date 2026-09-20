from typing import Dict, Any, List
from backend.app.services.llm_service import LLMProviderBase


class PlannerAgent:
    def __init__(self, llm: LLMProviderBase):
        self.llm = llm

    def plan_research(
        self,
        topic: str,
        uploaded_documents: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        has_docs = len(uploaded_documents) > 0
        search_queries = [
            f"{topic} empirical evaluation methodology",
            f"{topic} challenges limitations benchmark",
            f"{topic} state of the art comparison",
        ]

        analysis_steps = [
            "literature_discovery",
            "document_indexing",
            "paper_structured_analysis",
            "landscape_synthesis",
            "gap_detection",
            "evidence_critique",
            "research_development",
            "proposal_drafting",
        ]

        return {
            "topic": topic,
            "has_uploaded_documents": has_docs,
            "document_count": len(uploaded_documents),
            "search_queries": search_queries,
            "analysis_steps": analysis_steps,
            "target_literature_size": 15,
            "focus_areas": [
                "Methodological trade-offs",
                "Scalability and robustness constraints",
                "Empirical validation across varied environments",
            ],
        }
