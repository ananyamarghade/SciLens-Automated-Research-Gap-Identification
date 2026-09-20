from abc import ABC, abstractmethod
import hashlib
import numpy as np
from typing import List
from backend.app.utils.config import Settings, get_settings


class EmbeddingsProvider(ABC):
    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        pass

    @abstractmethod
    def embed_query(self, text: str) -> List[float]:
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        pass


class SentenceTransformerEmbeddings(EmbeddingsProvider):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(model_name)
        self._dim = self.model.get_sentence_embedding_dimension()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        embedding = self.model.encode([text], convert_to_numpy=True, normalize_embeddings=True)[0]
        return embedding.tolist()

    @property
    def dimension(self) -> int:
        return self._dim


class OpenAIEmbeddingsProvider(EmbeddingsProvider):
    def __init__(self, api_key: str, model_name: str = "text-embedding-3-small"):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        self.model_name = model_name
        self._dim = 1536

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        response = self.client.embeddings.create(input=texts, model=self.model_name)
        return [item.embedding for item in response.data]

    def embed_query(self, text: str) -> List[float]:
        response = self.client.embeddings.create(input=[text], model=self.model_name)
        return response.data[0].embedding

    @property
    def dimension(self) -> int:
        return self._dim


class DeterministicMockEmbeddings(EmbeddingsProvider):
    def __init__(self, dimension: int = 384):
        self._dimension = dimension

    def _hash_text(self, text: str) -> List[float]:
        seed = int(hashlib.md5(text.encode("utf-8")).hexdigest()[:8], 16)
        rng = np.random.default_rng(seed)
        vec = rng.standard_normal(self._dimension).astype(np.float32)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._hash_text(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._hash_text(text)

    @property
    def dimension(self) -> int:
        return self._dimension


def get_embeddings_engine(settings: Settings = None) -> EmbeddingsProvider:
    if settings is None:
        settings = get_settings()

    if settings.EMBEDDING_PROVIDER == "mock":
        return DeterministicMockEmbeddings()

    if settings.EMBEDDING_PROVIDER == "openai" and settings.LLM_API_KEY:
        try:
            return OpenAIEmbeddingsProvider(api_key=settings.LLM_API_KEY)
        except Exception:
            return DeterministicMockEmbeddings()

    try:
        return SentenceTransformerEmbeddings(model_name=settings.EMBEDDING_MODEL)
    except Exception:
        return DeterministicMockEmbeddings()
