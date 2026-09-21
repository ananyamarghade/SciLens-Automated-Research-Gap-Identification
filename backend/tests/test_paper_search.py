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


def test_paper_search_provenance_and_enrichment():
    search_service = PaperSearchService()

    # OpenAlex discovered metadata first, CORE provides OA PDF later
    openalex_paper = PaperSearchResultItem(
        title="Hallucination Detection in Large Language Models",
        authors=["Alice Smith"],
        year=2024,
        doi="10.1000/182",
        source_provider="openalex",
        metadata_source="openalex",
        full_text_source=None,
        pdf_url=None,
        citation_count=20,
    )
    core_paper = PaperSearchResultItem(
        title="Hallucination Detection in Large Language Models",
        authors=["Alice Smith", "Bob Jones"],
        year=2024,
        doi="10.1000/182",
        source_provider="core",
        metadata_source="core",
        full_text_source="core",
        pdf_url="https://core.ac.uk/download/12345.pdf",
        citation_count=25,
    )

    deduped = search_service.deduplicate_papers([openalex_paper, core_paper])
    assert len(deduped) == 1
    merged = deduped[0]
    assert merged.metadata_source == "openalex"
    assert merged.full_text_source == "core"
    assert merged.pdf_url == "https://core.ac.uk/download/12345.pdf"
    assert merged.citation_count == 25


def test_arxiv_provider_parsing():
    from backend.app.services.paper_search import ArXivProvider
    import xml.etree.ElementTree as ET

    sample_xml = """<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
        <entry>
            <id>http://arxiv.org/abs/2405.18346v1</id>
            <published>2024-05-28T17:00:00Z</published>
            <title>Intelligent Clinical Documentation</title>
            <summary>We study hallucination mitigation in clinical documentation.</summary>
            <author><name>Dr. Jane Doe</name></author>
            <arxiv:doi>10.48550/arXiv.2405.18346</arxiv:doi>
        </entry>
    </feed>"""

    root = ET.fromstring(sample_xml)
    ns = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
    entry = root.find("atom:entry", ns)
    title = entry.find("atom:title", ns).text.strip()
    summary = entry.find("atom:summary", ns).text.strip()
    published = entry.find("atom:published", ns).text.strip()
    id_url = entry.find("atom:id", ns).text.strip()

    assert title == "Intelligent Clinical Documentation"
    assert "hallucination" in summary
    assert published[:4] == "2024"
    assert "2405.18346" in id_url
