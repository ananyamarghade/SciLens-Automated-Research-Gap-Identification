from backend.app.models.citation import CitationStyleEnum
from backend.app.services.citation_service import CitationService


def test_citation_styles_formatting():
    service = CitationService()
    authors = ["Geoffrey Hinton", "Yann LeCun", "Yoshua Bengio"]
    title = "Deep Learning Overview"
    year = 2015
    venue = "Nature"
    doi = "10.1038/nature14539"

    apa = service.format_citation(
        style=CitationStyleEnum.APA7,
        title=title,
        authors=authors,
        year=year,
        venue=venue,
        doi=doi,
    )
    assert apa.style == "apa7"
    assert "Hinton" in apa.in_text_citation
    assert "2015" in apa.in_text_citation
    assert "doi.org/10.1038/nature14539" in apa.bibliography_entry

    ieee = service.format_citation(
        style=CitationStyleEnum.IEEE,
        title=title,
        authors=authors,
        year=year,
        venue=venue,
        doi=doi,
        index=1,
    )
    assert ieee.style == "ieee"
    assert ieee.in_text_citation == "[1]"
    assert "[1]" in ieee.bibliography_entry

    mla = service.format_citation(
        style=CitationStyleEnum.MLA9,
        title=title,
        authors=authors,
        year=year,
        venue=venue,
    )
    assert mla.style == "mla9"
    assert "Hinton" in mla.in_text_citation

    vancouver = service.format_citation(
        style=CitationStyleEnum.VANCOUVER,
        title=title,
        authors=authors,
        year=year,
        venue=venue,
        index=3,
    )
    assert vancouver.style == "vancouver"
    assert vancouver.in_text_citation == "(3)"
