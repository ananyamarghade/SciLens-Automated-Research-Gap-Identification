import io
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["EMBEDDING_PROVIDER"] = "mock"
os.environ["LLM_PROVIDER"] = "mock"

from backend.app.database.database import Base, get_db
from backend.app.main import app
from backend.app.rag.embeddings import DeterministicMockEmbeddings
from backend.app.services.llm_service import MockLLMProvider

TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=TEST_ENGINE)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_llm():
    return MockLLMProvider()


@pytest.fixture
def mock_embeddings():
    return DeterministicMockEmbeddings(dimension=128)


@pytest.fixture
def sample_pdf_bytes():
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    story = [
        Paragraph("Empirical Analysis of Distributed Consensus in AI Systems", styles["Title"]),
        Spacer(1, 10),
        Paragraph("Abstract", styles["Heading1"]),
        Paragraph("This study investigates distributed consensus algorithms under high latency and network partitions.", styles["Normal"]),
        Spacer(1, 10),
        Paragraph("1. Introduction", styles["Heading1"]),
        Paragraph("Modern AI systems require resilient distributed coordination across multi-region data centers.", styles["Normal"]),
        Spacer(1, 10),
        Paragraph("3. Methodology", styles["Heading1"]),
        Paragraph("We conducted quantitative benchmarks measuring throughput and synchronization delay under variable packet drop rates.", styles["Normal"]),
        Spacer(1, 10),
        Paragraph("4. Results", styles["Heading1"]),
        Paragraph("Throughput degraded significantly when partition duration exceeded 500 milliseconds.", styles["Normal"]),
        Spacer(1, 10),
        Paragraph("5. Discussion", styles["Heading1"]),
        Paragraph("The findings highlight systemic bottlenecks in conventional leader-based election paradigms.", styles["Normal"]),
        Spacer(1, 10),
        Paragraph("6. Limitations", styles["Heading1"]),
        Paragraph("Evaluations were conducted on simulated network topologies and lacked field validation in cross-continental settings.", styles["Normal"]),
        Spacer(1, 10),
        Paragraph("7. Conclusion", styles["Heading1"]),
        Paragraph("Adaptive heartbeat frequencies mitigate synchronization lag and form a promising direction for future research.", styles["Normal"]),
    ]

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
