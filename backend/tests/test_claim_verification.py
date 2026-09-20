from backend.app.rag.chunker import TextChunk
from backend.app.rag.vector_store import FAISSVectorStore
from backend.app.rag.retriever import ResearchRetriever
from backend.app.services.draft_service import DraftService
from backend.app.database.repositories import ResearchRepository


def test_claim_verification_workflow(db_session, mock_llm, mock_embeddings):
    research_repo = ResearchRepository(db_session)
    project = research_repo.create_project(title="Claim Check", topic="Empirical Verification")

    vector_store = FAISSVectorStore(dimension=mock_embeddings.dimension)
    chunks = [
        TextChunk(
            chunk_id="chk_evidence_1",
            research_id=project.id,
            content="Dynamic heartbeat adjustments significantly reduce network partitions by 42%.",
            page_number=5,
            section="results",
            source="paper_heartbeat.pdf",
            paper_id="pap_10",
        )
    ]
    embeddings = mock_embeddings.embed_documents([c.content for c in chunks])
    vector_store.add_chunks(chunks, embeddings)

    retriever = ResearchRetriever(embeddings=mock_embeddings, vector_store=vector_store)
    draft_service = DraftService(db_session, llm=mock_llm, retriever=retriever)

    res_supported = draft_service.verify_claim(
        research_id=project.id,
        claim="Dynamic heartbeat adjustments reduce network partitions.",
    )
    assert res_supported.status in ["supported", "partially_supported"]
    assert len(res_supported.supporting_evidence) > 0
    assert res_supported.supporting_evidence[0].page_number == 5

    res_unsupported = draft_service.verify_claim(
        research_id="empty_project_id",
        claim="Unicorns thrive in distributed cloud networks.",
    )
    assert res_unsupported.status == "unsupported"
