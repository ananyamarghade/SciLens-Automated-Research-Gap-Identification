# SciLens — Automated Research Gap Identification

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ananyamarghade/SciLens-Automated-Research-Gap-Identification)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://scilens-automated-research-gap-identification.vercel.app)

- **🌐 Live Demo (Vercel):** [https://scilens-automated-research-gap-identification.vercel.app](https://scilens-automated-research-gap-identification.vercel.app)
- **💻 GitHub Repository:** [https://github.com/ananyamarghade/SciLens-Automated-Research-Gap-Identification](https://github.com/ananyamarghade/SciLens-Automated-Research-Gap-Identification)

SciLens is an autonomous AI-powered research assistant engine that identifies empirical research gaps, synthesizes literature landscapes, validates candidate gaps through an agentic evidence critic loop, formulates research frameworks, and exports research proposals.

---

## 1. System Overview

SciLens enables researchers to:
1. Input research topics and ingest single or multiple academic PDF documents.
2. Search and discover open-access academic literature from OpenAlex, Semantic Scholar, CrossRef, and arXiv.
3. Acquire legally accessible full-text PDFs (via OpenAlex open-access endpoints and arXiv) for page-level, section-aware RAG evidence.
4. Extract structured analytical details per paper (methodology, datasets, populations, geographies, theoretical frameworks, limitations, and future work).
5. Synthesize academic research landscapes: thematic clustering, chronological trend lines, methodology distributions, population breakdowns, and paper relationship networks.
6. Detect multi-type research gaps: methodological, population, geographical, contextual, temporal, theoretical, technological, data, and contradictory findings.
7. Execute an agentic LangGraph cyclic feedback loop: candidate gaps are evaluated by an Evidence Critic; if evidence is insufficient, a Gap Investigator triggers targeted literature discovery and re-evaluates until validated or max iterations are reached.
8. Assess evidence-based novelty without ungrounded absolute claims (`well_supported`, `potential_gap`, `insufficient_evidence`).
9. Formulate research questions, objectives, hypotheses, and methodology suggestions.
10. Generate structured research proposal drafts and verify claims against retrieved literature.
11. Format citations across six major styles (APA 7, IEEE, MLA 9, Harvard, Chicago, Vancouver).
12. Export formatted academic documents to DOCX and PDF.
13. Interact conversationally with the corpus using the integrated Gradio "Ask Across Papers" interface.

---

## 2. Architecture

```
                               ┌────────────────────────────────┐
                               │   FastAPI & Gradio Interface   │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     LangGraph StateGraph Engine   │
                              └────────────────┬─────────────────┘
                                               │
        ┌──────────────────────────────────────┼──────────────────────────────────────┐
        ▼                                      ▼                                      ▼
┌───────────────┐                     ┌─────────────────┐                    ┌─────────────────┐
│ Planner Agent │                     │ Literature Node │                    │ Landscape Agent │
└───────┬───────┘                     └────────┬────────┘                    └────────┬────────┘
        │                                      │                                      │
        └──────────────────────────────────────┼──────────────────────────────────────┘
                                               ▼
                                  ┌─────────────────────────┐
                                  │   Gap Detection Agent   │
                                  └────────────┬────────────┘
                                               ▼
                                  ┌─────────────────────────┐
                             ┌───►│  Evidence Critic Agent  │◄───┐
                             │    └────────────┬────────────┘    │
                             │                 │                 │
                             │        [INSUFFICIENT &            │
                             │        iteration < max]           │
                             │                 ▼                 │
                             │    ┌─────────────────────────┐    │
                             │    │ Gap Investigator Agent  │    │
                             │    └────────────┬────────────┘    │
                             │                 │                 │
                             │                 ▼                 │
                             │    ┌─────────────────────────┐    │
                             │    │ Paper Search & RAG Ingest├───┘
                             │    └─────────────────────────┘
                             │
                      [VALID / POTENTIAL /
                     max_iterations reached]
                             │
                             ▼
              ┌───────────────────────────────┐
              │ Research Development Agent    │
              └──────────────┬────────────────┘
                             ▼
              ┌───────────────────────────────┐
              │ Draft & Verification Agent    │
              └──────────────┬────────────────┘
                             ▼
              ┌───────────────────────────────┐
              │ Export Service (DOCX & PDF)   │
              └───────────────────────────────┘
```

---

## 3. Technology Stack

- **Framework**: Python 3.11, FastAPI, Uvicorn, Pydantic v2, Pydantic Settings
- **Agent Orchestration**: LangGraph, LangChain Core, LangChain Community
- **LLM Abstraction**: Multi-provider architecture supporting OpenAI, Anthropic, Groq, and deterministic MockLLM for unit tests
- **RAG & Embeddings**: FAISS vector indexing with SQLite persistent chunk index; SentenceTransformers and OpenAI embeddings
- **Document Processing**: PyPDF, PDFPlumber, PyMuPDF
- **Document Export**: python-docx, ReportLab
- **Interactive UI**: Gradio (mounted directly within FastAPI at `/gradio`)
- **Database**: SQLite with SQLAlchemy ORM (swappable to PostgreSQL via `DATABASE_URL`)
- **Testing**: Pytest, Pytest-Asyncio, HTTPX

---

## 4. Directory Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI application entry point and Gradio mount
│   ├── api/                     # REST API routers
│   │   ├── research.py          # Project management and execution status
│   │   ├── papers.py            # PDF upload, paper search, and comparison
│   │   ├── landscape.py         # Thematic clusters, trends, and network graphs
│   │   ├── gaps.py              # Gap detection, validation, and heatmap data
│   │   ├── development.py       # Questions, objectives, and hypotheses
│   │   ├── drafting.py          # Proposal drafts and claim verification
│   │   ├── citations.py         # Citation formatting across 6 styles
│   │   ├── export.py            # DOCX and PDF document export
│   │   └── agent_activity.py    # Operational agent event logs
│   ├── agents/                  # LangGraph agent implementations
│   │   ├── planner.py
│   │   ├── literature_agent.py
│   │   ├── paper_analysis_agent.py
│   │   ├── retrieval_agent.py
│   │   ├── landscape_agent.py
│   │   ├── gap_detection_agent.py
│   │   ├── evidence_critic.py
│   │   ├── gap_investigator.py
│   │   ├── research_development_agent.py
│   │   └── draft_agent.py
│   ├── graph/                   # LangGraph workflow definition
│   │   ├── state.py             # ResearchState schema
│   │   ├── nodes.py             # Graph node executors
│   │   ├── routers.py           # Cyclic routing conditional logic
│   │   └── workflow.py          # Compiled StateGraph
│   ├── rag/                     # RAG pipeline
│   │   ├── loaders.py           # Section-aware PDF text extraction
│   │   ├── chunker.py           # Metadata-preserving chunker
│   │   ├── embeddings.py        # Embeddings provider abstraction
│   │   ├── vector_store.py      # FAISS vector store with persistence
│   │   └── retriever.py         # Evidence retriever
│   ├── services/                # Business logic services
│   │   ├── research_service.py  # Asynchronous workflow orchestrator
│   │   ├── paper_service.py     # PDF processing and paper comparison
│   │   ├── paper_search.py      # Multi-provider academic search
│   │   ├── full_text_service.py # Open-access full-text PDF acquisition
│   │   ├── llm_service.py       # LLM provider abstraction
│   │   ├── analysis_service.py  # Structured paper extraction
│   │   ├── landscape_service.py # Landscape synthesis
│   │   ├── gap_service.py       # Gap detection and heatmap calculations
│   │   ├── citation_service.py  # Academic citation generator
│   │   ├── draft_service.py     # Proposal and section generator
│   │   └── export_service.py    # Academic DOCX and PDF generator
│   ├── models/                  # SQLAlchemy ORM and Pydantic schemas
│   │   ├── research.py
│   │   ├── paper.py
│   │   ├── gap.py
│   │   ├── draft.py
│   │   └── citation.py
│   ├── database/                # Database configuration and repositories
│   │   ├── database.py
│   │   └── repositories.py
│   ├── gradio/                  # Gradio application
│   │   └── ask_across_papers.py
│   └── utils/                   # Utilities and configuration
│       ├── config.py
│       ├── logging.py
│       └── security.py          # SSRF prevention and file validation
├── tests/                       # Comprehensive pytest suite
│   ├── conftest.py
│   ├── test_research.py
│   ├── test_pdf_processing.py
│   ├── test_rag.py
│   ├── test_paper_search.py
│   ├── test_full_text_service.py
│   ├── test_llm_service.py
│   ├── test_landscape.py
│   ├── test_gap_detection.py
│   ├── test_langgraph_cycle.py
│   ├── test_citations.py
│   ├── test_claim_verification.py
│   ├── test_export.py
│   └── test_api_endpoints.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## 5. Getting Started

### 5.1 Environment Setup

Clone the repository and enter the project directory:

```bash
git clone https://github.com/ananyamarghade/SciLens-Automated-Research-Gap-Identification.git
cd SciLens-Automated-Research-Gap-Identification
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment:
- **Windows**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Linux / macOS**:
  ```bash
  source venv/bin/activate
  ```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 5.2 Configuration (.env)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your preferred LLM and search credentials:

```env
APP_NAME=SciLens
APP_ENV=development
API_V1_PREFIX=/api
DATABASE_URL=sqlite:///./scilens.db

# LLM Configuration (supports openai, anthropic, groq)
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=your_openai_api_key_here

# Embedding Configuration
EMBEDDING_PROVIDER=sentence-transformers
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Storage Configuration
VECTOR_DB_DIR=./data/vector_stores
UPLOAD_DIR=./data/uploads
MAX_UPLOAD_SIZE_BYTES=26214400

# Academic Search API Keys (Optional)
OPENALEX_API_KEY=
SEMANTIC_SCHOLAR_API_KEY=

# LangGraph Cyclic Limit
MAX_INVESTIGATION_ITERATIONS=3
```

---

## 6. Running the Application

### 6.1 Start FastAPI Server

Run Uvicorn from the project root:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **OpenAPI Interactive Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Gradio "Ask Across Papers" Interface**: `http://localhost:8000/gradio`

---

## 7. REST API Reference

### Research Projects
- `POST /api/research`: Create a research project.
- `GET /api/research`: List existing research projects.
- `GET /api/research/{id}`: Retrieve project details.
- `POST /api/research/{id}/start`: Start asynchronous research analysis workflow.
- `GET /api/research/{id}/status`: Check status and progress (`planning`, `discovering`, `analyzing`, `landscape`, `gap_detection`, `validation`, `development`, `drafting`, `completed`).

### Papers & Documents
- `POST /api/research/{id}/documents`: Upload research papers (PDFs). Preserves page numbers and sections.
- `GET /api/research/{id}/documents`: List uploaded documents.
- `GET /api/research/{id}/papers`: List all papers associated with the research project.
- `GET /api/research/{id}/papers/{paper_id}`: Retrieve structured analysis of a specific paper.
- `POST /api/research/{id}/papers/search`: Search academic literature.
- `POST /api/research/{id}/papers/{paper_id}/analyze`: Run structured analysis on a specific paper.
- `POST /api/research/{id}/papers/compare`: Generate comparison across multiple papers.

### Research Landscape
- `GET /api/research/{id}/landscape`: Get complete landscape (themes, trends, distributions, network).
- `GET /api/research/{id}/themes`: Retrieve thematic clusters.
- `GET /api/research/{id}/trends`: Retrieve chronological trend lines.
- `GET /api/research/{id}/methodologies`: Retrieve methodology distributions.
- `GET /api/research/{id}/network`: Retrieve paper relationship network graph (nodes and edges).

### Research Gaps
- `GET /api/research/{id}/gaps`: List identified research gaps with grounded evidence.
- `GET /api/research/{id}/gaps/{gap_id}`: Get details and traceable evidence for a gap.
- `POST /api/research/{id}/gaps/{gap_id}/investigate`: Trigger targeted investigation for an uncorroborated gap.
- `POST /api/research/{id}/gaps/{gap_id}/validate`: Trigger evidence critique.
- `GET /api/research/{id}/gaps/heatmap`: Get numerical heatmap data for frontend visualization.
- `GET /api/research/{id}/gaps/underexplored`: Retrieve identified underexplored areas.
- `GET /api/research/{id}/contradictions`: Retrieve conflicting empirical findings between studies.

### Research Development
- `POST /api/research/{id}/questions`: Formulate research questions aligned with identified gaps.
- `POST /api/research/{id}/objectives`: Formulate research objectives.
- `POST /api/research/{id}/hypotheses`: Formulate testable hypotheses with independent/dependent variables.
- `POST /api/research/{id}/methodology`: Formulate recommended methodology and validity threats.

### Proposals & Drafting
- `GET /api/research/{id}/draft`: Retrieve proposal draft.
- `POST /api/research/{id}/draft`: Generate complete research draft.
- `POST /api/research/{id}/draft/section`: Generate or regenerate a specific section.
- `PUT /api/research/{id}/draft/section/{section_id}`: Edit section content.
- `POST /api/research/{id}/draft/verify-claim`: Verify claim against indexed literature with confidence score.

### Citations & References
- `POST /api/citations/format`: Format a citation into APA 7, IEEE, MLA 9, Harvard, Chicago, or Vancouver.
- `GET /api/research/{id}/references`: Retrieve formatted bibliography for the project.

### Export
- `POST /api/research/{id}/export/docx`: Export formatted research proposal as `.docx`.
- `POST /api/research/{id}/export/pdf`: Export formatted research proposal as `.pdf`.

### Agent Activity
- `GET /api/research/{id}/agent-activity`: Retrieve chronological operational event log.

---

## 8. Running Automated Tests

Run the full test suite without external dependencies:

```bash
python -m pytest backend/tests -v
```

All 21 test suites execute offline, validating:
- Research project lifecycle & job tracking
- Multi-PDF upload, sanitization, and section detection
- FAISS vector store indexing and semantic retrieval
- Paper deduplication across multiple search providers
- SSRF security validation on external full-text downloads
- Deterministic MockLLM behavior and production missing-key protection
- Thematic landscape clustering and paper network synthesis
- Multi-type gap detection, contradiction detection, and heatmap generation
- Real LangGraph cyclic feedback loop execution and max-iteration termination
- Citation formatting in APA 7, IEEE, MLA 9, Harvard, Chicago, Vancouver
- Literature-grounded claim verification
- DOCX and PDF document export
- Full FastAPI endpoint coverage via TestClient

---

## 9. Links & Deployment

- **Live Web Application (Vercel)**: [https://scilens-automated-research-gap-identification.vercel.app](https://scilens-automated-research-gap-identification.vercel.app)
- **GitHub Repository**: [https://github.com/ananyamarghade/SciLens-Automated-Research-Gap-Identification](https://github.com/ananyamarghade/SciLens-Automated-Research-Gap-Identification)

