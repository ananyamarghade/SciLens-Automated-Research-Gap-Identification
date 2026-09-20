from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "SciLens"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = "sqlite:///./scilens.db"

    LLM_PROVIDER: str = "openai"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash"
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    OLLAMA_MODEL: str = "llama3"

    EMBEDDING_PROVIDER: str = "sentence-transformers"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    VECTOR_DB_DIR: str = "./data/vector_stores"
    UPLOAD_DIR: str = "./data/uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 26214400

    OPENALEX_API_KEY: Optional[str] = None
    TAVILY_API_KEY: Optional[str] = None

    MAX_INVESTIGATION_ITERATIONS: int = 3
    CORS_ORIGINS: str = "*"

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
