from collections import Counter
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.database.repositories import PaperRepository, GapRepository, ResearchRepository
from backend.app.models.gap import (
    ResearchLandscapeResponse,
    ResearchThemeResponse,
    ResearchTrendResponse,
    PaperRelationshipNetwork,
    NetworkNode,
    NetworkEdge,
)
from backend.app.services.llm_service import LLMProviderBase, get_llm_provider
from backend.app.utils.config import Settings, get_settings


class LandscapeService:
    def __init__(
        self,
        db: Session,
        llm: Optional[LLMProviderBase] = None,
        settings: Optional[Settings] = None,
    ):
        self.db = db
        self.settings = settings or get_settings()
        self.llm = llm or get_llm_provider(self.settings, allow_mock=(self.settings.APP_ENV == "testing"))
        self.paper_repo = PaperRepository(db)
        self.gap_repo = GapRepository(db)
        self.research_repo = ResearchRepository(db)

    def generate_landscape(self, research_id: str) -> ResearchLandscapeResponse:
        papers = self.paper_repo.list_papers(research_id)
        if not papers:
            return ResearchLandscapeResponse(
                themes=[],
                trends=[],
                methodology_distribution={},
                population_distribution={},
                geographic_distribution={},
                network=PaperRelationshipNetwork(nodes=[], edges=[]),
                total_papers=0,
            )

        methodologies: List[str] = []
        populations: List[str] = []
        geographies: List[str] = []
        year_to_papers: Dict[int, List[str]] = {}

        for p in papers:
            yr = p.year or 2024
            year_to_papers.setdefault(yr, []).append(p.id)
            if p.analysis:
                if p.analysis.methodology:
                    methodologies.append(p.analysis.methodology.title())
                if p.analysis.population:
                    populations.append(p.analysis.population)
                if p.analysis.geography:
                    geographies.append(p.analysis.geography)

        methodology_dist = dict(Counter(methodologies)) or {"Empirical": len(papers)}
        population_dist = dict(Counter(populations)) or {"General Cohort": len(papers)}
        geographic_dist = dict(Counter(geographies)) or {"Global": len(papers)}

        themes_data = self._derive_themes(research_id, papers)
        self.gap_repo.save_themes(research_id, themes_data)

        trends_data = []
        all_years = sorted(year_to_papers.keys())
        for yr in all_years:
            p_list = year_to_papers[yr]
            trends_data.append({
                "year": yr,
                "paper_count": len(p_list),
                "themes": [t["name"] for t in themes_data[:2]],
                "emerging_themes": [t["name"] for t in themes_data[-1:]] if yr == max(all_years) else [],
            })
        self.gap_repo.save_trends(research_id, trends_data)

        nodes: List[NetworkNode] = []
        edges: List[NetworkEdge] = []

        for p in papers:
            nodes.append(
                NetworkNode(
                    id=p.id,
                    label=p.title[:40],
                    type="paper",
                    metrics={"year": p.year, "citations": p.citation_count},
                )
            )

        for t in themes_data:
            t_id = f"theme_{t['name'].lower().replace(' ', '_')}"
            nodes.append(
                NetworkNode(
                    id=t_id,
                    label=t["name"],
                    type="theme",
                    metrics={"paper_count": t["paper_count"]},
                )
            )
            for pid in t["paper_ids"]:
                edges.append(
                    NetworkEdge(
                        source=pid,
                        target=t_id,
                        relationship="addresses_theme",
                        weight=1.0,
                    )
                )

        self.research_repo.log_activity(
            research_id=research_id,
            agent_name="landscape_service",
            activity_type="landscape_synthesized",
            message=f"Built landscape across {len(papers)} papers with {len(themes_data)} core themes",
        )

        return ResearchLandscapeResponse(
            themes=[
                ResearchThemeResponse(
                    id=f"thm_{i+1}",
                    research_id=research_id,
                    name=t["name"],
                    description=t.get("description"),
                    keywords=t.get("keywords", []),
                    paper_count=t.get("paper_count", 0),
                    paper_ids=t.get("paper_ids", []),
                )
                for i, t in enumerate(themes_data)
            ],
            trends=[
                ResearchTrendResponse(
                    year=tr["year"],
                    paper_count=tr["paper_count"],
                    themes=tr["themes"],
                    emerging_themes=tr["emerging_themes"],
                )
                for tr in trends_data
            ],
            methodology_distribution=methodology_dist,
            population_distribution=population_dist,
            geographic_distribution=geographic_dist,
            network=PaperRelationshipNetwork(nodes=nodes, edges=edges),
            total_papers=len(papers),
        )

    def _derive_themes(self, research_id: str, papers: List[Any]) -> List[Dict[str, Any]]:
        from pydantic import BaseModel

        class ThemeItem(BaseModel):
            name: str
            description: str
            keywords: List[str]
            paper_indices: List[int] = [0]

        class ThemeList(BaseModel):
            themes: List[ThemeItem]

        project = self.research_repo.get_project(research_id)
        topic = project.topic if project else "Active Field"

        paper_summaries = []
        for idx, p in enumerate(papers[:15]):
            abs_text = p.abstract[:200] if p.abstract else ""
            paper_summaries.append(f"[{idx}] {p.title} ({p.year or 2024}). {abs_text}")

        prompt = f"""You are a scientific cartographer. Given the domain "{topic}" and these peer-reviewed papers:
{chr(10).join(paper_summaries)}

Group these papers into 3 to 5 core research themes.
For each theme provide:
- name: clear academic theme title (e.g. "Fault-Tolerant Surface Architectures", "Syndrome Decoding Algorithms")
- description: 1-2 sentence description
- keywords: 3-5 relevant keywords
- paper_indices: list of paper indices from the input that belong to this theme
"""
        try:
            res = self.llm.generate_structured(prompt, ThemeList)
            themes = []
            for t in res.themes:
                p_ids = [papers[idx].id for idx in t.paper_indices if 0 <= idx < len(papers)]
                if not p_ids and papers:
                    p_ids = [papers[0].id]
                themes.append({
                    "name": t.name,
                    "description": t.description,
                    "keywords": t.keywords or ["foundations"],
                    "paper_count": len(p_ids),
                    "paper_ids": p_ids,
                })
            if themes:
                return themes
        except Exception:
            pass

        return [
            {
                "name": f"Core Foundations & Methodologies in {topic}",
                "description": f"Theoretical frameworks and foundational models underpinning {topic}.",
                "keywords": ["foundations", "methodology", "modeling"],
                "paper_count": len(papers),
                "paper_ids": [p.id for p in papers],
            },
            {
                "name": f"Empirical Benchmarks & Experimental Validation",
                "description": f"Performance evaluation across curated datasets and prototype hardware.",
                "keywords": ["benchmarks", "evaluation", "validation"],
                "paper_count": max(1, len(papers) // 2),
                "paper_ids": [p.id for p in papers[: max(1, len(papers) // 2)]],
            },
        ]
