from backend.app.database.repositories import ResearchRepository
from backend.app.models.research import ResearchStatusEnum


def test_research_project_lifecycle(db_session):
    repo = ResearchRepository(db_session)
    project = repo.create_project(
        title="Automated Gap Detection in LLMs",
        topic="LLM Reasoning and Hallucination Reduction",
        description="Comprehensive literature investigation",
    )

    assert project.id is not None
    assert project.status == ResearchStatusEnum.PLANNING.value
    assert project.progress == 0.0

    retrieved = repo.get_project(project.id)
    assert retrieved is not None
    assert retrieved.title == "Automated Gap Detection in LLMs"

    updated = repo.update_project_status(
        project_id=project.id,
        status=ResearchStatusEnum.DISCOVERING.value,
        progress=0.35,
        research_plan={"step": "literature_search"},
    )
    assert updated.status == ResearchStatusEnum.DISCOVERING.value
    assert updated.progress == 0.35
    assert updated.research_plan == {"step": "literature_search"}


def test_research_job_and_activity_tracking(db_session):
    repo = ResearchRepository(db_session)
    project = repo.create_project(
        title="Agentic Workflows",
        topic="Autonomous Coding Agents",
    )

    job = repo.create_job(research_id=project.id, current_agent="planner")
    assert job.id is not None
    assert job.current_agent == "planner"
    assert job.status == ResearchStatusEnum.PLANNING.value

    updated_job = repo.update_job(
        job_id=job.id,
        status=ResearchStatusEnum.COMPLETED.value,
        progress=1.0,
        current_agent="draft_agent",
    )
    assert updated_job.status == ResearchStatusEnum.COMPLETED.value
    assert updated_job.completed_at is not None

    activity = repo.log_activity(
        research_id=project.id,
        agent_name="planner",
        activity_type="plan_created",
        message="Created research plan",
    )
    assert activity.id is not None

    activities = repo.list_activities(project.id)
    assert len(activities) == 1
    assert activities[0].activity_type == "plan_created"
