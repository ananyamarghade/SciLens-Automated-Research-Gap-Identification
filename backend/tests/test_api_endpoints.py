import io


def test_api_endpoints_full_coverage(client, sample_pdf_bytes):
    root_res = client.get("/")
    assert root_res.status_code == 200
    assert root_res.json()["system"] == "SciLens Backend"

    create_res = client.post(
        "/api/research",
        json={
            "title": "Quantum Error Correction",
            "topic": "Fault-tolerant Surface Codes",
            "description": "Empirical study on physical qubit overhead",
        },
    )
    assert create_res.status_code == 201
    project_data = create_res.json()
    project_id = project_data["id"]
    assert project_data["title"] == "Quantum Error Correction"

    get_res = client.get(f"/api/research/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == project_id

    status_res = client.get(f"/api/research/{project_id}/status")
    assert status_res.status_code == 200
    assert "status" in status_res.json()

    pdf_file = io.BytesIO(sample_pdf_bytes)
    upload_res = client.post(
        f"/api/research/{project_id}/documents",
        files={"files": ("surface_codes.pdf", pdf_file, "application/pdf")},
    )
    assert upload_res.status_code == 201
    docs = upload_res.json()
    assert len(docs) >= 1

    papers_res = client.get(f"/api/research/{project_id}/papers")
    assert papers_res.status_code == 200
    papers = papers_res.json()
    assert len(papers) >= 1

    landscape_res = client.get(f"/api/research/{project_id}/landscape")
    assert landscape_res.status_code == 200
    landscape_data = landscape_res.json()
    assert "themes" in landscape_data
    assert "methodology_distribution" in landscape_data

    gaps_res = client.get(f"/api/research/{project_id}/gaps")
    assert gaps_res.status_code == 200

    heatmap_res = client.get(f"/api/research/{project_id}/gaps/heatmap")
    assert heatmap_res.status_code == 200
    assert "cells" in heatmap_res.json()

    questions_res = client.post(f"/api/research/{project_id}/questions")
    assert questions_res.status_code == 200
    assert len(questions_res.json()) >= 1

    draft_res = client.get(f"/api/research/{project_id}/draft")
    assert draft_res.status_code == 200
    draft_data = draft_res.json()
    assert len(draft_data["sections"]) >= 1

    cite_res = client.post(
        "/api/citations/format",
        json={
            "title": "Quantum Threshold Theorem",
            "authors": ["Dorit Aharonov", "Michael Ben-Or"],
            "year": 1997,
            "venue": "STOC",
            "style": "apa7",
        },
    )
    assert cite_res.status_code == 200
    assert "Aharonov" in cite_res.json()["in_text_citation"]

    docx_res = client.post(f"/api/research/{project_id}/export/docx")
    assert docx_res.status_code == 200
    assert len(docx_res.content) > 0

    pdf_res = client.post(f"/api/research/{project_id}/export/pdf")
    assert pdf_res.status_code == 200
    assert len(pdf_res.content) > 0

    activity_res = client.get(f"/api/research/{project_id}/agent-activity")
    assert activity_res.status_code == 200
    assert isinstance(activity_res.json(), list)
