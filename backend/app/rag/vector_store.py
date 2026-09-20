from abc import ABC, abstractmethod
import os
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import faiss

from backend.app.rag.chunker import TextChunk


class VectorStoreBase(ABC):
    @abstractmethod
    def add_chunks(self, chunks: List[TextChunk], embeddings: List[List[float]]) -> None:
        pass

    @abstractmethod
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Tuple[Dict[str, Any], float]]:
        pass

    @abstractmethod
    def save(self, directory_path: str) -> None:
        pass

    @abstractmethod
    def load(self, directory_path: str) -> None:
        pass


class FAISSVectorStore(VectorStoreBase):
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)
        self.metadata_store: List[Dict[str, Any]] = []

    def add_chunks(self, chunks: List[TextChunk], embeddings: List[List[float]]) -> None:
        if not chunks or not embeddings:
            return

        vectors = np.array(embeddings, dtype=np.float32)
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        vectors = vectors / norms

        start_idx = len(self.metadata_store)
        self.index.add(vectors)

        for i, chunk in enumerate(chunks):
            chunk_dict = chunk.to_dict()
            chunk_dict["embedding_index"] = start_idx + i
            self.metadata_store.append(chunk_dict)

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Tuple[Dict[str, Any], float]]:
        if self.index.ntotal == 0:
            return []

        q_vec = np.array([query_embedding], dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        fetch_k = min(top_k * 5, self.index.ntotal)
        scores, indices = self.index.search(q_vec, fetch_k)

        results: List[Tuple[Dict[str, Any], float]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.metadata_store):
                continue
            meta = self.metadata_store[idx]

            if filters:
                match = True
                for k, v in filters.items():
                    if meta.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            results.append((meta, float(score)))
            if len(results) >= top_k:
                break

        return results

    def save(self, directory_path: str) -> None:
        os.makedirs(directory_path, exist_ok=True)
        index_file = os.path.join(directory_path, "index.faiss")
        meta_file = os.path.join(directory_path, "meta.npy")

        faiss.write_index(self.index, index_file)
        np.save(meta_file, np.array(self.metadata_store, dtype=object), allow_pickle=True)

    def load(self, directory_path: str) -> None:
        index_file = os.path.join(directory_path, "index.faiss")
        meta_file = os.path.join(directory_path, "meta.npy")

        if os.path.exists(index_file) and os.path.exists(meta_file):
            self.index = faiss.read_index(index_file)
            self.metadata_store = np.load(meta_file, allow_pickle=True).tolist()
