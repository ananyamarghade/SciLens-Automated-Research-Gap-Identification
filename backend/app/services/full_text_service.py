import logging
import os
import re
import uuid
import httpx
from typing import Optional, Dict, Any
from backend.app.utils.config import Settings, get_settings
from backend.app.utils.security import validate_external_url, validate_pdf_content, sanitize_filename

logger = logging.getLogger(__name__)


class FullTextService:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        os.makedirs(self.settings.UPLOAD_DIR, exist_ok=True)

    async def fetch_pdf_from_url(
        self,
        url: str,
        suggested_filename: Optional[str] = None,
        source_tag: Optional[str] = None,
    ) -> Dict[str, Any]:
        validated_url = validate_external_url(url)
        headers = {
            "User-Agent": f"SciLensResearch/1.0 (mailto:admin@scilens.ai)",
            "Accept": "application/pdf,*/*",
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
            "full_text_source": source_tag or "web",
        }

    async def acquire_paper_pdf(self, paper_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        title = paper_data.get("title", "downloaded_paper")
        filename_hint = f"{title[:40].replace(' ', '_')}.pdf"
        source_provider = paper_data.get("source_provider") or ""
        pdf_url = paper_data.get("pdf_url")
        source_url = paper_data.get("source_url") or ""
        doi = paper_data.get("doi")

        # ── 1. arXiv direct retrieval ─────────────────────────────────────────
        arxiv_id = None
        is_arxiv_paper = source_provider == "arxiv" or any("arxiv" in str(u).lower() for u in [pdf_url, source_url, doi])
        if is_arxiv_paper:
            for candidate_text in [pdf_url, source_url, doi]:
                if candidate_text:
                    m = re.search(r"(\d{4}\.\d{4,5}(?:v\d+)?)", candidate_text)
                    if m:
                        arxiv_id = m.group(1)
                        break

        if arxiv_id:
            direct_arxiv_pdf = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
            try:
                res = await self.fetch_pdf_from_url(
                    direct_arxiv_pdf,
                    suggested_filename=f"arxiv_{arxiv_id}.pdf",
                    source_tag="arxiv",
                )
                logger.info("Successfully fetched arXiv full-text PDF for '%s' (%s)", title[:40], arxiv_id)
                return res
            except Exception as exc:
                logger.warning("Failed to fetch direct arXiv PDF for %s: %s", arxiv_id, exc)

        # ── 2. Direct PDF URL (CORE, OpenAlex OA, or other) ───────────────────
        if pdf_url:
            source_tag = "openalex_oa"
            if "arxiv.org" in pdf_url:
                source_tag = "arxiv"
            elif "core.ac.uk" in pdf_url:
                source_tag = "core"
            elif source_provider:
                source_tag = f"{source_provider}_oa"

            try:
                res = await self.fetch_pdf_from_url(
                    pdf_url,
                    suggested_filename=filename_hint,
                    source_tag=source_tag,
                )
                logger.info("Successfully fetched PDF from %s for '%s'", source_tag, title[:40])
                return res
            except Exception as exc:
                logger.warning("Failed to fetch PDF from %s (%s): %s", source_tag, pdf_url[:60], exc)

        # ── 3. CORE open-access full-text retrieval by DOI ────────────────────
        if doi:
            clean_doi = doi.lower().strip().replace("https://doi.org/", "").replace("http://doi.org/", "")
            try:
                core_headers = {
                    "User-Agent": "SciLensResearch/1.0 (mailto:admin@scilens.ai)",
                    "Accept": "application/json",
                }
                if self.settings.CORE_API_KEY:
                    core_headers["Authorization"] = f"Bearer {self.settings.CORE_API_KEY}"

                async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
                    core_res = await client.get(
                        "https://api.core.ac.uk/v3/search/works/",
                        params={"q": f'doi:"{clean_doi}"', "limit": 2},
                        headers=core_headers,
                    )
                    if core_res.status_code == 200:
                        core_data = core_res.json()
                        for item in core_data.get("results", []):
                            core_dl = item.get("downloadUrl")
                            if core_dl and core_dl.strip():
                                try:
                                    res = await self.fetch_pdf_from_url(
                                        core_dl.strip(),
                                        suggested_filename=f"core_{item.get('id', 'doc')}.pdf",
                                        source_tag="core",
                                    )
                                    logger.info("Successfully fetched CORE open-access PDF for DOI %s", clean_doi)
                                    return res
                                except Exception:
                                    pass

                            # If direct fullText is available from CORE API
                            core_fulltext = item.get("fullText")
                            if core_fulltext and len(core_fulltext) > 300 and "not available for public" not in core_fulltext.lower():
                                safe_name = sanitize_filename(f"core_{item.get('id', uuid.uuid4().hex[:8])}.txt")
                                target_path = os.path.join(self.settings.UPLOAD_DIR, safe_name)
                                content_bytes = core_fulltext.encode("utf-8")
                                with open(target_path, "wb") as f:
                                    f.write(content_bytes)
                                logger.info("Successfully acquired CORE direct full-text for DOI %s", clean_doi)
                                return {
                                    "filename": safe_name,
                                    "file_path": target_path,
                                    "file_size_bytes": len(content_bytes),
                                    "content": content_bytes,
                                    "full_text_source": "core",
                                }
            except Exception as core_exc:
                logger.warning("CORE DOI search failed for %s: %s", clean_doi, core_exc)

        # ── 4. Fallback candidate URLs ────────────────────────────────────────
        fallback_urls = []
        oa_url = paper_data.get("oa_url")
        if oa_url and oa_url != pdf_url:
            fallback_urls.append((oa_url, "open_access"))
        if source_url and source_url.endswith(".pdf"):
            fallback_urls.append((source_url, "source_url"))

        for url, tag in fallback_urls:
            try:
                res = await self.fetch_pdf_from_url(url, suggested_filename=filename_hint, source_tag=tag)
                return res
            except Exception:
                continue

        return None
