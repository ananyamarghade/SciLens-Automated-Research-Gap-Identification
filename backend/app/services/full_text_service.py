import os
import uuid
import httpx
from typing import Optional, Dict, Any
from backend.app.utils.config import Settings, get_settings
from backend.app.utils.security import validate_external_url, validate_pdf_content, sanitize_filename


class FullTextService:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        os.makedirs(self.settings.UPLOAD_DIR, exist_ok=True)

    async def fetch_pdf_from_url(self, url: str, suggested_filename: Optional[str] = None) -> Dict[str, Any]:
        validated_url = validate_external_url(url)
        headers = {
            "User-Agent": f"{self.settings.APP_NAME}/1.0 (mailto:researcher@scilens.ai)"
        }

        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(validated_url, headers=headers)
            if response.status_code != 200:
                raise ValueError(f"Failed to fetch PDF from {url}, HTTP status {response.status_code}")

            content = response.content

        validate_pdf_content(content, self.settings.MAX_UPLOAD_SIZE_BYTES)

        base_name = suggested_filename or f"paper_{uuid.uuid4().hex[:8]}.pdf"
        safe_name = sanitize_filename(base_name)
        target_path = os.path.join(self.settings.UPLOAD_DIR, f"{uuid.uuid4().hex[:8]}_{safe_name}")

        with open(target_path, "wb") as f:
            f.write(content)

        return {
            "filename": safe_name,
            "file_path": target_path,
            "file_size_bytes": len(content),
            "content": content,
        }

    async def acquire_paper_pdf(self, paper_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        candidate_urls = []

        if paper_data.get("pdf_url"):
            candidate_urls.append(paper_data["pdf_url"])

        if paper_data.get("source_url") and paper_data.get("source_provider") == "arxiv":
            arxiv_id = paper_data["source_url"].split("/")[-1]
            candidate_urls.append(f"https://arxiv.org/pdf/{arxiv_id}.pdf")

        oa_url = paper_data.get("oa_url")
        if oa_url:
            candidate_urls.append(oa_url)

        doi = paper_data.get("doi")
        if doi and not candidate_urls:
            candidate_urls.append(f"https://doi.org/{doi}")

        title = paper_data.get("title", "downloaded_paper")
        filename_hint = f"{title[:40].replace(' ', '_')}.pdf"

        for url in candidate_urls:
            try:
                result = await self.fetch_pdf_from_url(url, suggested_filename=filename_hint)
                return result
            except Exception:
                continue

        return None
