import uuid
from typing import List, Dict, Any, Optional
from backend.app.rag.loaders import PDFPageContent


class TextChunk:
    def __init__(
        self,
        chunk_id: str,
        research_id: str,
        content: str,
        page_number: int,
        section: str,
        source: str,
        document_id: Optional[str] = None,
        paper_id: Optional[str] = None,
    ):
        self.chunk_id = chunk_id
        self.research_id = research_id
        self.content = content
        self.page_number = page_number
        self.section = section
        self.source = source
        self.document_id = document_id
        self.paper_id = paper_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "research_id": self.research_id,
            "content": self.content,
            "page_number": self.page_number,
            "section": self.section,
            "source": self.source,
            "document_id": self.document_id,
            "paper_id": self.paper_id,
        }


class SectionAwareChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document_pages(
        self,
        pages: List[PDFPageContent],
        research_id: str,
        source_name: str,
        document_id: Optional[str] = None,
        paper_id: Optional[str] = None,
    ) -> List[TextChunk]:
        chunks: List[TextChunk] = []

        for page in pages:
            for sec in page.sections:
                section_name = sec["section"]
                section_text = sec["text"]

                if not section_text or len(section_text.strip()) < 30:
                    continue

                sub_chunks = self._split_text_with_overlap(section_text)
                for sc in sub_chunks:
                    chunk_id = f"chk_{uuid.uuid4().hex[:12]}"
                    chunks.append(
                        TextChunk(
                            chunk_id=chunk_id,
                            research_id=research_id,
                            content=sc,
                            page_number=page.page_number,
                            section=section_name,
                            source=source_name,
                            document_id=document_id,
                            paper_id=paper_id,
                        )
                    )

        return chunks

    def _split_text_with_overlap(self, text: str) -> List[str]:
        if len(text) <= self.chunk_size:
            return [text]

        results: List[str] = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            chunk_slice = text[start:end]

            if end < text_length:
                last_space = chunk_slice.rfind(" ")
                last_period = chunk_slice.rfind(". ")
                break_point = max(last_space, last_period)
                if break_point > self.chunk_size // 2:
                    end = start + break_point + 1

            chunk_content = text[start:end].strip()
            if chunk_content:
                results.append(chunk_content)

            if end >= text_length:
                break

            start = max(start + 1, end - self.chunk_overlap)

        return results
