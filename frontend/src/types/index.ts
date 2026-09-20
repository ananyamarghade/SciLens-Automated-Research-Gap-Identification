export type GapStatus =
  | 'Potential'
  | 'Validated'
  | 'Insufficient Evidence'
  | 'Candidate Gap'
  | 'Potential Gap'
  | 'Supported Gap'
  | 'Validated Gap'
  | 'Contested Gap';

export type GapType =
  | 'Methodological'
  | 'Population'
  | 'Geographical'
  | 'Contextual'
  | 'Temporal'
  | 'Theoretical'
  | 'Technological'
  | 'Data'
  | 'Contradictory Findings';

export type EvidenceType =
  | 'DIRECT_QUOTE'
  | 'PARAPHRASE'
  | 'AUTHOR_CLAIM'
  | 'MODEL_SYNTHESIS'
  | 'INFERENCE';

export type RelevanceTier =
  | 'DIRECT'
  | 'RELATED'
  | 'FOUNDATIONAL'
  | 'PERIPHERAL';

export interface EvidenceSnippet {
  id: string;
  paperId: string;
  paperTitle: string;
  authors: string[];
  year: number;
  pageNumber: number;
  section: string;
  snippet: string;
  confidence: number;
  isSupporting: boolean;
  doi?: string;
  evidenceType?: EvidenceType;
  exactSourceText?: string;
  extractionMethod?: string;
  relevanceTier?: RelevanceTier;
}

export interface PaperAnalysisData {
  summary: string;
  objectives: string[];
  methodology: string;
  dataset: string;
  population: string;
  geography: string;
  variables: { independent: string; dependent: string; control?: string };
  theoreticalFramework: string;
  keyFindings: string[];
  limitations: string[];
  futureWork: string[];
  conclusion: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  abstract: string;
  methodology: string;
  dataset: string;
  population: string;
  geography: string;
  relevance: number;
  citationCount: number;
  doi?: string;
  pdfUrl?: string;
  sourceUrl?: string;
  isUploaded?: boolean;
  isDuplicate?: boolean;
  status: 'Indexed' | 'Analyzing' | 'Analyzed';
  relevanceTier?: RelevanceTier;
  analysis?: PaperAnalysisData;
}

export interface ResearchTheme {
  id: string;
  name: string;
  description: string;
  paperCount: number;
  keywords: string[];
  paperIds: string[];
}

export interface ResearchTrend {
  year: number;
  paperCount: number;
  themes: string[];
  emergingThemes: string[];
}

export interface LandscapeNode {
  id: string;
  label: string;
  type: 'paper' | 'theme' | 'cluster';
  x: number;
  y: number;
  size: number;
  category: string;
  cluster: string;
  paperCount?: number;
}

export interface LandscapeEdge {
  source: string;
  target: string;
  weight: number;
  relationship: string;
}

export interface ResearchLandscape {
  themes: ResearchTheme[];
  trends: ResearchTrend[];
  methodologyDistribution: Record<string, number>;
  populationDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  nodes: LandscapeNode[];
  edges: LandscapeEdge[];
}

export interface DerivedObservation {
  paper_id: string;
  paper_title: string;
  year: number;
  source_section: string;
  observation: string;
  exact_excerpt: string;
  extraction_type: string;
  verification_status: string;
}

export interface ResearchGap {
  id: string;
  gapType: GapType;
  title: string;
  description: string;
  supportingPaperIds: string[];
  supportingPapers: string[];
  evidenceSnippets: EvidenceSnippet[];
  evidenceStrength: 'Preliminary' | 'Moderate' | 'High' | 'Robust';
  confidence: number;
  status: GapStatus;
  affectedThemes: string[];
  noveltyAssessment: 'well_supported' | 'potential_gap' | 'insufficient_evidence';
  criticNotes?: string;
  iterationCount: number;
  derivedFrom?: DerivedObservation[];
  crossPaperPattern?: string;
  missingEvidence?: string;
  confidenceRationale?: string;
}

export interface GapInvestigationStep {
  id: string;
  title: string;
  agent: string;
  status: 'completed' | 'active' | 'pending';
  timestamp: string;
  action: string;
  result: string;
  evidenceFoundCount: number;
}

export interface GapInvestigation {
  gapId: string;
  candidateGap: ResearchGap;
  steps: GapInvestigationStep[];
  supportingPapers: Paper[];
  contradictingPapers: Paper[];
  iterationsCount: number;
  aiReasoning: {
    challengedBy: string[];
    whySurvived: string;
    whatRemainsUncertain: string;
  };
  finalVerdict: {
    status: GapStatus;
    strength: string;
    noveltyScore: number;
    recommendedAction: string;
  };
}

export interface ContradictionItem {
  id: string;
  topic: string;
  paperA: {
    id: string;
    title: string;
    year: number;
    finding: string;
    methodology: string;
  };
  paperB: {
    id: string;
    title: string;
    year: number;
    finding: string;
    methodology: string;
  };
  context: string;
  methodologyDifferences: string;
  populationDifferences: string;
  possibleExplanation: string;
  divergenceLevel: 'Context-Dependent' | 'Direct Disagreement' | 'Sample Bias';
}

export interface AgentActivityItem {
  id: string;
  agentName: 'Planner' | 'Literature Discovery' | 'Retrieval' | 'Paper Analysis' | 'Gap Detection' | 'Evidence Critic' | 'Gap Investigator' | 'Validation';
  currentTask: string;
  timestamp: string;
  progress: number;
  papersRetrieved?: number;
  iterations?: number;
  status: 'active' | 'completed' | 'queued';
  phase: 'Discover' | 'Map' | 'Detect' | 'Challenge' | 'Validate';
  details: string;
  action?: string;
  agentId?: string;
  agentRole?: string;
}

export interface ResearchObjective {
  id: string;
  objective: string;
  targetOutcome: string;
}

export interface ResearchHypothesis {
  id: string;
  statement: string;
  rationale: string;
  variables: { independent: string; dependent: string; mediators?: string };
  testability: 'High' | 'Moderate';
}

export interface ResearchDevelopment {
  researchQuestions: { id: string; question: string; rationale: string; isPrimary: boolean }[];
  objectives: ResearchObjective[];
  hypotheses: ResearchHypothesis[];
  variables: { independent: string[]; dependent: string[]; control: string[]; moderating: string[] };
  suggestedMethodology: {
    approach: string;
    design: string;
    rationale: string;
    dataCollection: string;
    analysisPlan: string;
    threatsToValidity: string[];
  };
  expectedOutcomes: string[];
  potentialContribution: string;
}

export interface DraftSection {
  id: string;
  sectionName: string;
  content: string;
  citations: string[];
  wordCount: number;
  isCustomized?: boolean;
}

export interface Draft {
  id: string;
  title: string;
  lastEdited: string;
  reviewMode: 'Chronological' | 'Thematic' | 'Methodological';
  sections: DraftSection[];
}

export type ReviewDepth = 'Concise' | 'Standard' | 'Detailed' | 'Comprehensive';
export type ReviewOrganization = 'Thematic' | 'Chronological' | 'Methodological' | 'Gap-oriented';

export interface LiteratureReviewSectionItem {
  title: string;
  content: string;
  supporting_paper_ids: string[];
  citations: string[];
}

export interface LiteratureReviewTable {
  table_id: string;
  title: string;
  headers: string[];
  rows: string[][];
  description?: string;
}

export interface LiteratureReviewData {
  research_id: string;
  topic: string;
  review_depth: ReviewDepth;
  organization: ReviewOrganization;
  citation_style: CitationStyle;
  selected_gaps: string[];
  sections: LiteratureReviewSectionItem[];
  tables: LiteratureReviewTable[];
  total_words: number;
  source_papers: any[];
  created_at: string;
}

export type CitationStyle = 'APA 7' | 'IEEE' | 'MLA 9' | 'Harvard' | 'Chicago' | 'Vancouver';

export interface FormattedCitation {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  doi?: string;
  inText: string;
  bibliography: string;
}

export type CitationItem = FormattedCitation;

export interface ClaimVerificationItem {
  id: string;
  claim: string;
  status: 'Verified' | 'Needs Evidence' | 'Unsupported Claim';
  confidence: number;
  supportingEvidence: { paperTitle: string; page: number; section: string; quote: string }[];
  aiInterpretation: string;
  recommendation: string;
}

export type ClaimVerification = ClaimVerificationItem;

export interface ChallengeCritique {
  researchIdea: string;
  coreAssumptions: { assumption: string; riskLevel: 'High' | 'Medium' | 'Low'; notes: string }[];
  potentialWeaknesses: string[];
  missingEvidence: string[];
  alternativeExplanations: string[];
  relevantLiterature: { title: string; authors: string; finding: string; relevance: string }[];
  criticalQuestionsToInvestigate: string[];
}
