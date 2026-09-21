from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database.repositories import GapRepository, PaperRepository, ResearchRepository
from backend.app.models.gap import ResearchGap, GapStatusEnum
from backend.app.services.paper_search import PaperSearchService
from backend.app.services.full_text_service import FullTextService
from backend.app.services.llm_service import LLMProviderBase
from backend.app.rag.loaders import PDFLoader
from backend.app.rag.chunker import SectionAwareChunker
from backend.app.rag.embeddings import EmbeddingsProvider
from backend.app.rag.vector_store import VectorStoreBase


class LLMEvidenceClassification(BaseModel):
    is_supporting: bool = Field(description="True if the text supports the candidate gap; False if it refutes/contradicts or resolves it")
    evidence_strength: str = Field(description="'strong', 'moderate', or 'weak'")
    confidence: float = Field(description="Confidence between 0.0 and 1.0")
    relevant_snippet: str = Field(description="Most relevant 1-3 sentences directly addressing the gap")
    section_category: str = Field(description="'limitations', 'results', 'discussion', or 'abstract'")


class GapInvestigatorAgent:
    def __init__(
        self,
        db: Session,
        search_service: PaperSearchService,
        full_text_service: FullTextService,
        embeddings: EmbeddingsProvider,
        vector_store: VectorStoreBase,
        llm: Optional[LLMProviderBase] = None,
    ):
        self.db = db
        self.search_service = search_service
        self.full_text_service = full_text_service
        self.embeddings = embeddings
        self.vector_store = vector_store
        self.llm = llm
        self.gap_repo = GapRepository(db)
        self.paper_repo = PaperRepository(db)
        self.research_repo = ResearchRepository(db)
        self.pdf_loader = PDFLoader()
        self.chunker = SectionAwareChunker()

    async def investigate_gap(
        self,
        research_id: str,
        gap_id: str,
        queries: List[str],
    ) -> Dict[str, Any]:
        gap = self.gap_repo.get_gap(gap_id)
        if not gap:
            return {"success": False, "error": "Gap not found"}

        self.research_repo.log_activity(
            research_id=research_id,
            agent_name="gap_investigator",
            activity_type="gap_investigation_started",
            message=f"Investigating gap '{gap.title[:40]}' (Iteration {gap.iteration_count + 1})",
        )

        adversarial_queries = list(queries)
        if len(adversarial_queries) < 3:
            adversarial_queries.append(f"{gap.title} counter evidence or resolution")
            adversarial_queries.append(f"{gap.title} recent benchmark advances")

        discovered = await self.search_service.search(queries=adversarial_queries, limit=3)
        new_evidence_items: List[Dict[str, Any]] = []

        for paper_item in discovered:
            pdf_result = await self.full_text_service.acquire_paper_pdf(paper_item.model_dump())
            fts = pdf_result.get("full_text_source") if pdf_result else ("abstract_only" if paper_item.abstract else "unavailable")
            paper_rec = self.paper_repo.create_paper(
                research_id=research_id,
                title=paper_item.title,
                authors=paper_item.authors,
                year=paper_item.year,
                abstract=paper_item.abstract,
                doi=paper_item.doi,
                source_url=paper_item.source_url,
                pdf_url=paper_item.pdf_url,
                venue=paper_item.venue,
                source_provider=paper_item.source_provider,
                metadata_source=paper_item.metadata_source or paper_item.source_provider,
                full_text_source=fts,
                is_uploaded=1 if pdf_result else 0,
            )

            raw_text = ""
            section_name = "abstract"
            page_no = 1

            if pdf_result:
                pages = self.pdf_loader.load_from_file_path(pdf_result["file_path"])
                chunks = self.chunker.chunk_document_pages(
                    pages=pages,
                    research_id=research_id,
                    source_name=pdf_result["filename"],
                    paper_id=paper_rec.id,
                )
                if chunks:
                    chunk_texts = [c.content for c in chunks]
                    embeddings = self.embeddings.embed_documents(chunk_texts)
                    self.vector_store.add_chunks(chunks, embeddings)
                    self.paper_repo.add_chunk_records([c.to_dict() for c in chunks])

                    query_embed = self.embeddings.embed_query(gap.title + " " + gap.description)
                    sim_matches = self.vector_store.search(
                        query_embedding=query_embed,
                        top_k=2,
                        filters={"paper_id": paper_rec.id},
                    )
                    if sim_matches:
                        top_meta, score = sim_matches[0]
                        raw_text = top_meta.get("content", "")
                        section_name = top_meta.get("section", "discussion")
                        page_no = top_meta.get("page_number", 1)

                if not raw_text and pages:
                    raw_text = pages[0].text[:400]
                    section_name = "discussion"
            else:
                raw_text = paper_item.abstract[:400] if paper_item.abstract else paper_item.title
                section_name = "abstract"

            is_supporting = True
            evidence_strength = "moderate"
            confidence = 0.78
            snippet = raw_text[:300] if raw_text else paper_item.title

            if self.llm and raw_text:
                classify_prompt = (
                    f"You are evaluating whether an academic publication snippet supports, refutes, or is neutral towards a candidate research gap.\n\n"
                    f"CANDIDATE RESEARCH GAP:\n"
                    f"Title: {gap.title}\n"
                    f"Description: {gap.description}\n\n"
                    f"PAPER TEXT:\n"
                    f"Title: {paper_item.title}\n"
                    f"Excerpt:\n{raw_text}\n\n"
                    f"Evaluate:\n"
                    f"1. is_supporting: Set to true if the text confirms this gap/limitation exists. Set to false if this paper solves/refutes the gap.\n"
                    f"2. evidence_strength: 'strong', 'moderate', or 'weak'\n"
                    f"3. confidence: 0.0 to 1.0\n"
                    f"4. relevant_snippet: Extract the exact 1-2 key sentences.\n"
                    f"5. section_category: One of 'limitations', 'results', 'discussion', 'abstract'"
                )
                try:
                    classification = self.llm.generate_structured(classify_prompt, LLMEvidenceClassification)
                    if classification:
                        is_supporting = classification.is_supporting
                        evidence_strength = classification.evidence_strength
                        confidence = max(0.1, min(1.0, float(classification.confidence)))
                        snippet = classification.relevant_snippet or raw_text[:300]
                        section_name = classification.section_category or section_name
                except Exception:
                    pass

            new_evidence_items.append({
                "paper_id": paper_rec.id,
                "paper_title": paper_rec.title,
                "page_number": page_no,
                "section": section_name,
                "snippet": snippet,
                "retrieval_score": round(confidence * 0.95, 2),
                "confidence": round(confidence, 2),
                "evidence_strength": evidence_strength,
                "is_supporting": is_supporting,
            })

        if new_evidence_items:
            self.gap_repo.add_gap_evidence(gap.id, new_evidence_items)

        new_iteration = gap.iteration_count + 1
        self.gap_repo.update_gap(
            gap_id=gap.id,
            iteration_count=new_iteration,
        )

        self.research_repo.log_activity(
            research_id=research_id,
            agent_name="gap_investigator",
            activity_type="gap_evidence_augmented",
            message=f"Added {len(new_evidence_items)} investigated evidence items for gap '{gap.title[:40]}'",
        )

        return {
            "success": True,
            "gap_id": gap.id,
            "iteration": new_iteration,
            "new_evidence_count": len(new_evidence_items),
            "evidence": new_evidence_items,
        }
