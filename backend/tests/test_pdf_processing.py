import pytest
from fastapi import HTTPException
from backend.app.utils.security import sanitize_filename, validate_pdf_content
from backend.app.rag.loaders import PDFLoader
from backend.app.rag.chunker import SectionAwareChunker


def test_sanitize_filename():
    assert sanitize_filename("../../../malicious_paper.pdf") == "malicious_paper.pdf"
    assert sanitize_filename("my research paper (2024).pdf") == "my_research_paper_2024.pdf"
    assert sanitize_filename("paper_without_extension") == "paper_without_extension.pdf"


def test_validate_pdf_content_success(sample_pdf_bytes):
    validate_pdf_content(sample_pdf_bytes, max_size_bytes=10000000)


def test_validate_pdf_content_failures():
    with pytest.raises(HTTPException) as exc_empty:
        validate_pdf_content(b"", max_size_bytes=1000000)
    assert exc_empty.value.status_code == 400

    with pytest.raises(HTTPException) as exc_invalid:
        validate_pdf_content(b"not a valid pdf content", max_size_bytes=1000000)
    assert exc_invalid.value.status_code == 400

    with pytest.raises(HTTPException) as exc_size:
        validate_pdf_content(b"%PDF-1.4 large file", max_size_bytes=5)
    assert exc_size.value.status_code == 413


def test_pdf_extraction_and_section_detection(sample_pdf_bytes):
    loader = PDFLoader()
    pages = loader.load_from_bytes(sample_pdf_bytes)

    assert len(pages) > 0
    assert pages[0].page_number == 1
    assert "Empirical Analysis" in pages[0].text

    detected_sections = [s["section"] for page in pages for s in page.sections]
    assert "abstract" in detected_sections
    assert "methodology" in detected_sections
    assert "limitations" in detected_sections


def test_section_aware_chunking(sample_pdf_bytes):
    loader = PDFLoader()
    pages = loader.load_from_bytes(sample_pdf_bytes)

    chunker = SectionAwareChunker(chunk_size=300, chunk_overlap=50)
    chunks = chunker.chunk_document_pages(
        pages=pages,
        research_id="res_test_123",
        source_name="test_paper.pdf",
        document_id="doc_test_456",
        paper_id="pap_test_789",
    )

    assert len(chunks) > 0
    for chunk in chunks:
        assert chunk.research_id == "res_test_123"
        assert chunk.document_id == "doc_test_456"
        assert chunk.paper_id == "pap_test_789"
        assert chunk.page_number >= 1
        assert chunk.section != ""
        assert chunk.chunk_id.startswith("chk_")
        assert chunk.source == "test_paper.pdf"
        assert len(chunk.content) > 0
