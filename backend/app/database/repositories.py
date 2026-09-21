from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.research import (
    ResearchProject,
    ResearchJob,
    ResearchDocument,
    AgentActivity,
    ResearchStatusEnum,
)
from backend.app.models.paper import Paper, PaperAnalysis, ChunkRecord
from backend.app.models.gap import (
    ResearchTheme,
    ResearchTrend,
    ResearchGap,
    GapEvidence,
    Contradiction,
)
from backend.app.models.draft import (
    ResearchQuestion,
    ResearchObjective,
    ResearchHypothesis,
    MethodologySuggestion,
    Draft,
    DraftSection,
)
from backend.app.models.citation import Reference


class ResearchRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_project(self, title: str, topic: str, description: Optional[str] = None, configuration: Optional[Dict[str, Any]] = None) -> ResearchProject:
        project = ResearchProject(
            title=title,
            topic=topic,
            description=description,
            configuration=configuration or {},
            status=ResearchStatusEnum.PLANNING.value,
            progress=0.0
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def get_project(self, project_id: str) -> Optional[ResearchProject]:
        return self.db.query(ResearchProject).filter(ResearchProject.id == project_id).first()

    def update_project_status(self, project_id: str, status: str, progress: Optional[float] = None, research_plan: Optional[Dict[str, Any]] = None) -> Optional[ResearchProject]:
        project = self.get_project(project_id)
        if not project:
            return None
        project.status = status
        if progress is not None:
            project.progress = progress
        if research_plan is not None:
            project.research_plan = research_plan
        project.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(project)
        return project

    def list_projects(self, limit: int = 50) -> List[ResearchProject]:
        return self.db.query(ResearchProject).order_by(desc(ResearchProject.created_at)).limit(limit).all()

    def create_job(self, research_id: str, current_agent: str = "planner") -> ResearchJob:
        job = ResearchJob(
            research_id=research_id,
            status=ResearchStatusEnum.PLANNING.value,
            progress=0.0,
            current_agent=current_agent,
            started_at=datetime.utcnow()
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def get_latest_job(self, research_id: str) -> Optional[ResearchJob]:
        return self.db.query(ResearchJob).filter(ResearchJob.research_id == research_id).order_by(desc(ResearchJob.started_at)).first()

    def update_job(self, job_id: str, status: str, progress: float, current_agent: str, error_message: Optional[str] = None) -> Optional[ResearchJob]:
        job = self.db.query(ResearchJob).filter(ResearchJob.id == job_id).first()
        if not job:
            return None
        job.status = status
        job.progress = progress
        job.current_agent = current_agent
        if error_message:
            job.error_message = error_message
        if status in (ResearchStatusEnum.COMPLETED.value, ResearchStatusEnum.FAILED.value):
            job.completed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(job)
        return job

    def create_document(self, research_id: str, filename: str, file_path: str, file_size_bytes: int, page_count: int = 0) -> ResearchDocument:
        doc = ResearchDocument(
            research_id=research_id,
            filename=filename,
            file_path=file_path,
            file_size_bytes=file_size_bytes,
            page_count=page_count,
            chunk_count=0
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def list_documents(self, research_id: str) -> List[ResearchDocument]:
        return self.db.query(ResearchDocument).filter(ResearchDocument.research_id == research_id).all()

    def log_activity(self, research_id: str, agent_name: str, activity_type: str, message: str, details: Optional[Dict[str, Any]] = None) -> AgentActivity:
        activity = AgentActivity(
            research_id=research_id,
            agent_name=agent_name,
            activity_type=activity_type,
            message=message,
            details=details
        )
        self.db.add(activity)
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def list_activities(self, research_id: str, limit: int = 100) -> List[AgentActivity]:
        return self.db.query(AgentActivity).filter(AgentActivity.research_id == research_id).order_by(AgentActivity.timestamp.asc()).limit(limit).all()


class PaperRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_paper(
        self,
        research_id: str,
        title: str,
        authors: List[str],
        year: Optional[int] = None,
        abstract: Optional[str] = None,
        doi: Optional[str] = None,
        source_url: Optional[str] = None,
        pdf_url: Optional[str] = None,
        venue: Optional[str] = None,
        source_provider: Optional[str] = None,
        metadata_source: Optional[str] = None,
        full_text_source: Optional[str] = None,
        is_uploaded: int = 0,
        document_id: Optional[str] = None,
    ) -> Paper:
        paper = Paper(
            research_id=research_id,
            document_id=document_id,
            title=title,
            authors=authors,
            year=year,
            abstract=abstract,
            doi=doi,
            source_url=source_url,
            pdf_url=pdf_url,
            venue=venue,
            source_provider=source_provider,
            metadata_source=metadata_source or source_provider,
            full_text_source=full_text_source,
            is_uploaded=is_uploaded
        )
        self.db.add(paper)
        self.db.commit()
        self.db.refresh(paper)
        return paper

    def update_paper_full_text_source(self, paper_id: str, full_text_source: str) -> Optional[Paper]:
        paper = self.get_paper(paper_id)
        if paper:
            paper.full_text_source = full_text_source
            self.db.commit()
            self.db.refresh(paper)
        return paper

    def update_paper_metadata_source(self, paper_id: str, metadata_source: str) -> Optional[Paper]:
        paper = self.get_paper(paper_id)
        if paper:
            paper.metadata_source = metadata_source
            self.db.commit()
            self.db.refresh(paper)
        return paper

    def get_paper(self, paper_id: str) -> Optional[Paper]:
        return self.db.query(Paper).filter(Paper.id == paper_id).first()

    def list_papers(self, research_id: str) -> List[Paper]:
        return self.db.query(Paper).filter(Paper.research_id == research_id).all()

    def save_analysis(self, paper_id: str, analysis_data: Dict[str, Any]) -> PaperAnalysis:
        existing = self.db.query(PaperAnalysis).filter(PaperAnalysis.paper_id == paper_id).first()
        if existing:
            for key, val in analysis_data.items():
                setattr(existing, key, val)
            self.db.commit()
            self.db.refresh(existing)
            return existing

        analysis = PaperAnalysis(
            paper_id=paper_id,
            objective=analysis_data.get("objective"),
            research_questions=analysis_data.get("research_questions", []),
            methodology=analysis_data.get("methodology"),
            dataset=analysis_data.get("dataset"),
            population=analysis_data.get("population"),
            geography=analysis_data.get("geography"),
            variables=analysis_data.get("variables", {}),
            theoretical_framework=analysis_data.get("theoretical_framework"),
            key_findings=analysis_data.get("key_findings", []),
            limitations=analysis_data.get("limitations", []),
            future_work=analysis_data.get("future_work", []),
            research_context=analysis_data.get("research_context"),
            technology_tools=analysis_data.get("technology_tools", []),
            raw_analysis=analysis_data.get("raw_analysis")
        )
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis

    def update_analysis_status(
        self, paper_id: str, status: str, reason: Optional[str] = None
    ) -> Optional[Paper]:
        """Update a paper's analysis lifecycle status (PENDING/COMPLETED/UNAVAILABLE)."""
        paper = self.get_paper(paper_id)
        if not paper:
            return None
        paper.analysis_status = status
        if reason is not None:
            paper.unavailable_reason = reason
        self.db.commit()
        self.db.refresh(paper)
        return paper

    def list_analyzed_papers(self, research_id: str) -> List[Paper]:
        """Return only papers that completed source-grounded analysis (COMPLETED status)."""
        return (
            self.db.query(Paper)
            .filter(Paper.research_id == research_id, Paper.analysis_status == "COMPLETED")
            .all()
        )

    def add_chunk_records(self, chunks: List[Dict[str, Any]]) -> None:
        records = [
            ChunkRecord(
                chunk_id=c["chunk_id"],
                research_id=c["research_id"],
                document_id=c.get("document_id"),
                paper_id=c.get("paper_id"),
                page_number=c.get("page_number", 1),
                section=c.get("section", "general"),
                content=c["content"],
                source=c.get("source", "document"),
                embedding_index=c.get("embedding_index")
            )
            for c in chunks
        ]
        self.db.add_all(records)
        self.db.commit()

    def list_chunks_for_research(self, research_id: str) -> List[ChunkRecord]:
        return self.db.query(ChunkRecord).filter(ChunkRecord.research_id == research_id).all()

    def get_chunk_by_id(self, chunk_id: str) -> Optional[ChunkRecord]:
        return self.db.query(ChunkRecord).filter(ChunkRecord.chunk_id == chunk_id).first()


class GapRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_themes(self, research_id: str, themes: List[Dict[str, Any]]) -> List[ResearchTheme]:
        self.db.query(ResearchTheme).filter(ResearchTheme.research_id == research_id).delete()
        entities = [
            ResearchTheme(
                research_id=research_id,
                name=t["name"],
                description=t.get("description"),
                keywords=t.get("keywords", []),
                paper_count=t.get("paper_count", 0),
                paper_ids=t.get("paper_ids", [])
            )
            for t in themes
        ]
        self.db.add_all(entities)
        self.db.commit()
        return entities

    def list_themes(self, research_id: str) -> List[ResearchTheme]:
        return self.db.query(ResearchTheme).filter(ResearchTheme.research_id == research_id).all()

    def save_trends(self, research_id: str, trends: List[Dict[str, Any]]) -> List[ResearchTrend]:
        self.db.query(ResearchTrend).filter(ResearchTrend.research_id == research_id).delete()
        entities = [
            ResearchTrend(
                research_id=research_id,
                year=tr["year"],
                paper_count=tr.get("paper_count", 0),
                themes=tr.get("themes", []),
                emerging_themes=tr.get("emerging_themes", [])
            )
            for tr in trends
        ]
        self.db.add_all(entities)
        self.db.commit()
        return entities

    def list_trends(self, research_id: str) -> List[ResearchTrend]:
        return self.db.query(ResearchTrend).filter(ResearchTrend.research_id == research_id).order_by(ResearchTrend.year.asc()).all()

    def create_gap(
        self,
        research_id: str,
        gap_type: str,
        title: str,
        description: str,
        affected_themes: List[str],
        evidence_strength: str = "moderate",
        confidence: float = 0.75,
        status: str = "POTENTIAL",
        novelty_status: str = "potential_gap",
        critic_notes: Optional[str] = None,
        iteration_count: int = 1,
        derived_from: Optional[List[Dict[str, Any]]] = None,
        cross_paper_pattern: Optional[str] = None,
        missing_evidence: Optional[str] = None,
        confidence_rationale: Optional[str] = None,
    ) -> ResearchGap:
        gap = ResearchGap(
            research_id=research_id,
            gap_type=gap_type,
            title=title,
            description=description,
            affected_themes=affected_themes,
            evidence_strength=evidence_strength,
            confidence=confidence,
            status=status,
            novelty_status=novelty_status,
            critic_notes=critic_notes,
            iteration_count=iteration_count,
            derived_from=derived_from or [],
            cross_paper_pattern=cross_paper_pattern,
            missing_evidence=missing_evidence,
            confidence_rationale=confidence_rationale,
        )
        self.db.add(gap)
        self.db.commit()
        self.db.refresh(gap)
        return gap

    def get_gap(self, gap_id: str) -> Optional[ResearchGap]:
        return self.db.query(ResearchGap).filter(ResearchGap.id == gap_id).first()

    def list_gaps(self, research_id: str) -> List[ResearchGap]:
        return self.db.query(ResearchGap).filter(ResearchGap.research_id == research_id).all()

    def update_gap(self, gap_id: str, **kwargs) -> Optional[ResearchGap]:
        gap = self.get_gap(gap_id)
        if not gap:
            return None
        for k, v in kwargs.items():
            if hasattr(gap, k):
                setattr(gap, k, v)
        gap.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(gap)
        return gap

    def add_gap_evidence(self, gap_id: str, evidence_list: List[Dict[str, Any]]) -> List[GapEvidence]:
        entities = [
            GapEvidence(
                gap_id=gap_id,
                paper_id=e.get("paper_id"),
                document_id=e.get("document_id"),
                paper_title=e.get("paper_title"),
                page_number=e.get("page_number", 1),
                section=e.get("section", "general"),
                chunk_id=e.get("chunk_id"),
                snippet=e["snippet"],
                source_url=e.get("source_url"),
                retrieval_score=e.get("retrieval_score", 0.0),
                confidence=e.get("confidence", 0.8),
                evidence_strength=e.get("evidence_strength", "moderate"),
                is_supporting=1 if e.get("is_supporting", True) else 0
            )
            for e in evidence_list
        ]
        self.db.add_all(entities)
        self.db.commit()
        return entities

    def save_contradictions(self, research_id: str, contradictions: List[Dict[str, Any]]) -> List[Contradiction]:
        self.db.query(Contradiction).filter(Contradiction.research_id == research_id).delete()
        entities = [
            Contradiction(
                research_id=research_id,
                topic=c["topic"],
                paper_a_id=c["paper_a_id"],
                paper_a_title=c["paper_a_title"],
                finding_a=c["finding_a"],
                paper_b_id=c["paper_b_id"],
                paper_b_title=c["paper_b_title"],
                finding_b=c["finding_b"],
                context=c.get("context"),
                methodology_differences=c.get("methodology_differences"),
                population_differences=c.get("population_differences"),
                possible_explanation=c.get("possible_explanation"),
                contradiction_type=c.get("contradiction_type", "genuine_contradiction"),
                evidence=c.get("evidence", [])
            )
            for c in contradictions
        ]
        self.db.add_all(entities)
        self.db.commit()
        return entities

    def list_contradictions(self, research_id: str) -> List[Contradiction]:
        return self.db.query(Contradiction).filter(Contradiction.research_id == research_id).all()


class DraftRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_questions(self, research_id: str, questions: List[Dict[str, Any]]) -> List[ResearchQuestion]:
        entities = [
            ResearchQuestion(
                research_id=research_id,
                gap_id=q.get("gap_id"),
                question=q["question"],
                rationale=q.get("rationale"),
                scope=q.get("scope"),
                is_primary=1 if q.get("is_primary", False) else 0
            )
            for q in questions
        ]
        self.db.add_all(entities)
        self.db.commit()
        return entities

    def list_questions(self, research_id: str) -> List[ResearchQuestion]:
        return self.db.query(ResearchQuestion).filter(ResearchQuestion.research_id == research_id).all()

    def save_objectives(self, research_id: str, objectives: List[Dict[str, Any]]) -> List[ResearchObjective]:
        entities = [
            ResearchObjective(
                research_id=research_id,
                question_id=o.get("question_id"),
                objective=o["objective"],
                target_outcome=o.get("target_outcome"),
                order_index=o.get("order_index", 1)
            )
            for o in objectives
        ]
        self.db.add_all(entities)
        self.db.commit()
        return entities

    def list_objectives(self, research_id: str) -> List[ResearchObjective]:
        return self.db.query(ResearchObjective).filter(ResearchObjective.research_id == research_id).order_by(ResearchObjective.order_index.asc()).all()

    def save_hypotheses(self, research_id: str, hypotheses: List[Dict[str, Any]]) -> List[ResearchHypothesis]:
        entities = [
            ResearchHypothesis(
                research_id=research_id,
                question_id=h.get("question_id"),
                statement=h["statement"],
                rationale=h.get("rationale"),
                variables=h.get("variables", {}),
                testability=h.get("testability", "high")
            )
            for h in hypotheses
        ]
        self.db.add_all(entities)
        self.db.commit()
        return entities

    def list_hypotheses(self, research_id: str) -> List[ResearchHypothesis]:
        return self.db.query(ResearchHypothesis).filter(ResearchHypothesis.research_id == research_id).all()

    def save_methodology_suggestions(self, research_id: str, suggestions: List[Dict[str, Any]]) -> List[MethodologySuggestion]:
        entities = [
            MethodologySuggestion(
                research_id=research_id,
                approach=s["approach"],
                design=s["design"],
                rationale=s["rationale"],
                data_collection=s.get("data_collection"),
                analysis_plan=s.get("analysis_plan"),
                potential_threats_to_validity=s.get("potential_threats_to_validity", [])
            )
            for s in suggestions
        ]
        self.db.add_all(entities)
        self.db.commit()
        return entities

    def list_methodology_suggestions(self, research_id: str) -> List[MethodologySuggestion]:
        return self.db.query(MethodologySuggestion).filter(MethodologySuggestion.research_id == research_id).all()

    def get_or_create_draft(self, research_id: str, title: str) -> Draft:
        draft = self.db.query(Draft).filter(Draft.research_id == research_id).first()
        if not draft:
            draft = Draft(
                research_id=research_id,
                title=title,
                status="draft",
                version=1
            )
            self.db.add(draft)
            self.db.commit()
            self.db.refresh(draft)
        return draft

    def save_or_update_section(self, draft_id: str, section_name: str, content: str, order_index: int, citations: Optional[List[str]] = None) -> DraftSection:
        section = self.db.query(DraftSection).filter(
            DraftSection.draft_id == draft_id,
            DraftSection.section_name == section_name
        ).first()

        if section:
            section.content = content
            section.order_index = order_index
            if citations is not None:
                section.citations = citations
            section.updated_at = datetime.utcnow()
        else:
            section = DraftSection(
                draft_id=draft_id,
                section_name=section_name,
                content=content,
                order_index=order_index,
                citations=citations or []
            )
            self.db.add(section)

        self.db.commit()
        self.db.refresh(section)
        return section

    def get_draft(self, research_id: str) -> Optional[Draft]:
        return self.db.query(Draft).filter(Draft.research_id == research_id).first()

    def get_section(self, section_id: str) -> Optional[DraftSection]:
        return self.db.query(DraftSection).filter(DraftSection.id == section_id).first()


class CitationRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_references(self, research_id: str, references: List[Dict[str, Any]]) -> List[Reference]:
        entities = []
        for r in references:
            ref = Reference(
                research_id=research_id,
                paper_id=r.get("paper_id"),
                citation_key=r.get("citation_key", f"ref_{len(entities)+1}"),
                title=r["title"],
                authors=r.get("authors", []),
                year=r.get("year"),
                venue=r.get("venue"),
                volume=r.get("volume"),
                issue=r.get("issue"),
                pages=r.get("pages"),
                doi=r.get("doi"),
                url=r.get("url")
            )
            entities.append(ref)
        self.db.add_all(entities)
        self.db.commit()
        return entities

    def list_references(self, research_id: str) -> List[Reference]:
        return self.db.query(Reference).filter(Reference.research_id == research_id).all()
