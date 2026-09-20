from typing import Literal
from backend.app.graph.state import ResearchState


def should_investigate_gaps(state: ResearchState) -> Literal["investigate_gap", "develop_research"]:
    current_iter = state.get("iteration", 1)
    max_iter = state.get("max_iterations", 3)

    if current_iter >= max_iter:
        return "develop_research"

    validation_map = state.get("gap_validation", {})
    if not validation_map:
        return "develop_research"

    has_unvalidated_gap = False
    for gap_id, val in validation_map.items():
        if val.get("status") in ("INSUFFICIENT", "POTENTIAL", "CANDIDATE", "SUPPORTED", "CONTESTED") or val.get("status") != "VALID":
            has_unvalidated_gap = True
            break

    if has_unvalidated_gap:
        return "investigate_gap"

    return "develop_research"
