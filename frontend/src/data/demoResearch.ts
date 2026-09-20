export interface ProjectMeta {
  id: string;
  topic: string;
  title: string;
  field: string;
  status: 'Investigating' | 'Landscape Mapped' | 'Gaps Detected' | 'Drafting' | 'Completed';
  currentAgent: string;
  papersAnalyzed: number;
  themesIdentified: number;
  candidateGaps: number;
  validatedGaps: number;
  contradictionsFound: number;
  dateRange: string;
  researchDepth: 'Standard (Top 50)' | 'Comprehensive (150+)' | 'Exhaustive Systematic';
  lastUpdated: string;
}

export const activeProject: ProjectMeta = {
  id: 'canonical_ai_education_writing',
  topic: 'How artificial intelligence changes modern education and writing',
  title: 'Agentic Research Intelligence: Artificial Intelligence in Modern Education and Writing',
  field: 'Artificial Intelligence in Education & Applied Linguistics',
  status: 'Completed',
  currentAgent: 'Evidence Scoring Agent',
  papersAnalyzed: 10,
  themesIdentified: 4,
  candidateGaps: 3,
  validatedGaps: 1,
  contradictionsFound: 1,
  dateRange: '2007 — 2024',
  researchDepth: 'Comprehensive (150+)',
  lastUpdated: 'Just now',
};

export const sampleTopics = [
  'How artificial intelligence changes modern education and writing',
  'Quantum error mitigation in near-term intermediate-scale quantum computing',
  'Autonomous multi-agent consensus in decentralized scientific discovery',
  'Automated feedback and metacognitive monitoring in writing instruction',
  'Ethical governance and provenance verification in generative AI systems',
];
