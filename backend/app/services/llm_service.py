from abc import ABC, abstractmethod
import json
import logging
import re
from typing import Dict, Any, Optional, Type
from pydantic import BaseModel
from backend.app.utils.config import Settings, get_settings

logger = logging.getLogger(__name__)


class LLMProviderBase(ABC):
    @abstractmethod
    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2, max_tokens: Optional[int] = None) -> str:
        pass

    @abstractmethod
    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None, max_tokens: Optional[int] = None) -> BaseModel:
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

    # Fallback if model accidentally echoed schema properties instead of instance data
    if "properties" in data and not any(k in data for k in response_model.model_fields):
        props = data["properties"]
        if isinstance(props, dict):
            unwrapped = {}
            for field in response_model.model_fields:
                if field in props:
                    val = props[field]
                    if isinstance(val, dict):
                        unwrapped[field] = val.get("default") or val.get("description") or val.get("example")
                    else:
                        unwrapped[field] = val
            if unwrapped:
                data = unwrapped

    return response_model.model_validate(data)


class OpenAILLMProvider(LLMProviderBase):
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        self.model_name = model_name

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2, max_tokens: Optional[int] = None) -> str:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        kwargs: Dict[str, Any] = {}
        if max_tokens:
            kwargs["max_tokens"] = max_tokens

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=temperature,
            **kwargs,
        )
        return response.choices[0].message.content or ""

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None, max_tokens: Optional[int] = None) -> BaseModel:
        schema_json = json.dumps(response_model.model_json_schema())
        instruction = f"{prompt}\n\nYou must reply ONLY with a valid JSON object adhering strictly to this JSON Schema:\n{schema_json}"
        raw_text = self.generate(instruction, system_message=system_message, temperature=0.1, max_tokens=max_tokens)
        return parse_and_validate_structured(raw_text, response_model)


class OllamaLLMProvider(LLMProviderBase):
    def __init__(self, base_url: str = "http://localhost:11434/v1", model_name: str = "llama3"):
        from openai import OpenAI
        self.client = OpenAI(base_url=base_url, api_key="ollama")
        self.model_name = model_name

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2, max_tokens: Optional[int] = None) -> str:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        kwargs: Dict[str, Any] = {}
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                **kwargs,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            logger.error("Ollama generate() failed: %s", exc, exc_info=True)
            return f"Automated analysis for topic query: {prompt[:120]}"

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None, max_tokens: Optional[int] = None) -> BaseModel:
        schema_json = json.dumps(response_model.model_json_schema())
        instruction = f"{prompt}\n\nYou must return ONLY a valid JSON object conforming to this schema:\n{schema_json}"
        raw_text = self.generate(instruction, system_message=system_message, temperature=0.1, max_tokens=max_tokens)
        return parse_and_validate_structured(raw_text, response_model)


class GroqLLMProvider(LLMProviderBase):
    _exhausted_models: set = set()

    def __init__(self, api_key: str, model_name: str = "openai/gpt-oss-20b"):
        from groq import Groq
        self.client = Groq(api_key=api_key.strip())
        self.model_name = model_name
        # Prioritize models with high token limits and available quota on Groq
        self.candidate_models = [
            "openai/gpt-oss-20b",
            "groq/compound-mini",
            "groq/compound",
            "qwen/qwen3.8-27b",
            "openai/gpt-oss-120b",
        ]
        if model_name and model_name not in self.candidate_models:
            self.candidate_models.insert(0, model_name)

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2, max_tokens: Optional[int] = None) -> str:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        # Guard prompt length to avoid HTTP 413 / TPM 8000 on Groq
        # 1 token ~= 3.5 chars on average; trim if prompt is excessively large
        if len(prompt) > 22000:
            prompt = prompt[:22000] + "\n...[truncated for context limits]"
        messages.append({"role": "user", "content": prompt})

        last_exc = None
        for m in self.candidate_models:
            if m in GroqLLMProvider._exhausted_models:
                continue

            # qwen models have strict 1000 OTPM limits; cap requested output tokens
            if "qwen" in m:
                model_max_tokens = min(max_tokens or 900, 900)
            else:
                model_max_tokens = min(max_tokens or 2048, 2048)

            for retry in range(2):
                try:
                    response = self.client.chat.completions.create(
                        model=m,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=model_max_tokens,
                    )
                    return response.choices[0].message.content or ""
                except Exception as exc:
                    exc_str = str(exc)
                    # If daily quota (TPD) is reached, blacklist model for the session
                    if "tokens per day" in exc_str.lower() or "tpd" in exc_str.lower():
                        logger.warning("Groq model '%s' exhausted daily token quota (TPD). Skipping for session.", m)
                        GroqLLMProvider._exhausted_models.add(m)
                        break

                    if "429" in exc_str or "rate_limit" in exc_str.lower():
                        import re
                        import time
                        m_wait = re.search(r"try again in (\d+(?:\.\d+)?)s", exc_str)
                        wait_sec = float(m_wait.group(1)) if m_wait else 3.0
                        if wait_sec <= 10.0 and retry == 0:
                            logger.info("Groq model '%s' rate limited. Waiting %.1fs before retry...", m, wait_sec)
                            time.sleep(wait_sec + 0.5)
                            continue
                    logger.warning("Groq model '%s' generate() failed: %s", m, exc)
                    last_exc = exc
                    break

        if last_exc:
            logger.error("All Groq candidate models failed: %s", last_exc, exc_info=True)
            raise last_exc
        return ""

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None, max_tokens: Optional[int] = None) -> BaseModel:
        schema_json = json.dumps(response_model.model_json_schema())
        instruction = (
            f"{prompt}\n\n"
            f"IMPORTANT: Reply ONLY with a valid JSON object containing real evaluated data that matches this schema:\n"
            f"{schema_json}\n"
            f"Do NOT return the schema definitions or a dictionary of properties. Return the concrete JSON object directly."
        )
        raw_text = self.generate(instruction, system_message=system_message, temperature=0.1, max_tokens=max_tokens)
        try:
            return parse_and_validate_structured(raw_text, response_model)
        except Exception as exc:
            logger.error(
                "Groq generate_structured() failed to parse JSON (response length=%d chars): %s",
                len(raw_text), exc,
            )
            raise


class GeminiLLMProvider(LLMProviderBase):
    def __init__(self, api_key: str, model_name: str = "gemini-3.5-flash"):
        self.api_key = api_key
        self.model_name = model_name

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2, response_mime_type: Optional[str] = None, max_tokens: Optional[int] = None) -> str:
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
            "maxOutputTokens": max_tokens or 8192
        }
        if response_mime_type:
            generation_config["responseMimeType"] = response_mime_type

        payload = {
            "contents": contents,
            "generationConfig": generation_config
        }

        last_exc: Optional[Exception] = None
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
                    else:
                        logger.warning("Gemini model '%s' returned status %s: %s", m, resp.status_code, resp.text[:300])
            except Exception as exc:
                last_exc = exc
                logger.warning("Gemini model '%s' generate() failed: %s", m, exc)
                continue
        if last_exc:
            logger.error("All Gemini candidate models failed: %s", last_exc, exc_info=True)
        return ""

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None, max_tokens: Optional[int] = None) -> BaseModel:
        schema_json = json.dumps(response_model.model_json_schema())
        instruction = f"{prompt}\n\nYou must return ONLY a valid JSON object matching this schema. Schema:\n{schema_json}"
        raw_text = self.generate(instruction, system_message=system_message, temperature=0.1, response_mime_type="application/json", max_tokens=max_tokens)
        try:
            return parse_and_validate_structured(raw_text, response_model)
        except Exception as exc:
            logger.warning("Gemini generate_structured() first attempt failed to parse (length=%d): %s", len(raw_text), exc)
            retry_raw = self.generate(f"{instruction}\nIMPORTANT: Respond with pure JSON only.", system_message=system_message, temperature=0.0, response_mime_type="application/json", max_tokens=max_tokens)
            try:
                return parse_and_validate_structured(retry_raw, response_model)
            except Exception as retry_exc:
                logger.error("Gemini generate_structured() retry also failed to parse (length=%d): %s", len(retry_raw), retry_exc)
                raise


class MockLLMProvider(LLMProviderBase):
    def __init__(self, canned_responses: Optional[Dict[str, Any]] = None):
        self.canned_responses = canned_responses or {}

    def generate(self, prompt: str, system_message: Optional[str] = None, temperature: float = 0.2, max_tokens: Optional[int] = None) -> str:
        for k, v in self.canned_responses.items():
            if k.lower() in prompt.lower():
                if isinstance(v, dict):
                    return v.get("summary", str(v))
                return str(v)
        return f"Deterministic research synthesis: {prompt[:150]}"

    def generate_structured(self, prompt: str, response_model: Type[BaseModel], system_message: Optional[str] = None, max_tokens: Optional[int] = None) -> BaseModel:
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

    if not allow_mock and settings.APP_ENV == "production":
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

