from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.utils.config import get_settings

settings = get_settings()

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        for stmt in [
            "ALTER TABLE research_projects ADD COLUMN user_id VARCHAR(36) REFERENCES users(id)",
            "ALTER TABLE papers ADD COLUMN relevance_tier VARCHAR(50) DEFAULT 'RELATED'",
            "ALTER TABLE papers ADD COLUMN analysis_status VARCHAR(20) DEFAULT 'PENDING'",
            "ALTER TABLE papers ADD COLUMN unavailable_reason VARCHAR(50)",
            "ALTER TABLE papers ADD COLUMN metadata_source VARCHAR(50)",
            "ALTER TABLE papers ADD COLUMN full_text_source VARCHAR(50)",
            "ALTER TABLE gap_evidences ADD COLUMN doi VARCHAR(255)",
            "ALTER TABLE gap_evidences ADD COLUMN exact_source_text TEXT",
            "ALTER TABLE gap_evidences ADD COLUMN evidence_type VARCHAR(50) DEFAULT 'PARAPHRASE'",
            "ALTER TABLE gap_evidences ADD COLUMN extraction_method VARCHAR(100) DEFAULT 'automated_analysis'",
            "ALTER TABLE gap_evidences ADD COLUMN relevance_tier VARCHAR(50) DEFAULT 'RELATED'",
            "ALTER TABLE research_gaps ADD COLUMN derived_from JSON",
            "ALTER TABLE research_gaps ADD COLUMN cross_paper_pattern TEXT",
            "ALTER TABLE research_gaps ADD COLUMN missing_evidence TEXT",
            "ALTER TABLE research_gaps ADD COLUMN confidence_rationale TEXT",
        ]:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass
    # NOTE: canonical seed removed – live research must use real retrieval only.
    # To load demo data explicitly call seed_canonical_education_project() from a
    # management script or test fixture; never from the production init path.
