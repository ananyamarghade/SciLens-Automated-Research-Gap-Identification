from typing import TypedDict, List, Dict, Any, Optional


class ResearchState(TypedDict, total=False):
    research_id: str
    topic: str
    uploaded_documents: List[Dict[str, Any]]
    research_plan: Dict[str, Any]
    search_queries: List[str]
    discovered_papers: List[Dict[str, Any]]
    selected_papers: List[Dict[str, Any]]
    retrieved_evidence: List[Dict[str, Any]]
    paper_analyses: List[Dict[str, Any]]
    themes: List[Dict[str, Any]]
    trends: List[Dict[str, Any]]
    methodology_distribution: Dict[str, int]
    contradictions: List[Dict[str, Any]]
    candidate_gaps: List[Dict[str, Any]]
    gap_evidence: Dict[str, List[Dict[str, Any]]]
    gap_validation: Dict[str, Dict[str, Any]]
    research_questions: List[str]
    objectives: List[str]
    hypotheses: List[str]
    methodology: Dict[str, Any]
    draft: Dict[str, Any]
    agent_activity: List[Dict[str, Any]]
    iteration: int
    max_iterations: int
    next_action: str
    errors: List[str]
