from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.repositories import DraftRepository, ResearchRepository
from backend.app.models.draft import (
    ResearchQuestionSchema,
    ResearchObjectiveSchema,
    ResearchHypothesisSchema,
    MethodologySuggestionSchema,
)
from backend.app.agents.research_development_agent import ResearchDevelopmentAgent
from backend.app.services.llm_service import get_llm_provider

router = APIRouter(prefix="/research/{research_id}", tags=["Research Development"])


@router.post("/questions", response_model=List[ResearchQuestionSchema])
def generate_questions(
    research_id: str,
    db: Session = Depends(get_db),
):
    research_repo = ResearchRepository(db)
    if not research_repo.get_project(research_id):
        raise HTTPException(status_code=404, detail="Research project not found")

    draft_repo = DraftRepository(db)
    existing = draft_repo.list_questions(research_id)
    if existing:
        return [
            ResearchQuestionSchema(
                id=q.id,
                research_id=q.research_id,
                gap_id=q.gap_id,
                question=q.question,
                rationale=q.rationale,
                scope=q.scope,
                is_primary=bool(q.is_primary),
            )
            for q in existing
        ]

    llm = get_llm_provider()
    dev_agent = ResearchDevelopmentAgent(db, llm)
    dev_agent.develop_research_framework(research_id)
    questions = draft_repo.list_questions(research_id)
    return [
        ResearchQuestionSchema(
            id=q.id,
            research_id=q.research_id,
            gap_id=q.gap_id,
            question=q.question,
            rationale=q.rationale,
            scope=q.scope,
            is_primary=bool(q.is_primary),
        )
        for q in questions
    ]


@router.post("/objectives", response_model=List[ResearchObjectiveSchema])
def generate_objectives(
    research_id: str,
    db: Session = Depends(get_db),
):
    draft_repo = DraftRepository(db)
    existing = draft_repo.list_objectives(research_id)
    if existing:
        return [
            ResearchObjectiveSchema(
                id=o.id,
                research_id=o.research_id,
                question_id=o.question_id,
                objective=o.objective,
                target_outcome=o.target_outcome,
                order_index=o.order_index,
            )
            for o in existing
        ]

    llm = get_llm_provider()
    dev_agent = ResearchDevelopmentAgent(db, llm)
    dev_agent.develop_research_framework(research_id)
    objectives = draft_repo.list_objectives(research_id)
    return [
        ResearchObjectiveSchema(
            id=o.id,
            research_id=o.research_id,
            question_id=o.question_id,
            objective=o.objective,
            target_outcome=o.target_outcome,
            order_index=o.order_index,
        )
        for o in objectives
    ]


@router.post("/hypotheses", response_model=List[ResearchHypothesisSchema])
def generate_hypotheses(
    research_id: str,
    db: Session = Depends(get_db),
):
    draft_repo = DraftRepository(db)
    existing = draft_repo.list_hypotheses(research_id)
    if existing:
        return [
            ResearchHypothesisSchema(
                id=h.id,
                research_id=h.research_id,
                question_id=h.question_id,
                statement=h.statement,
                rationale=h.rationale,
                variables=h.variables or {},
                testability=h.testability,
            )
            for h in existing
        ]

    llm = get_llm_provider()
    dev_agent = ResearchDevelopmentAgent(db, llm)
    dev_agent.develop_research_framework(research_id)
    hypotheses = draft_repo.list_hypotheses(research_id)
    return [
        ResearchHypothesisSchema(
            id=h.id,
            research_id=h.research_id,
            question_id=h.question_id,
            statement=h.statement,
            rationale=h.rationale,
            variables=h.variables or {},
            testability=h.testability,
        )
        for h in hypotheses
    ]


@router.post("/methodology", response_model=List[MethodologySuggestionSchema])
def generate_methodology(
    research_id: str,
    db: Session = Depends(get_db),
):
    draft_repo = DraftRepository(db)
    existing = draft_repo.list_methodology_suggestions(research_id)
    if existing:
        return [
            MethodologySuggestionSchema(
                id=s.id,
                research_id=s.research_id,
                approach=s.approach,
                design=s.design,
                rationale=s.rationale,
                data_collection=s.data_collection,
                analysis_plan=s.analysis_plan,
                potential_threats_to_validity=s.potential_threats_to_validity or [],
            )
            for s in existing
        ]

    llm = get_llm_provider()
    dev_agent = ResearchDevelopmentAgent(db, llm)
    dev_agent.develop_research_framework(research_id)
    suggestions = draft_repo.list_methodology_suggestions(research_id)
    return [
        MethodologySuggestionSchema(
            id=s.id,
            research_id=s.research_id,
            approach=s.approach,
            design=s.design,
            rationale=s.rationale,
            data_collection=s.data_collection,
            analysis_plan=s.analysis_plan,
            potential_threats_to_validity=s.potential_threats_to_validity or [],
        )
        for s in suggestions
    ]


@router.get("/questions", response_model=List[ResearchQuestionSchema])
def get_questions(
    research_id: str,
    db: Session = Depends(get_db),
):
    draft_repo = DraftRepository(db)
    questions = draft_repo.list_questions(research_id)
    return [
        ResearchQuestionSchema(
            id=q.id,
            research_id=q.research_id,
            gap_id=q.gap_id,
            question=q.question,
            rationale=q.rationale,
            scope=q.scope,
            is_primary=bool(q.is_primary),
        )
        for q in questions
    ]


@router.get("/objectives", response_model=List[ResearchObjectiveSchema])
def get_objectives(
    research_id: str,
    db: Session = Depends(get_db),
):
    draft_repo = DraftRepository(db)
    objectives = draft_repo.list_objectives(research_id)
    return [
        ResearchObjectiveSchema(
            id=o.id,
            research_id=o.research_id,
            question_id=o.question_id,
            objective=o.objective,
            target_outcome=o.target_outcome,
            order_index=o.order_index,
        )
        for o in objectives
    ]


@router.get("/hypotheses", response_model=List[ResearchHypothesisSchema])
def get_hypotheses(
    research_id: str,
    db: Session = Depends(get_db),
):
    draft_repo = DraftRepository(db)
    hypotheses = draft_repo.list_hypotheses(research_id)
    return [
        ResearchHypothesisSchema(
            id=h.id,
            research_id=h.research_id,
            question_id=h.question_id,
            statement=h.statement,
            rationale=h.rationale,
            variables=h.variables or {},
            testability=h.testability,
        )
        for h in hypotheses
    ]


@router.get("/methodologies", response_model=List[MethodologySuggestionSchema])
@router.get("/methodology", response_model=List[MethodologySuggestionSchema])
def get_methodologies(
    research_id: str,
    db: Session = Depends(get_db),
):
    draft_repo = DraftRepository(db)
    suggestions = draft_repo.list_methodology_suggestions(research_id)
    return [
        MethodologySuggestionSchema(
            id=s.id,
            research_id=s.research_id,
            approach=s.approach,
            design=s.design,
            rationale=s.rationale,
            data_collection=s.data_collection,
            analysis_plan=s.analysis_plan,
            potential_threats_to_validity=s.potential_threats_to_validity or [],
        )
        for s in suggestions
    ]


@router.get("/development")
def get_development_aggregate(
    research_id: str,
    db: Session = Depends(get_db),
):
    draft_repo = DraftRepository(db)
    questions = draft_repo.list_questions(research_id)
    objectives = draft_repo.list_objectives(research_id)
    hypotheses = draft_repo.list_hypotheses(research_id)
    methodologies = draft_repo.list_methodology_suggestions(research_id)

    return {
        "researchQuestions": [
            {
                "id": q.id,
                "question": q.question,
                "rationale": q.rationale,
                "isPrimary": bool(q.is_primary),
                "scope": q.scope,
                "groundedGaps": [q.gap_id] if q.gap_id else [],
                "expectedContribution": q.scope or "Targeted contribution to the research gap",
                "suggestedMethodology": "Empirical Controlled Investigation",
                "difficulty": "High",
            }
            for q in questions
        ],
        "studyObjectives": [
            {
                "id": o.id,
                "objective": o.objective,
                "targetOutcome": o.target_outcome,
                "targetMetric": o.target_outcome,
                "milestone": f"Milestone {idx + 1}",
            }
            for idx, o in enumerate(objectives)
        ],
        "objectives": [
            {
                "id": o.id,
                "objective": o.objective,
                "targetOutcome": o.target_outcome,
                "targetMetric": o.target_outcome,
                "milestone": f"Milestone {idx + 1}",
            }
            for idx, o in enumerate(objectives)
        ],
        "hypotheses": [
            {
                "id": h.id,
                "statement": h.statement,
                "rationale": h.rationale,
                "variables": h.variables or {},
                "independentVars": [h.variables.get("independent", "AI Scaffolding Exposure")] if isinstance(h.variables, dict) else [],
                "dependentVars": [h.variables.get("dependent", "Writing Quality")] if isinstance(h.variables, dict) else [],
                "falsificationCondition": "No statistically significant difference observed on blinded post-tests.",
                "validationMethod": "Two-tailed mixed-effects regression.",
                "testability": h.testability or "High",
            }
            for h in hypotheses
        ],
        "methodologicalRoadmap": [
            {
                "phase": f"Phase 0{idx + 1}",
                "title": m.approach,
                "description": m.design,
                "duration": "4–6 Months",
                "deliverables": [m.data_collection, m.analysis_plan],
            }
            for idx, m in enumerate(methodologies)
        ],
        "methodologySuggestions": [
            {
                "id": m.id,
                "approach": m.approach,
                "design": m.design,
                "rationale": m.rationale,
                "dataCollection": m.data_collection,
                "analysisPlan": m.analysis_plan,
                "potentialThreatsToValidity": m.potential_threats_to_validity or [],
            }
            for m in methodologies
        ],
    }
