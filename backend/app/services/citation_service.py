from typing import List, Optional, Dict, Any
from backend.app.models.citation import CitationStyleEnum, FormattedCitationResponse


class CitationService:
    def format_citation(
        self,
        style: CitationStyleEnum,
        title: str,
        authors: List[str],
        year: Optional[int] = None,
        venue: Optional[str] = None,
        volume: Optional[str] = None,
        issue: Optional[str] = None,
        pages: Optional[str] = None,
        doi: Optional[str] = None,
        url: Optional[str] = None,
        index: int = 1,
    ) -> FormattedCitationResponse:
        yr_str = str(year) if year else "n.d."
        primary_author = authors[0] if authors else "Anonymous"
        author_last = primary_author.split()[-1] if primary_author else "Anonymous"

        if style == CitationStyleEnum.APA7:
            in_text = f"({author_last}, {yr_str})"
            author_formatted = self._format_authors_apa(authors)
            venue_part = f" *{venue}*." if venue else ""
            doi_part = f" https://doi.org/{doi}" if doi else (f" {url}" if url else "")
            bib = f"{author_formatted} ({yr_str}). {title}.{venue_part}{doi_part}"

        elif style == CitationStyleEnum.IEEE:
            in_text = f"[{index}]"
            author_formatted = self._format_authors_ieee(authors)
            venue_part = f", *{venue}*" if venue else ""
            doi_part = f", doi: {doi}" if doi else ""
            bib = f"[{index}] {author_formatted}, \"{title}\"{venue_part}, {yr_str}{doi_part}."

        elif style == CitationStyleEnum.MLA9:
            in_text = f"({author_last} {pages or ''})".replace("  ", " ").strip()
            author_formatted = self._format_authors_mla(authors)
            venue_part = f" *{venue}*," if venue else ""
            bib = f"{author_formatted}. \"{title}.\"{venue_part} {yr_str}."

        elif style == CitationStyleEnum.HARVARD:
            in_text = f"({author_last}, {yr_str})"
            author_formatted = ", ".join(authors) if authors else "Anon."
            bib = f"{author_formatted} ({yr_str}) '{title}', *{venue or 'Journal'}*."

        elif style == CitationStyleEnum.CHICAGO:
            in_text = f"({author_last} {yr_str})"
            bib = f"{primary_author}. \"{title}.\" *{venue or 'Publication'}* ({yr_str})."

        elif style == CitationStyleEnum.VANCOUVER:
            in_text = f"({index})"
            bib = f"{index}. {primary_author}. {title}. {venue or ''}. {yr_str}."

        else:
            in_text = f"({author_last}, {yr_str})"
            bib = f"{primary_author} ({yr_str}). {title}."

        return FormattedCitationResponse(
            style=style.value,
            in_text_citation=in_text,
            bibliography_entry=bib.strip(),
        )

    def _format_authors_apa(self, authors: List[str]) -> str:
        if not authors:
            return "Anonymous"
        formatted = []
        for a in authors:
            parts = a.strip().split()
            if len(parts) > 1:
                formatted.append(f"{parts[-1]}, {' '.join(p[0] + '.' for p in parts[:-1])}")
            else:
                formatted.append(a)
        if len(formatted) == 1:
            return formatted[0]
        if len(formatted) == 2:
            return f"{formatted[0]} & {formatted[1]}"
        return f"{', '.join(formatted[:-1])}, & {formatted[-1]}"

    def _format_authors_ieee(self, authors: List[str]) -> str:
        if not authors:
            return "Anon."
        formatted = []
        for a in authors:
            parts = a.strip().split()
            if len(parts) > 1:
                formatted.append(f"{' '.join(p[0] + '.' for p in parts[:-1])} {parts[-1]}")
            else:
                formatted.append(a)
        return ", ".join(formatted)

    def _format_authors_mla(self, authors: List[str]) -> str:
        if not authors:
            return "Anonymous"
        parts = authors[0].strip().split()
        if len(parts) > 1:
            first_author = f"{parts[-1]}, {' '.join(parts[:-1])}"
        else:
            first_author = authors[0]

        if len(authors) == 1:
            return first_author
        if len(authors) == 2:
            return f"{first_author}, and {authors[1]}"
        return f"{first_author}, et al"
