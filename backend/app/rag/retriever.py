from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.app.rag.embeddings import EmbeddingsProvider
from backend.app.rag.vector_store import VectorStoreBase


class RetrievedEvidence(BaseModel):
    chunk_id: str
    paper_id: Optional[str] = None
    document_id: Optional[str] = None
    paper_title: Optional[str] = None
    page_number: int
    section: str
    snippet: str
    source_url: Optional[str] = None
    source: str
    score: float


class ResearchRetriever:
    def __init__(self, embeddings: EmbeddingsProvider, vector_store: VectorStoreBase):
        self.embeddings = embeddings
        self.vector_store = vector_store

    def retrieve(
        self,
        query: str,
        research_id: str,
        top_k: int = 5,
        section_filter: Optional[str] = None,
        paper_id: Optional[str] = None,
    ) -> List[RetrievedEvidence]:
        filters: Dict[str, Any] = {"research_id": research_id}
        if section_filter:
            filters["section"] = section_filter
        if paper_id:
            filters["paper_id"] = paper_id

        query_embedding = self.embeddings.embed_query(query)
        matches = self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k,
            filters=filters,
        )

        results: List[RetrievedEvidence] = []
        for meta, score in matches:
            results.append(
                RetrievedEvidence(
                    chunk_id=meta.get("chunk_id", ""),
                    paper_id=meta.get("paper_id"),
                    document_id=meta.get("document_id"),
                    paper_title=meta.get("paper_title") or meta.get("source"),
                    page_number=meta.get("page_number", 1),
                    section=meta.get("section", "general"),
                    snippet=meta.get("content", ""),
                    source_url=meta.get("source_url"),
                    source=meta.get("source", ""),
                    score=score,
                )
            )

        return results
