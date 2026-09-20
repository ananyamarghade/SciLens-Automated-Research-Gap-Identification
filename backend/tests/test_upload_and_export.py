import io
import pytest
import zipfile
from backend.app.models.research import ResearchProject
from backend.app.services.paper_service import PaperService
from backend.app.services.draft_service import DraftService
from backend.app.services.export_service import ExportService


def test_batch_upload_multiple_pdfs(client, sample_pdf_bytes, db_session):
    project = ResearchProject(
        title="Multi-PDF Upload Project",
        topic="Scalable Document Ingestion in Academic Pipelines",
        status="planning",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    pdf1 = io.BytesIO(sample_pdf_bytes)
    pdf2 = io.BytesIO(sample_pdf_bytes)
    pdf3 = io.BytesIO(sample_pdf_bytes)

    res = client.post(
        f"/api/research/{project.id}/documents",
        files=[
            ("files", ("paper_alpha.pdf", pdf1, "application/pdf")),
            ("files", ("paper_beta.pdf", pdf2, "application/pdf")),
            ("files", ("paper_gamma.pdf", pdf3, "application/pdf")),
        ],
    )
    assert res.status_code == 201
    data = res.json()
    assert data["total_files_received"] == 3
    assert data["processed_count"] == 3
    assert data["failed_count"] == 0
    assert len(data["results"]) == 3
    assert len(data["documents"]) >= 3
    for r in data["results"]:
        assert r["status"] == "completed"
        assert r["pages"] >= 1
        assert r["document_id"] is not None


def test_batch_upload_zip_extraction(client, sample_pdf_bytes, db_session):
    project = ResearchProject(
        title="ZIP Upload Project",
        topic="ZIP Archive Extraction and Indexing",
        status="planning",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Create an in-memory ZIP archive containing 2 PDFs
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("nested/doc_one.pdf", sample_pdf_bytes)
        zf.writestr("doc_two.pdf", sample_pdf_bytes)
    zip_bytes = zip_buffer.getvalue()

    res = client.post(
        f"/api/research/{project.id}/documents",
        files=[
            ("files", ("bundle.zip", io.BytesIO(zip_bytes), "application/zip")),
        ],
    )
    assert res.status_code == 201
    data = res.json()
    assert data["total_files_received"] == 1
    assert data["processed_count"] == 2
    assert len(data["results"]) == 2
    for r in data["results"]:
        assert r["status"] == "completed"
        assert r["extracted_from"] == "bundle.zip"


def test_batch_upload_mixed_pdf_and_zip(client, sample_pdf_bytes, db_session):
    project = ResearchProject(
        title="Mixed Upload Project",
        topic="Mixed PDF and ZIP Ingestion",
        status="planning",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("archive_paper.pdf", sample_pdf_bytes)
    zip_bytes = zip_buffer.getvalue()

    res = client.post(
        f"/api/research/{project.id}/documents",
        files=[
            ("files", ("direct_paper.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")),
            ("files", ("archive.zip", io.BytesIO(zip_bytes), "application/zip")),
        ],
    )
    assert res.status_code == 201
    data = res.json()
    assert data["total_files_received"] == 2
    assert data["processed_count"] == 2
    assert data["failed_count"] == 0


def test_batch_upload_per_file_failure_independence(client, sample_pdf_bytes, db_session):
    project = ResearchProject(
        title="Failure Isolation Project",
        topic="Per-file Fault Isolation in Ingestion",
        status="planning",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    corrupt_bytes = b"NOT_A_VALID_PDF_OR_ZIP"

    res = client.post(
        f"/api/research/{project.id}/documents",
        files=[
            ("files", ("good_paper.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")),
            ("files", ("bad_paper.pdf", io.BytesIO(corrupt_bytes), "application/pdf")),
        ],
    )
    assert res.status_code == 201
    data = res.json()
    assert data["total_files_received"] == 2
    assert data["processed_count"] == 1
    assert data["failed_count"] == 1
    statuses = [r["status"] for r in data["results"]]
    assert "completed" in statuses
    assert "failed" in statuses


def test_markdown_docx_pdf_exports(client, sample_pdf_bytes, db_session):
    project = ResearchProject(
        title="Export Verification Project",
        topic="Export Testing for Proposals and Reviews",
        status="planning",
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Ingest a paper to give draft grounding
    PaperService(db_session).process_uploaded_pdf(
        research_id=project.id,
        filename="eval.pdf",
        file_bytes=sample_pdf_bytes,
    )

    # Test DOCX export
    docx_res = client.get(f"/api/research/{project.id}/export/docx")
    assert docx_res.status_code == 200
    assert len(docx_res.content) > 0
    assert docx_res.content.startswith(b"PK")

    # Test PDF export
    pdf_res = client.get(f"/api/research/{project.id}/export/pdf")
    assert pdf_res.status_code == 200
    assert len(pdf_res.content) > 0
    assert pdf_res.content.startswith(b"%PDF-")

    # Test Markdown export
    md_res = client.get(f"/api/research/{project.id}/export/md")
    assert md_res.status_code == 200
    assert len(md_res.content) > 0
    md_text = md_res.content.decode("utf-8")
    assert f"# Investigation and Resolution of Identified Gaps in {project.topic}" in md_text
    assert "## Abstract" in md_text
    assert "## Literature Review" in md_text
