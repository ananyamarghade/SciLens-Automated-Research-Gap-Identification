from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Integer
from sqlalchemy.orm import relationship
import uuid

from backend.app.database.database import Base


class CitationStyleEnum(str, Enum):
    APA7 = "apa7"
    IEEE = "ieee"
    MLA9 = "mla9"
    HARVARD = "harvard"
    CHICAGO = "chicago"
    VANCOUVER = "vancouver"


class Reference(Base):
    __tablename__ = "references"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    paper_id = Column(String(36), ForeignKey("papers.id"), nullable=True)
    citation_key = Column(String(100), nullable=False)
    title = Column(Text, nullable=False)
    authors = Column(JSON, nullable=False, default=list)
    year = Column(Integer, nullable=True)
    venue = Column(String(255), nullable=True)
    volume = Column(String(50), nullable=True)
    issue = Column(String(50), nullable=True)
    pages = Column(String(50), nullable=True)
    doi = Column(String(255), nullable=True)
    url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class CitationFormatRequest(BaseModel):
    paper_id: Optional[str] = None
    title: Optional[str] = None
    authors: Optional[List[str]] = None
    year: Optional[int] = None
    venue: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    style: CitationStyleEnum = CitationStyleEnum.APA7


class FormattedCitationResponse(BaseModel):
    style: str
    in_text_citation: str
    bibliography_entry: str


class ReferenceResponse(BaseModel):
    id: str
    research_id: str
    paper_id: Optional[str] = None
    citation_key: str
    title: str
    authors: List[str]
    year: Optional[int] = None
    venue: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    formatted: Optional[dict[str, str]] = None

    class Config:
        from_attributes = True
