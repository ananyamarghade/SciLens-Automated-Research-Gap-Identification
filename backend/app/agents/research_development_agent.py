from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.database.repositories import DraftRepository, GapRepository, ResearchRepository
from backend.app.services.llm_service import LLMProviderBase


class ResearchDevelopmentAgent:
    def __init__(self, db: Session, llm: LLMProviderBase):
        self.db = db
        self.llm = llm
        self.draft_repo = DraftRepository(db)
        self.gap_repo = GapRepository(db)
        self.research_repo = ResearchRepository(db)

    def develop_research_framework(self, research_id: str, gap_id: Optional[str] = None) -> Dict[str, Any]:
        project = self.research_repo.get_project(research_id)
        topic = project.topic if project else "Scientific Discovery"

        selected_gap = None
        if gap_id:
            selected_gap = self.gap_repo.get_gap(gap_id)
        else:
            gaps = self.gap_repo.list_gaps(research_id)
            if gaps:
                selected_gap = gaps[0]

        gap_desc = selected_gap.description if selected_gap else f"Observed limitations in {topic}"

        questions_data = [
            {
                "gap_id": selected_gap.id if selected_gap else None,
                "question": f"How can empirical architectural interventions overcome the documented bottleneck in {topic}?",
                "rationale": f"Directly addresses the core limitation: {gap_desc}",
                "scope": "Systemic and algorithmic formulation",
                "is_primary": True,
            },
            {
                "gap_id": selected_gap.id if selected_gap else None,
                "question": f"To what degree do environmental and load variations affect performance generalizability in {topic}?",
                "rationale": "Evaluates robustness and boundary conditions identified across literature.",
                "scope": "Empirical benchmarking",
                "is_primary": False,
            },
        ]
        saved_questions = self.draft_repo.save_questions(research_id, questions_data)
        primary_q_id = saved_questions[0].id if saved_questions else None

        objectives_data = [
            {
                "question_id": primary_q_id,
                "objective": f"Formalize an adaptive algorithmic framework mitigating {gap_desc}.",
                "target_outcome": "Demonstrated reduction in operational variance.",
                "order_index": 1,
            },
            {
                "question_id": primary_q_id,
                "objective": "Perform controlled comparative benchmarks against current state-of-the-art baselines.",
                "target_outcome": "Statistically validated performance metrics across standard datasets.",
                "order_index": 2,
            },
        ]
        saved_objectives = self.draft_repo.save_objectives(research_id, objectives_data)

        hypotheses_data = [
            {
                "question_id": primary_q_id,
                "statement": f"Integrating dynamic adaptation within {topic} will yield at least a 15% efficiency gain without precision decay.",
                "rationale": "Grounded in previous partial optimizations observed in the literature.",
                "variables": {
                    "independent": "Adaptation Algorithm Configuration",
                    "dependent": "Computational Latency and Accuracy",
                    "control": "Standard Hardware Benchmark Rig",
                },
                "testability": "high",
            }
        ]
        saved_hypotheses = self.draft_repo.save_hypotheses(research_id, hypotheses_data)

        suggestions_data = [
            {
                "approach": "Mixed Methods Empirical Evaluation",
                "design": "Repeated-measures factorial experiment coupled with qualitative failure-mode categorization.",
                "rationale": "Combines statistical rigor with explanatory depth needed to resolve literature ambiguities.",
                "data_collection": "Automated telemetry collection over synthetic and real-world trace datasets.",
                "analysis_plan": "Analysis of variance (ANOVA) followed by post-hoc Tukey HSD tests with 95% confidence intervals.",
                "potential_threats_to_validity": [
                    "Construct validity: synthetic traces might not capture extreme production spikes.",
                    "External validity: performance characteristics may vary across non-standard compute nodes.",
                ],
            }
        ]
        saved_suggestions = self.draft_repo.save_methodology_suggestions(research_id, suggestions_data)

        self.research_repo.log_activity(
            research_id=research_id,
            agent_name="research_development_agent",
            activity_type="framework_developed",
            message=f"Formulated {len(saved_questions)} research questions, {len(saved_objectives)} objectives, and methodology recommendations",
        )

        return {
            "questions": [q.question for q in saved_questions],
            "objectives": [o.objective for o in saved_objectives],
            "hypotheses": [h.statement for h in saved_hypotheses],
            "methodology": suggestions_data[0],
        }
