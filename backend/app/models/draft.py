from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
import uuid

from backend.app.database.database import Base


class ClaimStatusEnum(str, Enum):
    SUPPORTED = "supported"
    PARTIALLY_SUPPORTED = "partially_supported"
    UNSUPPORTED = "unsupported"
    CONTRADICTED = "contradicted"


class ResearchQuestion(Base):
    __tablename__ = "research_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    gap_id = Column(String(36), ForeignKey("research_gaps.id"), nullable=True)
    question = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)
    scope = Column(String(100), nullable=True)
    is_primary = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="questions")


class ResearchObjective(Base):
    __tablename__ = "research_objectives"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("research_questions.id"), nullable=True)
    objective = Column(Text, nullable=False)
    target_outcome = Column(Text, nullable=True)
    order_index = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="objectives")


class ResearchHypothesis(Base):
    __tablename__ = "research_hypotheses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("research_questions.id"), nullable=True)
    statement = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)
    variables = Column(JSON, nullable=False, default=dict)
    testability = Column(String(100), default="high", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="hypotheses")


class MethodologySuggestion(Base):
    __tablename__ = "methodology_suggestions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    approach = Column(String(100), nullable=False)
    design = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    data_collection = Column(Text, nullable=True)
    analysis_plan = Column(Text, nullable=True)
    potential_threats_to_validity = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="methodology_suggestions")


class Draft(Base):
    __tablename__ = "drafts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="draft", nullable=False)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="drafts")
    sections = relationship("DraftSection", back_populates="draft", cascade="all, delete-orphan", order_by="DraftSection.order_index")


class DraftSection(Base):
    __tablename__ = "draft_sections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    draft_id = Column(String(36), ForeignKey("drafts.id"), nullable=False)
    section_name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False)
    citations = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    draft = relationship("Draft", back_populates="sections")


class ResearchQuestionSchema(BaseModel):
    id: str
    research_id: str
    gap_id: Optional[str] = None
    question: str
    rationale: Optional[str] = None
    scope: Optional[str] = None
    is_primary: bool = False

    class Config:
        from_attributes = True


class ResearchObjectiveSchema(BaseModel):
    id: str
    research_id: str
    question_id: Optional[str] = None
    objective: str
    target_outcome: Optional[str] = None
    order_index: int = 1

    class Config:
        from_attributes = True


class ResearchHypothesisSchema(BaseModel):
    id: str
    research_id: str
    question_id: Optional[str] = None
    statement: str
    rationale: Optional[str] = None
    variables: Dict[str, Any] = Field(default_factory=dict)
    testability: str = "high"

    class Config:
        from_attributes = True


class MethodologySuggestionSchema(BaseModel):
    id: str
    research_id: str
    approach: str
    design: str
    rationale: str
    data_collection: Optional[str] = None
    analysis_plan: Optional[str] = None
    potential_threats_to_validity: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DraftSectionSchema(BaseModel):
    id: str
    draft_id: str
    section_name: str
    content: str
    order_index: int
    citations: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DraftSchema(BaseModel):
    id: str
    research_id: str
    title: str
    status: str
    version: int
    created_at: datetime
    updated_at: datetime
    sections: List[DraftSectionSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DraftSectionCreateRequest(BaseModel):
    section_name: str
    user_guidance: Optional[str] = None


class DraftSectionUpdateRequest(BaseModel):
    content: str
    citations: Optional[List[str]] = None


class DraftGenerationRequest(BaseModel):
    gap_id: Optional[str] = None
    target_sections: Optional[List[str]] = None


class ClaimVerificationRequest(BaseModel):
    claim: str


class EvidenceCitationItem(BaseModel):
    paper_id: Optional[str] = None
    paper_title: Optional[str] = None
    page_number: int = 1
    section: str = "general"
    snippet: str
    relevance_score: float = 0.0


class ClaimVerificationResponse(BaseModel):
    claim: str
    status: str
    confidence: float
    explanation: str
    supporting_evidence: List[EvidenceCitationItem] = Field(default_factory=list)
    contradicting_evidence: List[EvidenceCitationItem] = Field(default_factory=list)
    source_papers: List[str] = Field(default_factory=list)


class LiteratureReviewSectionItem(BaseModel):
    title: str
    content: str
    supporting_paper_ids: List[str] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)


class LiteratureReviewTable(BaseModel):
    table_id: str
    title: str
    headers: List[str]
    rows: List[List[str]] = Field(default_factory=list)
    description: Optional[str] = None

    @field_validator("rows", mode="before")
    @classmethod
    def sanitize_rows(cls, v: Any) -> Any:
        if not isinstance(v, list):
            return []
        cleaned = []
        for row in v:
            if isinstance(row, list):
                cleaned.append([str(c) if c is not None else "Not explicitly reported." for c in row])
            else:
                cleaned.append([str(row) if row is not None else "Not explicitly reported."])
        return cleaned

    @field_validator("headers", mode="before")
    @classmethod
    def sanitize_headers(cls, v: Any) -> Any:
        if not isinstance(v, list):
            return []
        return [str(h) if h is not None else "" for h in v]


class LiteratureReviewRequest(BaseModel):
    selected_gap_ids: List[str] = Field(default_factory=list)
    review_depth: str = "Detailed"
    organization: str = "Thematic"
    citation_style: str = "APA 7"


class LiteratureReviewResponse(BaseModel):
    research_id: str
    topic: str
    review_depth: str
    organization: str
    citation_style: str
    selected_gaps: List[str] = Field(default_factory=list)
    sections: List[LiteratureReviewSectionItem] = Field(default_factory=list)
    tables: List[LiteratureReviewTable] = Field(default_factory=list)
    total_words: int
    source_papers: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
