import io
import logging
import os
import uuid
import zipfile
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.utils.config import Settings, get_settings
from backend.app.utils.security import sanitize_filename, validate_pdf_content
from backend.app.database.repositories import ResearchRepository, PaperRepository
from backend.app.models.paper import (
    Paper,
    PaperResponse,
    PaperCompareResponse,
    PaperComparisonItem,
)
from backend.app.rag.loaders import PDFLoader
from backend.app.rag.chunker import SectionAwareChunker
from backend.app.rag.embeddings import get_embeddings_engine, EmbeddingsProvider
from backend.app.rag.vector_store import FAISSVectorStore, VectorStoreBase
from backend.app.services.analysis_service import AnalysisService

logger = logging.getLogger(__name__)


class PaperService:
    def __init__(
        self,
        db: Session,
        settings: Optional[Settings] = None,
        embeddings: Optional[EmbeddingsProvider] = None,
        vector_store: Optional[VectorStoreBase] = None,
    ):
        self.db = db
        self.settings = settings or get_settings()
        self.embeddings = embeddings or get_embeddings_engine(self.settings)
        self.vector_store = vector_store or FAISSVectorStore(dimension=self.embeddings.dimension)
        self.research_repo = ResearchRepository(db)
        self.paper_repo = PaperRepository(db)
        self.pdf_loader = PDFLoader()
        self.chunker = SectionAwareChunker()
        os.makedirs(self.settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.settings.VECTOR_DB_DIR, exist_ok=True)

    def process_uploaded_pdf(
        self,
        research_id: str,
        filename: str,
        file_bytes: bytes,
    ) -> Dict[str, Any]:
        validate_pdf_content(file_bytes, self.settings.MAX_UPLOAD_SIZE_BYTES)
        safe_name = sanitize_filename(filename)
        saved_path = os.path.join(self.settings.UPLOAD_DIR, f"{uuid.uuid4().hex[:8]}_{safe_name}")

        with open(saved_path, "wb") as f:
            f.write(file_bytes)

        pages = self.pdf_loader.load_from_bytes(file_bytes)
        doc = self.research_repo.create_document(
            research_id=research_id,
            filename=safe_name,
            file_path=saved_path,
            file_size_bytes=len(file_bytes),
            page_count=len(pages),
        )

        title_guess = safe_name.replace(".pdf", "").replace("_", " ").title()
        if pages and pages[0].text:
            first_lines = [l.strip() for l in pages[0].text.split("\n") if len(l.strip()) > 5]
            if first_lines:
                title_guess = first_lines[0][:200]

        paper = self.paper_repo.create_paper(
            research_id=research_id,
            document_id=doc.id,
            title=title_guess,
            authors=[],
            abstract=pages[0].text[:1000] if pages else None,
            is_uploaded=1,
            source_provider="upload",
        )

        chunks = self.chunker.chunk_document_pages(
            pages=pages,
            research_id=research_id,
            source_name=safe_name,
            document_id=doc.id,
            paper_id=paper.id,
        )

        if chunks:
            chunk_texts = [c.content for c in chunks]
            chunk_embeddings = self.embeddings.embed_documents(chunk_texts)
            self.vector_store.add_chunks(chunks, chunk_embeddings)

            vector_dir = os.path.join(self.settings.VECTOR_DB_DIR, research_id)
            self.vector_store.save(vector_dir)

            self.paper_repo.add_chunk_records([c.to_dict() for c in chunks])
            doc.chunk_count = len(chunks)
            self.db.commit()

        # Trigger source-grounded paper analysis on upload
        full_text_extracted = "\n\n".join([p.text for p in pages if p.text]) if pages else None
        try:
            analysis_svc = AnalysisService(self.db)
            analysis_svc.analyze_paper(paper.id, context_text=full_text_extracted)
        except Exception as exc:
            logger.warning(f"Initial upload analysis for paper {paper.id} ({safe_name}): {exc}")

        self.research_repo.log_activity(
            research_id=research_id,
            agent_name="paper_service",
            activity_type="document_uploaded",
            message=f"Uploaded and indexed {safe_name} ({len(pages)} pages, {len(chunks)} chunks)",
        )

        return {
            "document_id": doc.id,
            "paper_id": paper.id,
            "filename": safe_name,
            "pages": len(pages),
            "chunks": len(chunks),
        }

    def process_uploaded_zip(
        self,
        research_id: str,
        filename: str,
        zip_bytes: bytes,
    ) -> List[Dict[str, Any]]:
        """
        Safely extracts and indexes all PDFs found within an uploaded ZIP archive.
        Protects against zip slip (directory traversal) vulnerabilities.
        """
        results = []
        if len(zip_bytes) == 0:
            raise ValueError("Uploaded ZIP file is empty")

        if len(zip_bytes) > self.settings.MAX_UPLOAD_SIZE_BYTES * 4:
            raise ValueError(f"ZIP exceeds maximum allowed size ({self.settings.MAX_UPLOAD_SIZE_BYTES * 4} bytes)")

        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
                # Iterate over entries and look for PDFs
                pdf_entries = [
                    member for member in zf.infolist()
                    if not member.is_dir() and member.filename.lower().endswith(".pdf")
                ]

                if not pdf_entries:
                    return [{
                        "filename": filename,
                        "status": "failed",
                        "error": "No valid PDF documents found in ZIP archive",
                    }]

                for member in pdf_entries:
                    # Zip slip defense: ensure normalized path does not escape
                    norm_path = os.path.normpath(member.filename)
                    if norm_path.startswith("..") or os.path.isabs(norm_path):
                        results.append({
                            "filename": member.filename,
                            "status": "failed",
                            "error": "Unsafe path traversal detected in ZIP entry",
                            "extracted_from": filename,
                        })
                        continue

                    pdf_base_name = os.path.basename(member.filename)
                    if not pdf_base_name:
                        continue

                    try:
                        pdf_data = zf.read(member.filename)
                        res = self.process_uploaded_pdf(
                            research_id=research_id,
                            filename=pdf_base_name,
                            file_bytes=pdf_data,
                        )
                        results.append({
                            "filename": pdf_base_name,
                            "status": "completed",
                            "document_id": res.get("document_id"),
                            "paper_id": res.get("paper_id"),
                            "pages": res.get("pages"),
                            "chunks": res.get("chunks"),
                            "extracted_from": filename,
                        })
                    except Exception as err:
                        results.append({
                            "filename": pdf_base_name,
                            "status": "failed",
                            "error": str(err),
                            "extracted_from": filename,
                        })

        except zipfile.BadZipFile:
            raise ValueError(f"File '{filename}' is not a valid or readable ZIP archive")

        return results

    def compare_papers(self, research_id: str, paper_ids: List[str]) -> PaperCompareResponse:
        papers = []
        for pid in paper_ids:
            p = self.paper_repo.get_paper(pid)
            if not p:
                continue
            analysis = p.analysis
            papers.append(
                PaperComparisonItem(
                    paper_id=p.id,
                    title=p.title,
                    methodology=analysis.methodology if analysis else None,
                    population=analysis.population if analysis else None,
                    key_findings=analysis.key_findings if analysis else [],
                    limitations=analysis.limitations if analysis else [],
                )
            )

        common_themes = []
        methodological_differences = []
        contradictions = []

        if len(papers) >= 2:
            p1 = papers[0]
            p2 = papers[1]
            if p1.methodology and p2.methodology:
                if p1.methodology.lower() != p2.methodology.lower():
                    methodological_differences.append(
                        f"Paper '{p1.title}' used {p1.methodology} whereas '{p2.title}' used {p2.methodology}."
                    )
            common_themes.append("Domain literature review and empirical evaluation")

        return PaperCompareResponse(
            papers=papers,
            common_themes=common_themes,
            methodological_differences=methodological_differences,
            contradictions_found=contradictions,
        )
