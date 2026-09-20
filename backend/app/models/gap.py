from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
import uuid

from backend.app.database.database import Base


class GapStatusEnum(str, Enum):
    VALID = "VALID"
    POTENTIAL = "POTENTIAL"
    INSUFFICIENT = "INSUFFICIENT"
    SUPPORTED = "SUPPORTED"
    CANDIDATE = "CANDIDATE"
    CONTESTED = "CONTESTED"


class EvidenceTypeEnum(str, Enum):
    DIRECT_QUOTE = "DIRECT_QUOTE"
    PARAPHRASE = "PARAPHRASE"
    AUTHOR_CLAIM = "AUTHOR_CLAIM"
    MODEL_SYNTHESIS = "MODEL_SYNTHESIS"
    INFERENCE = "INFERENCE"


class RelevanceTierEnum(str, Enum):
    DIRECT = "DIRECT"
    RELATED = "RELATED"
    FOUNDATIONAL = "FOUNDATIONAL"
    PERIPHERAL = "PERIPHERAL"


class NoveltyStatusEnum(str, Enum):
    WELL_SUPPORTED = "well_supported"
    POTENTIAL_GAP = "potential_gap"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


class ResearchTheme(Base):
    __tablename__ = "research_themes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    keywords = Column(JSON, nullable=False, default=list)
    paper_count = Column(Integer, default=0, nullable=False)
    paper_ids = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="themes")


class ResearchTrend(Base):
    __tablename__ = "research_trends"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    year = Column(Integer, nullable=False)
    paper_count = Column(Integer, default=0, nullable=False)
    themes = Column(JSON, nullable=False, default=list)
    emerging_themes = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="trends")


class ResearchGap(Base):
    __tablename__ = "research_gaps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    gap_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    affected_themes = Column(JSON, nullable=False, default=list)
    evidence_strength = Column(String(50), default="moderate", nullable=False)
    confidence = Column(Float, default=0.75, nullable=False)
    status = Column(String(50), default=GapStatusEnum.POTENTIAL.value, nullable=False)
    novelty_status = Column(String(50), default=NoveltyStatusEnum.POTENTIAL_GAP.value, nullable=False)
    critic_notes = Column(Text, nullable=True)
    derived_from = Column(JSON, nullable=False, default=list)
    cross_paper_pattern = Column(Text, nullable=True)
    missing_evidence = Column(Text, nullable=True)
    confidence_rationale = Column(Text, nullable=True)
    iteration_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="gaps")
    evidence_items = relationship("GapEvidence", back_populates="gap", cascade="all, delete-orphan")


class GapEvidence(Base):
    __tablename__ = "gap_evidences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gap_id = Column(String(36), ForeignKey("research_gaps.id"), nullable=False)
    paper_id = Column(String(36), ForeignKey("papers.id"), nullable=True)
    document_id = Column(String(36), nullable=True)
    paper_title = Column(Text, nullable=True)
    page_number = Column(Integer, default=1, nullable=False)
    section = Column(String(100), default="general", nullable=False)
    chunk_id = Column(String(100), nullable=True)
    snippet = Column(Text, nullable=False)
    source_url = Column(String(512), nullable=True)
    retrieval_score = Column(Float, default=0.0, nullable=False)
    confidence = Column(Float, default=0.8, nullable=False)
    evidence_strength = Column(String(50), default="moderate", nullable=False)
    is_supporting = Column(Integer, default=1, nullable=False)
    doi = Column(String(255), nullable=True)
    exact_source_text = Column(Text, nullable=True)
    evidence_type = Column(String(50), default="PARAPHRASE", nullable=False)
    extraction_method = Column(String(100), default="automated_analysis", nullable=False)
    relevance_tier = Column(String(50), default="RELATED", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    gap = relationship("ResearchGap", back_populates="evidence_items")


class Contradiction(Base):
    __tablename__ = "contradictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    topic = Column(String(255), nullable=False)
    paper_a_id = Column(String(36), nullable=False)
    paper_a_title = Column(Text, nullable=False)
    finding_a = Column(Text, nullable=False)
    paper_b_id = Column(String(36), nullable=False)
    paper_b_title = Column(Text, nullable=False)
    finding_b = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    methodology_differences = Column(Text, nullable=True)
    population_differences = Column(Text, nullable=True)
    possible_explanation = Column(Text, nullable=True)
    contradiction_type = Column(String(100), default="genuine_contradiction", nullable=False)
    evidence = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class GapEvidenceSchema(BaseModel):
    id: Optional[str] = None
    paper_id: Optional[str] = None
    document_id: Optional[str] = None
    paper_title: Optional[str] = None
    page_number: int = 1
    section: str = "general"
    chunk_id: Optional[str] = None
    snippet: str
    source_url: Optional[str] = None
    retrieval_score: float = 0.0
    confidence: float = 0.8
    evidence_strength: str = "moderate"
    is_supporting: bool = True
    doi: Optional[str] = None
    exact_source_text: Optional[str] = None
    evidence_type: str = "PARAPHRASE"
    extraction_method: str = "automated_analysis"
    relevance_tier: str = "RELATED"

    class Config:
        from_attributes = True


class ResearchGapSchema(BaseModel):
    id: str
    research_id: str
    gap_type: str
    title: str
    description: str
    affected_themes: List[str] = Field(default_factory=list)
    evidence_strength: str
    confidence: float
    status: str
    novelty_status: str
    critic_notes: Optional[str] = None
    derived_from: List[Dict[str, Any]] = Field(default_factory=list)
    cross_paper_pattern: Optional[str] = None
    missing_evidence: Optional[str] = None
    confidence_rationale: Optional[str] = None
    iteration_count: int
    created_at: datetime
    evidence: List[GapEvidenceSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ResearchThemeResponse(BaseModel):
    id: str
    research_id: str
    name: str
    description: Optional[str] = None
    keywords: List[str]
    paper_count: int
    paper_ids: List[str]

    class Config:
        from_attributes = True


class ResearchTrendResponse(BaseModel):
    year: int
    paper_count: int
    themes: List[str]
    emerging_themes: List[str]

    class Config:
        from_attributes = True


class NetworkNode(BaseModel):
    id: str
    label: str
    type: str
    metrics: Dict[str, Any] = Field(default_factory=dict)


class NetworkEdge(BaseModel):
    source: str
    target: str
    relationship: str
    weight: float = 1.0


class PaperRelationshipNetwork(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]


class ResearchLandscapeResponse(BaseModel):
    themes: List[ResearchThemeResponse]
    trends: List[ResearchTrendResponse]
    methodology_distribution: Dict[str, int]
    population_distribution: Dict[str, int]
    geographic_distribution: Dict[str, int]
    network: PaperRelationshipNetwork
    total_papers: int


class HeatmapCell(BaseModel):
    x_category: str
    y_category: str
    paper_count: int
    gap_density: float
    coverage_status: str


class GapHeatmapData(BaseModel):
    x_axis_label: str
    y_axis_label: str
    x_categories: List[str]
    y_categories: List[str]
    cells: List[HeatmapCell]


class UnderexploredArea(BaseModel):
    area_type: str
    name: str
    literature_count: int
    rationale: str
    potential_gap_direction: str


class ContradictionResponse(BaseModel):
    id: str
    topic: str
    paper_a_id: str
    paper_a_title: str
    finding_a: str
    paper_b_id: str
    paper_b_title: str
    finding_b: str
    context: Optional[str] = None
    methodology_differences: Optional[str] = None
    population_differences: Optional[str] = None
    possible_explanation: Optional[str] = None
    contradiction_type: str
    evidence: List[Dict[str, Any]] = Field(default_factory=list)

    class Config:
        from_attributes = True
