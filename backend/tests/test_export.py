from backend.app.models.draft import Draft, DraftSection
from backend.app.services.export_service import ExportService


def test_docx_and_pdf_export_generation():
    export_service = ExportService()

    mock_draft = Draft(
        id="draft_test_1",
        research_id="res_test_1",
        title="Towards Scalable and Robust Agentic Literature Reviews",
        status="completed",
        version=1,
    )
    mock_draft.sections = [
        DraftSection(
            id="sec_1",
            draft_id=mock_draft.id,
            section_name="Abstract",
            content="This research proposal provides an empirical evaluation of agentic gap detection.",
            order_index=1,
            citations=["Smith et al. (2024)"],
        ),
        DraftSection(
            id="sec_2",
            draft_id=mock_draft.id,
            section_name="Methodology",
            content="A factorial experimental matrix was deployed across diverse document corpora.",
            order_index=2,
            citations=["Jones et al. (2023)"],
        ),
    ]

    docx_bytes = export_service.export_to_docx(mock_draft)
    assert len(docx_bytes) > 0
    assert docx_bytes.startswith(b"PK")

    pdf_bytes = export_service.export_to_pdf(mock_draft)
    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b"%PDF-")
