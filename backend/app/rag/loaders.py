import io
import re
from typing import List, Dict, Any, Optional
import pypdf


class PDFPageContent:
    def __init__(self, page_number: int, text: str, sections: List[Dict[str, Any]]):
        self.page_number = page_number
        self.text = text
        self.sections = sections


class PDFLoader:
    SECTION_PATTERNS = [
        (r"^\s*(?:abstract)\b", "abstract"),
        (r"^\s*(?:1\.?\s*)?(?:introduction)\b", "introduction"),
        (r"^\s*(?:2\.?\s*)?(?:related\s+work|literature\s+review|background)\b", "literature_review"),
        (r"^\s*(?:3\.?\s*)?(?:methodology|methods|proposed\s+method|system\s+design|approach)\b", "methodology"),
        (r"^\s*(?:4\.?\s*)?(?:experiments|experimental\s+setup|evaluation|results)\b", "results"),
        (r"^\s*(?:5\.?\s*)?(?:discussion|findings|analysis)\b", "discussion"),
        (r"^\s*(?:6\.?\s*)?(?:limitations|threats\s+to\s+validity)\b", "limitations"),
        (r"^\s*(?:7\.?\s*)?(?:conclusion|concluding\s+remarks|future\s+work)\b", "conclusion"),
        (r"^\s*(?:references|bibliography)\b", "references"),
    ]

    def __init__(self):
        self.compiled_patterns = [
            (re.compile(pattern, re.IGNORECASE | re.MULTILINE), name)
            for pattern, name in self.SECTION_PATTERNS
        ]

    def load_from_bytes(self, file_bytes: bytes) -> List[PDFPageContent]:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_content: List[PDFPageContent] = []
        current_section = "general"

        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            text_cleaned = re.sub(r"\r\n|\r", "\n", text)
            lines = text_cleaned.split("\n")

            page_sections: List[Dict[str, Any]] = []
            section_buffer: List[str] = []

            for line in lines:
                line_stripped = line.strip()
                detected_section = self._detect_section(line_stripped)
                if detected_section:
                    if section_buffer:
                        page_sections.append({
                            "section": current_section,
                            "text": "\n".join(section_buffer).strip()
                        })
                        section_buffer = []
                    current_section = detected_section
                section_buffer.append(line)

            if section_buffer:
                page_sections.append({
                    "section": current_section,
                    "text": "\n".join(section_buffer).strip()
                })

            pages_content.append(
                PDFPageContent(
                    page_number=page_idx + 1,
                    text=text_cleaned,
                    sections=page_sections
                )
            )

        return pages_content

    def load_from_file_path(self, file_path: str) -> List[PDFPageContent]:
        with open(file_path, "rb") as f:
            return self.load_from_bytes(f.read())

    def _detect_section(self, line: str) -> Optional[str]:
        if len(line) > 80 or len(line) < 3:
            return None
        for pattern, section_name in self.compiled_patterns:
            if pattern.match(line):
                return section_name
        return None
