import asyncio
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from backend.app.database.database import SessionLocal
from backend.app.database.repositories import ResearchRepository, PaperRepository, GapRepository, DraftRepository
from backend.app.models.research import ResearchStatusEnum
from backend.app.utils.config import Settings, get_settings
from backend.app.services.llm_service import get_llm_provider
from backend.app.services.paper_search import PaperSearchService
from backend.app.services.full_text_service import FullTextService
from backend.app.services.analysis_service import AnalysisService
from backend.app.services.landscape_service import LandscapeService
from backend.app.services.gap_service import GapService
from backend.app.services.draft_service import DraftService
from backend.app.rag.embeddings import get_embeddings_engine
from backend.app.rag.vector_store import FAISSVectorStore
from backend.app.rag.retriever import ResearchRetriever
from backend.app.agents.planner import PlannerAgent
from backend.app.agents.literature_agent import LiteratureAgent
from backend.app.agents.landscape_agent import LandscapeAgent
from backend.app.agents.gap_detection_agent import GapDetectionAgent
from backend.app.agents.evidence_critic import EvidenceCriticAgent
from backend.app.agents.gap_investigator import GapInvestigatorAgent
from backend.app.agents.research_development_agent import ResearchDevelopmentAgent
from backend.app.agents.draft_agent import DraftAgent
from backend.app.graph.nodes import ResearchGraphNodes
from backend.app.graph.workflow import build_research_graph


class ResearchService:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()

    async def execute_research_workflow(self, research_id: str, job_id: str) -> None:
        db = SessionLocal()
        research_repo = ResearchRepository(db)
        paper_repo = PaperRepository(db)

        try:
            project = research_repo.get_project(research_id)
            if not project:
                return

            research_repo.update_job(job_id, ResearchStatusEnum.PLANNING.value, 0.10, "planner")
            research_repo.update_project_status(research_id, ResearchStatusEnum.PLANNING.value, 0.10)

            llm = get_llm_provider(self.settings, allow_mock=(self.settings.APP_ENV == "testing"))
            search_service = PaperSearchService(self.settings)
            full_text_service = FullTextService(self.settings)
            embeddings = get_embeddings_engine(self.settings)
            vector_store = FAISSVectorStore(dimension=embeddings.dimension)
            retriever = ResearchRetriever(embeddings=embeddings, vector_store=vector_store)

            analysis_service = AnalysisService(db, llm=llm, settings=self.settings)
            landscape_service = LandscapeService(db, llm=llm, settings=self.settings)
            gap_service = GapService(db, llm=llm, retriever=retriever, settings=self.settings)
            draft_service = DraftService(db, llm=llm, retriever=retriever, settings=self.settings)

            planner_agent = PlannerAgent(llm)
            literature_agent = LiteratureAgent(search_service, llm)
            landscape_agent = LandscapeAgent(landscape_service)
            gap_detection_agent = GapDetectionAgent(gap_service)
            evidence_critic_agent = EvidenceCriticAgent(llm)
            gap_investigator_agent = GapInvestigatorAgent(
                db=db,
                search_service=search_service,
                full_text_service=full_text_service,
                embeddings=embeddings,
                vector_store=vector_store,
                llm=llm,
            )
            research_dev_agent = ResearchDevelopmentAgent(db, llm)
            draft_agent = DraftAgent(draft_service)

            graph_nodes = ResearchGraphNodes(
                planner_agent=planner_agent,
                literature_agent=literature_agent,
                landscape_agent=landscape_agent,
                gap_detection_agent=gap_detection_agent,
                evidence_critic_agent=evidence_critic_agent,
                gap_investigator_agent=gap_investigator_agent,
                research_dev_agent=research_dev_agent,
                draft_agent=draft_agent,
                db=db,
            )

            graph = build_research_graph(graph_nodes)

            docs = research_repo.list_documents(research_id)
            uploaded_docs_data = [
                {"document_id": d.id, "filename": d.filename, "pages": d.page_count}
                for d in docs
            ]

            initial_state = {
                "research_id": research_id,
                "topic": project.topic,
                "uploaded_documents": uploaded_docs_data,
                "iteration": 1,
                "max_iterations": self.settings.MAX_INVESTIGATION_ITERATIONS,
            }

            research_repo.update_job(job_id, ResearchStatusEnum.DISCOVERING.value, 0.25, "literature_agent")
            research_repo.update_project_status(research_id, ResearchStatusEnum.DISCOVERING.value, 0.25)

            final_state = await graph.ainvoke(initial_state)

            research_repo.update_job(job_id, ResearchStatusEnum.COMPLETED.value, 1.0, "completed")
            research_repo.update_project_status(
                project_id=research_id,
                status=ResearchStatusEnum.COMPLETED.value,
                progress=1.0,
                research_plan=final_state.get("research_plan"),
            )

            research_repo.log_activity(
                research_id=research_id,
                agent_name="research_service",
                activity_type="workflow_completed",
                message=f"Research workflow for '{project.title}' completed successfully",
            )

        except Exception as ex:
            research_repo.update_job(
                job_id=job_id,
                status=ResearchStatusEnum.FAILED.value,
                progress=0.0,
                current_agent="failed",
                error_message=str(ex),
            )
            research_repo.update_project_status(
                project_id=research_id,
                status=ResearchStatusEnum.FAILED.value,
                progress=0.0,
            )
            research_repo.log_activity(
                research_id=research_id,
                agent_name="research_service",
                activity_type="workflow_failed",
                message=f"Workflow failed: {str(ex)}",
            )
        finally:
            db.close()

    def start_research_workflow(self, research_id: str, db: Session) -> str:
        research_repo = ResearchRepository(db)
        job = research_repo.create_job(research_id=research_id, current_agent="planner")
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.execute_research_workflow(research_id, job.id))
        except RuntimeError:
            import threading
            threading.Thread(
                target=lambda: asyncio.run(self.execute_research_workflow(research_id, job.id)),
                daemon=True,
            ).start()
        return job.id

