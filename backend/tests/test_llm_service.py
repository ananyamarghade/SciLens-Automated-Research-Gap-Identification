import pytest
from pydantic import BaseModel
from backend.app.services.llm_service import MockLLMProvider, get_llm_provider
from backend.app.utils.config import Settings


class SampleSchema(BaseModel):
    summary: str
    confidence: float
    items: list[str]


def test_mock_llm_deterministic_generation():
    llm = MockLLMProvider(canned_responses={"summary": {"summary": "Deterministic result", "confidence": 0.95, "items": ["A", "B"]}})
    result = llm.generate("Please generate a summary")
    assert "Deterministic" in result

    structured = llm.generate_structured("Please generate a summary", response_model=SampleSchema)
    assert structured.summary == "Deterministic result"
    assert structured.confidence == 0.95
    assert len(structured.items) == 2


def test_production_missing_api_key_raises_error():
    prod_settings = Settings(
        APP_ENV="production",
        LLM_PROVIDER="openai",
        LLM_API_KEY=None,
    )
    with pytest.raises(ValueError) as exc:
        get_llm_provider(settings=prod_settings, allow_mock=False)
    assert "OPENAI_API_KEY is not configured" in str(exc.value)
