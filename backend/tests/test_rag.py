from backend.app.rag.chunker import TextChunk
from backend.app.rag.vector_store import FAISSVectorStore
from backend.app.rag.retriever import ResearchRetriever


def test_rag_pipeline_and_retrieval(mock_embeddings):
    vector_store = FAISSVectorStore(dimension=mock_embeddings.dimension)

    chunks = [
        TextChunk(
            chunk_id="chk_1",
            research_id="res_alpha",
            content="Leader election under high network latency fails to converge within 500ms.",
            page_number=3,
            section="methodology",
            source="paper_consensus.pdf",
            paper_id="paper_1",
        ),
        TextChunk(
            chunk_id="chk_2",
            research_id="res_alpha",
            content="Evaluation cohorts demonstrated statistically significant throughput degradation.",
            page_number=4,
            section="results",
            source="paper_consensus.pdf",
            paper_id="paper_1",
        ),
        TextChunk(
            chunk_id="chk_3",
            research_id="res_beta",
            content="Unrelated biology domain text on cellular division.",
            page_number=1,
            section="introduction",
            source="biology.pdf",
            paper_id="paper_2",
        ),
    ]

    embeddings = mock_embeddings.embed_documents([c.content for c in chunks])
    vector_store.add_chunks(chunks, embeddings)

    retriever = ResearchRetriever(embeddings=mock_embeddings, vector_store=vector_store)

    results_alpha = retriever.retrieve(
        query="network latency leader election",
        research_id="res_alpha",
        top_k=2,
    )

    assert len(results_alpha) <= 2
    for item in results_alpha:
        assert item.source in ["paper_consensus.pdf"]
        assert item.page_number in [3, 4]
        assert item.section in ["methodology", "results"]
        assert item.chunk_id in ["chk_1", "chk_2"]

    results_filtered = retriever.retrieve(
        query="cohorts throughput",
        research_id="res_alpha",
        section_filter="results",
        top_k=2,
    )
    assert len(results_filtered) >= 1
    assert results_filtered[0].section == "results"
