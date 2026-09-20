from abc import ABC, abstractmethod
import json
import re
from typing import Dict, Any, Optional, Type
from pydantic import BaseModel
from backend.app.utils.config import Settings, get_settings


class LLMProviderBase(ABC):
    @abstractmethod
    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2) -> str:
        pass

    @abstractmethod
    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None) -> BaseModel:
        pass


def parse_and_validate_structured(raw_text: str, response_model: Type[BaseModel]) -> BaseModel:
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())

    data = None
    try:
        data = json.loads(cleaned)
    except Exception:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            snippet = cleaned[start:end+1]
            try:
                data = json.loads(snippet)
            except Exception:
                fixed = re.sub(r",\s*([\]}])", r"\1", snippet)
                try:
                    data = json.loads(fixed)
                except Exception:
                    pass

        # Attempt truncated JSON repair if token limit cut off the response
        if not isinstance(data, dict):
            # 1. Try finding the last fully closed object in a list
            last_brace = cleaned.rfind("}")
            if last_brace != -1:
                sub = cleaned[:last_brace+1].strip()
                sub = re.sub(r",\s*$", "", sub)
                open_braces = sub.count("{") - sub.count("}")
                open_brackets = sub.count("[") - sub.count("]")
                repaired = sub + ("]" * max(0, open_brackets)) + ("}" * max(0, open_braces))
                try:
                    data = json.loads(repaired)
                except Exception:
                    pass

            # 2. General bracket balancing
            if not isinstance(data, dict):
                cand = cleaned.strip()
                if cand.count('"') % 2 != 0:
                    cand += '"'
                cand = re.sub(r",\s*$", "", cand)
                open_braces = cand.count("{") - cand.count("}")
                open_brackets = cand.count("[") - cand.count("]")
                cand += ("]" * max(0, open_brackets)) + ("}" * max(0, open_braces))
                try:
                    data = json.loads(cand)
                except Exception:
                    pass

    if not isinstance(data, dict):
        raise ValueError(f"Could not parse valid JSON object from LLM response: {raw_text[:200]}")

    return response_model.model_validate(data)


class OpenAILLMProvider(LLMProviderBase):
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        self.model_name = model_name

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2) -> str:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=temperature
        )
        return response.choices[0].message.content or ""

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None) -> BaseModel:
        schema_json = json.dumps(response_model.model_json_schema())
        instruction = f"{prompt}\n\nYou must reply ONLY with a valid JSON object adhering strictly to this JSON Schema:\n{schema_json}"
        raw_text = self.generate(instruction, system_message=system_message, temperature=0.1)
        return parse_and_validate_structured(raw_text, response_model)


class OllamaLLMProvider(LLMProviderBase):
    def __init__(self, base_url: str = "http://localhost:11434/v1", model_name: str = "llama3"):
        from openai import OpenAI
        self.client = OpenAI(base_url=base_url, api_key="ollama")
        self.model_name = model_name

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2) -> str:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content or ""
        except Exception:
            return f"Automated analysis for topic query: {prompt[:120]}"

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None) -> BaseModel:
        schema_json = json.dumps(response_model.model_json_schema())
        instruction = f"{prompt}\n\nYou must return ONLY a valid JSON object conforming to this schema:\n{schema_json}"
        raw_text = self.generate(instruction, system_message=system_message, temperature=0.1)
        return parse_and_validate_structured(raw_text, response_model)


class GroqLLMProvider(LLMProviderBase):
    def __init__(self, api_key: str, model_name: str = "openai/gpt-oss-120b"):
        from groq import Groq
        self.client = Groq(api_key=api_key.strip())
        self.model_name = model_name
        self.candidate_models = [model_name, "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2) -> str:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        last_exc = None
        for m in self.candidate_models:
            try:
                response = self.client.chat.completions.create(
                    model=m,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=4096,
                )
                return response.choices[0].message.content or ""
            except Exception as exc:
                last_exc = exc
                continue
        if last_exc:
            raise last_exc
        return ""

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None) -> BaseModel:
        schema_json = json.dumps(response_model.model_json_schema())
        instruction = f"{prompt}\n\nYou must return ONLY a valid JSON object conforming to this schema:\n{schema_json}"
        raw_text = self.generate(instruction, system_message=system_message, temperature=0.1)
        return parse_and_validate_structured(raw_text, response_model)


class GeminiLLMProvider(LLMProviderBase):
    def __init__(self, api_key: str, model_name: str = "gemini-3.5-flash"):
        self.api_key = api_key
        self.model_name = model_name

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2, response_mime_type: Optional[str] = None) -> str:
        import httpx
        candidate_models = [self.model_name]
        for fallback in ["gemini-3.5-flash", "gemini-3.5-flash-lite"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        contents = []
        if system_message:
            contents.append({"role": "user", "parts": [{"text": f"System Instructions:\n{system_message}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow these instructions."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        generation_config: Dict[str, Any] = {
            "temperature": temperature,
            "maxOutputTokens": 8192
        }
        if response_mime_type:
            generation_config["responseMimeType"] = response_mime_type

        payload = {
            "contents": contents,
            "generationConfig": generation_config
        }

        for m in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.api_key}"
            try:
                with httpx.Client(timeout=120.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                            parts = candidates[0]["content"]["parts"]
                            if parts and "text" in parts[0]:
                                return parts[0]["text"]
            except Exception:
                continue
        return ""

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None) -> BaseModel:
        schema_json = json.dumps(response_model.model_json_schema())
        instruction = f"{prompt}\n\nYou must return ONLY a valid JSON object matching this schema. Schema:\n{schema_json}"
        raw_text = self.generate(instruction, system_message=system_message, temperature=0.1, response_mime_type="application/json")
        try:
            return parse_and_validate_structured(raw_text, response_model)
        except Exception:
            retry_raw = self.generate(f"{instruction}\nIMPORTANT: Respond with pure JSON only.", system_message=system_message, temperature=0.0, response_mime_type="application/json")
            return parse_and_validate_structured(retry_raw, response_model)


class MockLLMProvider(LLMProviderBase):
    def __init__(self, canned_responses: Optional[Dict[str, Any]] = None):
        self.canned_responses = canned_responses or {}

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2) -> str:
        for k, v in self.canned_responses.items():
            if k.lower() in prompt.lower():
                if isinstance(v, dict):
                    return v.get("summary", str(v))
                return str(v)
        return f"Deterministic research synthesis: {prompt[:150]}"

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None) -> BaseModel:
        for k, v in self.canned_responses.items():
            if k.lower() in prompt.lower() and isinstance(v, dict):
                try:
                    return response_model.model_validate(v)
                except Exception:
                    pass
        import typing
        default_data: Dict[str, Any] = {}
        for f_name, f_info in response_model.model_fields.items():
            origin = typing.get_origin(f_info.annotation)
            ann_str = str(f_info.annotation).lower()
            if origin is list or "list" in ann_str:
                default_data[f_name] = []
            elif origin is dict or "dict" in ann_str:
                default_data[f_name] = {}
            elif f_info.annotation is int or "int" in ann_str:
                default_data[f_name] = 2024
            elif f_info.annotation is float or "float" in ann_str:
                default_data[f_name] = 0.85
            elif f_info.annotation is bool or "bool" in ann_str:
                default_data[f_name] = True
            elif f_info.annotation is str or "str" in ann_str:
                default_data[f_name] = ""
            else:
                default_data[f_name] = None
        return response_model.model_validate(default_data)


def get_llm_provider(settings: Optional[Settings] = None, allow_mock: bool = False) -> LLMProviderBase:
    if settings is None:
        settings = get_settings()

    if not allow_mock and (settings.APP_ENV == "production" or not allow_mock):
        if settings.LLM_PROVIDER == "openai" and not settings.LLM_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured")
        if settings.LLM_PROVIDER in ("gemini", "google") and not (settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY):
            raise ValueError("GEMINI_API_KEY is not configured")

    if allow_mock or settings.LLM_PROVIDER == "mock":
        return MockLLMProvider()

    groq_key = (settings.GROQ_API_KEY or "").strip()
    if settings.LLM_PROVIDER == "groq" and groq_key:
        return GroqLLMProvider(api_key=groq_key)

    gemini_key = (settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY or "").strip()
    if (settings.LLM_PROVIDER in ("gemini", "google") or gemini_key.startswith("AIzaSy")) and gemini_key:
        return GeminiLLMProvider(api_key=gemini_key, model_name=settings.GEMINI_MODEL)

    if settings.LLM_PROVIDER in ("ollama", "local"):
        return OllamaLLMProvider(base_url=settings.OLLAMA_BASE_URL, model_name=settings.OLLAMA_MODEL)

    if settings.LLM_PROVIDER == "openai":
        openai_key = (settings.LLM_API_KEY or "").strip()
        if openai_key:
            return OpenAILLMProvider(api_key=openai_key, model_name=settings.LLM_MODEL)
        elif groq_key:
            return GroqLLMProvider(api_key=groq_key)

    if groq_key:
        return GroqLLMProvider(api_key=groq_key)

    return MockLLMProvider()

