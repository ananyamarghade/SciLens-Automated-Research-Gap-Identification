from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import gradio as gr

from backend.app.utils.config import get_settings
from backend.app.database.database import init_db
from backend.app.api.research import router as research_router
from backend.app.api.papers import router as papers_router
from backend.app.api.landscape import router as landscape_router
from backend.app.api.gaps import router as gaps_router
from backend.app.api.development import router as development_router
from backend.app.api.drafting import router as drafting_router
from backend.app.api.citations import router as citations_router
from backend.app.api.export import router as export_router
from backend.app.api.agent_activity import router as agent_activity_router
from backend.app.api.auth import router as auth_router
from backend.app.gradio.ask_across_papers import create_ask_across_papers_ui

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="SciLens — Automated Research Gap Identification API",
    description="Agentic AI backend for literature discovery, RAG-grounded evidence extraction, research landscape synthesis, multi-category gap detection, agentic evidence criticism, and proposal drafting.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.API_V1_PREFIX
app.include_router(research_router, prefix=prefix)
app.include_router(papers_router, prefix=prefix)
app.include_router(landscape_router, prefix=prefix)
app.include_router(gaps_router, prefix=prefix)
app.include_router(development_router, prefix=prefix)
app.include_router(drafting_router, prefix=prefix)
app.include_router(citations_router, prefix=prefix)
app.include_router(export_router, prefix=prefix)
app.include_router(agent_activity_router, prefix=prefix)
app.include_router(auth_router, prefix=prefix)

gradio_ui = create_ask_across_papers_ui()
app = gr.mount_gradio_app(app, gradio_ui, path="/gradio")


@app.get("/")
def root():
    return {
        "system": "SciLens Backend",
        "status": "online",
        "docs": "/docs",
        "gradio_ui": "/gradio",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    from fastapi import Response
    return Response(status_code=204)
