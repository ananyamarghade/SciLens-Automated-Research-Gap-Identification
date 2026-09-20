from backend.app.models.paper import PaperSearchResultItem
from backend.app.services.paper_search import PaperSearchService


def test_paper_search_deduplication():
    search_service = PaperSearchService()

    papers = [
        PaperSearchResultItem(
            title="Deep Residual Learning for Image Recognition",
            authors=["Kaiming He", "Xiangyu Zhang"],
            year=2016,
            doi="10.1109/CVPR.2016.90",
            source_provider="openalex",
            citation_count=100000,
        ),
        PaperSearchResultItem(
            title="Deep Residual Learning for Image Recognition (Conference)",
            authors=["Kaiming He"],
            year=2016,
            doi="10.1109/cvpr.2016.90",
            source_provider="crossref",
            citation_count=95000,
        ),
        PaperSearchResultItem(
            title="Attention Is All You Need",
            authors=["Ashish Vaswani", "Noam Shazeer"],
            year=2017,
            doi="10.48550/arXiv.1706.03762",
            source_provider="arxiv",
            citation_count=80000,
        ),
        PaperSearchResultItem(
            title="Attention Is All You Need!",
            authors=["Ashish Vaswani"],
            year=2017,
            doi=None,
            source_provider="semanticscholar",
            citation_count=79000,
        ),
    ]

    deduped = search_service.deduplicate_papers(papers)
    assert len(deduped) == 2
    titles = [p.title for p in deduped]
    assert "Deep Residual Learning for Image Recognition" in titles
    assert "Attention Is All You Need" in titles
