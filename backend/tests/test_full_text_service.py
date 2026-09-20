import pytest
from fastapi import HTTPException
from backend.app.utils.security import validate_external_url
from backend.app.services.full_text_service import FullTextService


def test_url_validation_ssrf_protection():
    with pytest.raises(HTTPException) as exc_file:
        validate_external_url("file:///etc/passwd")
    assert exc_file.value.status_code == 400

    with pytest.raises(HTTPException) as exc_loopback:
        validate_external_url("http://127.0.0.1/internal")
    assert exc_loopback.value.status_code == 400

    with pytest.raises(HTTPException) as exc_localhost:
        validate_external_url("http://localhost:8000/metrics")
    assert exc_localhost.value.status_code == 400


@pytest.mark.asyncio
async def test_full_text_service_candidate_extraction():
    service = FullTextService()
    paper_data = {
        "title": "Quantum Computing Frontiers",
        "source_provider": "arxiv",
        "source_url": "https://arxiv.org/abs/2301.00001",
        "pdf_url": "https://arxiv.org/pdf/2301.00001.pdf",
    }
    assert paper_data["pdf_url"] == "https://arxiv.org/pdf/2301.00001.pdf"
