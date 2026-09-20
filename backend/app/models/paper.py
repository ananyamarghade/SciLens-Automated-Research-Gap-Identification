from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
import uuid

from backend.app.database.database import Base


class Paper(Base):
    __tablename__ = "papers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    document_id = Column(String(36), ForeignKey("research_documents.id"), nullable=True)
    title = Column(Text, nullable=False)
    authors = Column(JSON, nullable=False, default=list)
    year = Column(Integer, nullable=True)
    abstract = Column(Text, nullable=True)
    doi = Column(String(255), nullable=True)
    source_url = Column(String(512), nullable=True)
    pdf_url = Column(String(512), nullable=True)
    citation_count = Column(Integer, default=0, nullable=False)
    venue = Column(String(255), nullable=True)
    source_provider = Column(String(50), nullable=True)
    is_uploaded = Column(Integer, default=0, nullable=False)
    relevance_tier = Column(String(50), default="RELATED", nullable=False)
    # Analysis lifecycle: PENDING → COMPLETED | UNAVAILABLE
    analysis_status = Column(String(20), default="PENDING", nullable=False)
    # Why full-text could not be acquired / analysed, if applicable
    unavailable_reason = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="papers")
    document = relationship("ResearchDocument", back_populates="paper")
    analysis = relationship("PaperAnalysis", back_populates="paper", uselist=False, cascade="all, delete-orphan")
    chunks = relationship("ChunkRecord", back_populates="paper", cascade="all, delete-orphan")


class PaperAnalysis(Base):
    __tablename__ = "paper_analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(36), ForeignKey("papers.id"), nullable=False, unique=True)
    objective = Column(Text, nullable=True)
    research_questions = Column(JSON, nullable=False, default=list)
    methodology = Column(Text, nullable=True)
    dataset = Column(Text, nullable=True)
    population = Column(Text, nullable=True)
    geography = Column(Text, nullable=True)
    variables = Column(JSON, nullable=False, default=dict)
    theoretical_framework = Column(Text, nullable=True)
    key_findings = Column(JSON, nullable=False, default=list)
    limitations = Column(JSON, nullable=False, default=list)
    future_work = Column(JSON, nullable=False, default=list)
    research_context = Column(Text, nullable=True)
    technology_tools = Column(JSON, nullable=False, default=list)
    raw_analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    paper = relationship("Paper", back_populates="analysis")


class ChunkRecord(Base):
    __tablename__ = "chunk_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chunk_id = Column(String(100), nullable=False, index=True)
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False, index=True)
    document_id = Column(String(36), nullable=True)
    paper_id = Column(String(36), ForeignKey("papers.id"), nullable=True, index=True)
    page_number = Column(Integer, nullable=False)
    section = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String(512), nullable=False)
    embedding_index = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    paper = relationship("Paper", back_populates="chunks")


class PaperAnalysisSchema(BaseModel):
    title: str
    authors: List[str] = Field(default_factory=list)
    year: Optional[int] = None
    objective: Optional[str] = None
    research_questions: List[str] = Field(default_factory=list)
    methodology: Optional[str] = None
    dataset: Optional[str] = None
    population: Optional[str] = None
    geography: Optional[str] = None
    variables: Dict[str, Any] = Field(default_factory=dict)
    theoretical_framework: Optional[str] = None
    key_findings: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    future_work: List[str] = Field(default_factory=list)
    research_context: Optional[str] = None
    technology_tools: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def clean_and_coerce_analysis(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        def _is_sample(val: Any) -> bool:
            if isinstance(val, str):
                v_lower = val.strip().lower()
                return v_lower.startswith("sample ") or v_lower.startswith("item for ")
            return False

        def _coerce_list(val: Any) -> List[str]:
            if val is None:
                return []
            if isinstance(val, list):
                return [str(x).strip() for x in val if x is not None and not _is_sample(x) and str(x).strip()]
            if isinstance(val, str):
                cleaned = val.strip()
                if not cleaned or _is_sample(cleaned):
                    return []
                if "\n" in cleaned:
                    items = [x.strip() for x in cleaned.split("\n")]
                elif "," in cleaned:
                    items = [x.strip() for x in cleaned.split(",")]
                else:
                    items = [cleaned]
                return [x for x in items if x and not _is_sample(x)]
            return [str(val)]

        def _coerce_dict(val: Any) -> Dict[str, Any]:
            if val is None or _is_sample(val):
                return {}
            if isinstance(val, dict):
                cleaned_dict = {}
                for k, v in val.items():
                    if not _is_sample(k) and not _is_sample(v):
                        cleaned_dict[str(k)] = v
                return cleaned_dict
            if isinstance(val, str):
                cleaned = val.strip()
                if not cleaned or _is_sample(cleaned):
                    return {}
                return {"context": cleaned}
            return {}

        def _clean_str(val: Any) -> Optional[str]:
            if val is None:
                return None
            if _is_sample(val):
                return None
            s = str(val).strip()
            return s if s else None

        # Clean string fields
        for sf in ["objective", "methodology", "dataset", "population", "geography", "theoretical_framework", "research_context"]:
            if sf in data:
                data[sf] = _clean_str(data[sf])

        # Coerce list fields
        for lf in ["authors", "research_questions", "key_findings", "limitations", "future_work", "technology_tools"]:
            data[lf] = _coerce_list(data.get(lf))

        # Coerce dict fields
        data["variables"] = _coerce_dict(data.get("variables"))

        # Clean title
        if "title" in data and _is_sample(data["title"]):
            data["title"] = "Academic Study"

        return data


class PaperResponse(BaseModel):
    id: str
    research_id: str
    document_id: Optional[str] = None
    title: str
    authors: List[str]
    year: Optional[int] = None
    abstract: Optional[str] = None
    doi: Optional[str] = None
    source_url: Optional[str] = None
    pdf_url: Optional[str] = None
    citation_count: int
    venue: Optional[str] = None
    source_provider: Optional[str] = None
    is_uploaded: int
    relevance_tier: str = "RELATED"
    # Analysis lifecycle status: PENDING | COMPLETED | UNAVAILABLE
    analysis_status: str = "PENDING"
    unavailable_reason: Optional[str] = None
    created_at: datetime
    analysis: Optional[PaperAnalysisSchema] = None

    class Config:
        from_attributes = True


class PaginatedPapersResponse(BaseModel):
    items: List[PaperResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaperSearchRequest(BaseModel):
    query: str
    limit: int = 10
    providers: Optional[List[str]] = None


class PaperSearchResultItem(BaseModel):
    title: str
    authors: List[str] = Field(default_factory=list)
    year: Optional[int] = None
    abstract: Optional[str] = None
    doi: Optional[str] = None
    source_url: Optional[str] = None
    pdf_url: Optional[str] = None
    citation_count: int = 0
    venue: Optional[str] = None
    source_provider: str
    relevance_score: int = 85


class PaperDiscoverRequest(BaseModel):
    topic: str
    limit: int = 40
    providers: Optional[List[str]] = None


class PaperCompareRequest(BaseModel):
    paper_ids: List[str] = Field(..., min_length=2)


class PaperComparisonItem(BaseModel):
    paper_id: str
    title: str
    methodology: Optional[str] = None
    population: Optional[str] = None
    key_findings: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class PaperCompareResponse(BaseModel):
    papers: List[PaperComparisonItem]
    common_themes: List[str]
    methodological_differences: List[str]
    contradictions_found: List[Dict[str, Any]]
