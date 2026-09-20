from typing import List, Dict, Any
from backend.app.models.paper import PaperSearchResultItem
from backend.app.services.paper_search import PaperSearchService
from backend.app.services.llm_service import LLMProviderBase


class LiteratureAgent:
    def __init__(self, search_service: PaperSearchService, llm: LLMProviderBase):
        self.search_service = search_service
        self.llm = llm

    async def discover_literature(
        self,
        topic: str,
        initial_queries: List[str],
        limit: int = 15,
    ) -> List[PaperSearchResultItem]:
        queries = initial_queries or [
            f"{topic} empirical evaluation",
            f"{topic} limitations survey",
            f"{topic} novel methods",
        ]
        results = await self.search_service.search(queries=queries, limit=limit)
        return results

    def refine_queries(self, topic: str, previous_results_count: int) -> List[str]:
        if previous_results_count < 3:
            keywords = topic.split()[:3]
            broad_query = " ".join(keywords)
            return [broad_query, f"{broad_query} review", f"{broad_query} analysis"]
        return [
            f"{topic} comparative experimental analysis",
            f"{topic} open problems research directions",
        ]
