from typing import List, Optional
from backend.app.rag.retriever import ResearchRetriever, RetrievedEvidence


class RetrievalAgent:
    def __init__(self, retriever: ResearchRetriever):
        self.retriever = retriever

    def retrieve_evidence_for_query(
        self,
        query: str,
        research_id: str,
        top_k: int = 5,
        section_filter: Optional[str] = None,
    ) -> List[RetrievedEvidence]:
        return self.retriever.retrieve(
            query=query,
            research_id=research_id,
            top_k=top_k,
            section_filter=section_filter,
        )
