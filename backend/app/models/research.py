from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Float, Integer
from sqlalchemy.orm import relationship
import uuid

from backend.app.database.database import Base


class ResearchStatusEnum(str, Enum):
    PLANNING = "planning"
    DISCOVERING = "discovering"
    PROCESSING = "processing"
    ANALYZING = "analyzing"
    LANDSCAPE = "landscape"
    GAP_DETECTION = "gap_detection"
    VALIDATION = "validation"
    DEVELOPMENT = "development"
    DRAFTING = "drafting"
    COMPLETED = "completed"
    FAILED = "failed"


class ResearchProject(Base):
    __tablename__ = "research_projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    topic = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default=ResearchStatusEnum.PLANNING.value, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    research_plan = Column(JSON, nullable=True)
    configuration = Column(JSON, nullable=True)
    progress = Column(Float, default=0.0, nullable=False)

    documents = relationship("ResearchDocument", back_populates="project", cascade="all, delete-orphan")
    papers = relationship("Paper", back_populates="project", cascade="all, delete-orphan")
    themes = relationship("ResearchTheme", back_populates="project", cascade="all, delete-orphan")
    trends = relationship("ResearchTrend", back_populates="project", cascade="all, delete-orphan")
    gaps = relationship("ResearchGap", back_populates="project", cascade="all, delete-orphan")
    activities = relationship("AgentActivity", back_populates="project", cascade="all, delete-orphan")
    drafts = relationship("Draft", back_populates="project", cascade="all, delete-orphan")
    jobs = relationship("ResearchJob", back_populates="project", cascade="all, delete-orphan")
    questions = relationship("ResearchQuestion", back_populates="project", cascade="all, delete-orphan")
    objectives = relationship("ResearchObjective", back_populates="project", cascade="all, delete-orphan")
    hypotheses = relationship("ResearchHypothesis", back_populates="project", cascade="all, delete-orphan")
    methodology_suggestions = relationship("MethodologySuggestion", back_populates="project", cascade="all, delete-orphan")


class ResearchJob(Base):
    __tablename__ = "research_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    status = Column(String(50), default=ResearchStatusEnum.PLANNING.value, nullable=False)
    progress = Column(Float, default=0.0, nullable=False)
    current_agent = Column(String(100), default="planner", nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    project = relationship("ResearchProject", back_populates="jobs")


class ResearchDocument(Base):
    __tablename__ = "research_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    page_count = Column(Integer, default=0, nullable=False)
    chunk_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="documents")
    paper = relationship("Paper", back_populates="document", uselist=False)


class AgentActivity(Base):
    __tablename__ = "agent_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    research_id = Column(String(36), ForeignKey("research_projects.id"), nullable=False)
    agent_name = Column(String(100), nullable=False)
    activity_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("ResearchProject", back_populates="activities")


class ResearchProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    topic: str = Field(..., min_length=1)
    description: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None


class ResearchProjectResponse(BaseModel):
    id: str
    title: str
    topic: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    research_plan: Optional[Dict[str, Any]] = None
    configuration: Optional[Dict[str, Any]] = None
    progress: float

    class Config:
        from_attributes = True


class ResearchStatusResponse(BaseModel):
    research_id: str
    status: str
    progress: float
    current_agent: Optional[str] = None
    active_job_id: Optional[str] = None
    error_message: Optional[str] = None
    updated_at: datetime


class ResearchDocumentResponse(BaseModel):
    id: str
    research_id: str
    filename: str
    file_size_bytes: int
    page_count: int
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentUploadResultItem(BaseModel):
    filename: str
    status: str  # "completed", "failed", "skipped"
    document_id: Optional[str] = None
    paper_id: Optional[str] = None
    pages: Optional[int] = None
    chunks: Optional[int] = None
    error: Optional[str] = None
    extracted_from: Optional[str] = None


class BatchUploadResponse(BaseModel):
    total_files_received: int
    processed_count: int
    failed_count: int
    results: List[DocumentUploadResultItem]
    documents: List[ResearchDocumentResponse]


class ResearchJobResponse(BaseModel):
    id: str
    research_id: str
    status: str
    progress: float
    current_agent: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class AgentActivityResponse(BaseModel):
    id: str
    research_id: str
    agent_name: str
    activity_type: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True
