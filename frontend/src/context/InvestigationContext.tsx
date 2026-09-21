import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useBackend } from './BackendContext';
import {
  generateTopicResearchData,
  generateTopicLiteratureReview,
  TopicResearchDataset,
} from '../data/demoResearchGenerator';
import { fetchOnlineOpenAlexPapers } from '../services/openalex';
import {
  discoverTopicLiterature,
  getPapers,
  getGaps,
  getLandscape,
  searchOnlinePapers,
  createProject,
  listProjects,
  startResearchWorkflow,
  generateLiteratureReviewApi,
  investigateGap,
  validateGapApi,
  detectGapsApi,
  getHeatmapDataApi,
  getContradictionsDataApi,
  getUnderexploredDataApi,
  getDevelopment,
  getDraft,
  getAgentActivities,
  getCitations,
} from '../services/api';
import {
  Paper,
  ResearchGap,
  ResearchLandscape,
  AgentActivityItem,
  CitationStyle,
  FormattedCitation,
  ClaimVerificationItem,
  LiteratureReviewData,
  ReviewDepth,
  ReviewOrganization,
} from '../types';

export interface DiscoveryPipelineStatus {
  isDiscovering: boolean;
  stage: string;
  queryCount: number;
  candidatesFound: number;
  relevantRetained: number;
  sourcesSearched: string[];
}

export interface InvestigationContextType {
  topic: string;
  activeProjectId: string;
  status: string;
  mode: 'live' | 'demo';
  isRealCorpus: boolean;
  corpus: Paper[];
  setCorpus: React.Dispatch<React.SetStateAction<Paper[]>>;
  landscape: ResearchLandscape;
  gaps: ResearchGap[];
  contradictions: TopicResearchDataset['contradictions'];
  heatmapData: TopicResearchDataset['heatmapData'];
  underexploredAreas: TopicResearchDataset['underexploredAreas'];
  agentActivities: AgentActivityItem[];
  evidenceFlowSteps: TopicResearchDataset['evidenceFlowSteps'];
  development: TopicResearchDataset['development'];
  draft: TopicResearchDataset['draft'];
  literatureReview: LiteratureReviewData;
  selectedGapIdsForReview: string[];
  setSelectedGapIdsForReview: (ids: string[]) => void;
  reviewDepth: ReviewDepth;
  setReviewDepth: (depth: ReviewDepth) => void;
  reviewOrg: ReviewOrganization;
  setReviewOrg: (org: ReviewOrganization) => void;
  reviewCitationStyle: CitationStyle;
  setReviewCitationStyle: (style: CitationStyle) => void;
  generateLiteratureReview: (gapIds?: string[], depth?: ReviewDepth, org?: ReviewOrganization, style?: CitationStyle) => Promise<void>;
  isGeneratingReview: boolean;
  citationsByStyle: Record<CitationStyle, FormattedCitation[]>;
  claimVerifications: ClaimVerificationItem[];
  challengeIdea: TopicResearchDataset['challengeIdea'];
  askQuestions: string[];
  discoveryPipeline: DiscoveryPipelineStatus;
  selectedPaperId: string;
  selectedGapId: string;
  setSelectedPaperId: (id: string) => void;
  setSelectedGapId: (id: string) => void;
  changeTopic: (newTopic: string) => Promise<void>;
  discoverMorePapers: () => Promise<void>;
  refreshCorpus: () => Promise<void>;
  triggerInvestigateGap: (gapId: string) => Promise<any>;
  triggerValidateGap: (gapId: string) => Promise<any>;
  recalculateGaps: () => Promise<void>;
  pipelineError: string | null;
  setPipelineError: (err: string | null) => void;
}

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

export const InvestigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { health, activeProjectId, setActiveProjectId, activeTopic, setActiveTopic, projectStatus } = useBackend();
  const [topic, setTopic] = useState<string>(
    () => activeTopic || 'How artificial intelligence changes modern education and writing'
  );
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'demo'>('live');
  const [isRealCorpus, setIsRealCorpus] = useState<boolean>(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [selectedGapId, setSelectedGapId] = useState<string>('');

  const [dataset, setDataset] = useState<TopicResearchDataset>(() =>
    generateTopicResearchData(activeTopic || 'How artificial intelligence changes modern education and writing')
  );

  const [gaps, setGaps] = useState<ResearchGap[]>(() => dataset.gaps);
  const [landscape, setLandscape] = useState<ResearchLandscape>(() => dataset.landscape);
  const [contradictions, setContradictions] = useState<TopicResearchDataset['contradictions']>(() => dataset.contradictions);
  const [heatmapData, setHeatmapData] = useState<TopicResearchDataset['heatmapData']>(() => dataset.heatmapData);
  const [underexploredAreas, setUnderexploredAreas] = useState<TopicResearchDataset['underexploredAreas']>(() => dataset.underexploredAreas);

  const [literatureReview, setLiteratureReview] = useState<LiteratureReviewData>(() => dataset.literatureReview);
  const [selectedGapIdsForReview, setSelectedGapIdsForReview] = useState<string[]>(() =>
    dataset.gaps.slice(0, 2).map((g) => g.id)
  );
  const [reviewDepth, setReviewDepth] = useState<ReviewDepth>('Detailed');
  const [reviewOrg, setReviewOrg] = useState<ReviewOrganization>('Thematic');
  const [reviewCitationStyle, setReviewCitationStyle] = useState<CitationStyle>('APA 7');
  const [isGeneratingReview, setIsGeneratingReview] = useState<boolean>(false);

  const [development, setDevelopment] = useState<TopicResearchDataset['development']>(() => dataset.development);
  const [draft, setDraft] = useState<TopicResearchDataset['draft']>(() => dataset.draft);
  const [agentActivities, setAgentActivities] = useState<AgentActivityItem[]>(() => dataset.agentActivities);
  const [citationsByStyle, setCitationsByStyle] = useState<Record<CitationStyle, FormattedCitation[]>>(() => dataset.citationsByStyle);
  const [claimVerifications, setClaimVerifications] = useState<ClaimVerificationItem[]>(() => dataset.claimVerifications);
  const [challengeIdea, setChallengeIdea] = useState<TopicResearchDataset['challengeIdea']>(() => dataset.challengeIdea);
  const [askQuestions, setAskQuestions] = useState<string[]>(() => dataset.askQuestions);

  const [corpus, setCorpus] = useState<Paper[]>(() => dataset.papers);

  const [discoveryPipeline, setDiscoveryPipeline] = useState<DiscoveryPipelineStatus>({
    isDiscovering: false,
    stage: 'Corpus Ready',
    queryCount: 6,
    candidatesFound: dataset.papers.length,
    relevantRetained: dataset.papers.length,
    sourcesSearched: ['PubMed', 'OpenAlex', 'arXiv', 'CrossRef'],
  });

  const lastLoadedRef = useRef<string>('');

  const loadInvestigationForTopic = useCallback(
    async (targetTopic: string, projId?: string) => {
      const cleanTopic = targetTopic.trim() || 'How artificial intelligence changes modern education and writing';
      const isDefaultEdu = cleanTopic.toLowerCase() === 'how artificial intelligence changes modern education and writing';

      let targetId = projId;
      if (!targetId && health.connected) {
        try {
          const projects = await listProjects();
          const cleanNorm = cleanTopic.toLowerCase().replace(/["']/g, '').trim();
          const match = projects.find((p: any) => {
            const pNorm = (p.topic || p.title || '').toLowerCase().replace(/["']/g, '').trim();
            return pNorm === cleanNorm || pNorm.includes(cleanNorm) || cleanNorm.includes(pNorm);
          });
          if (match) {
            targetId = match.id;
            setActiveProjectId(match.id);
          } else if (isDefaultEdu) {
            targetId = 'canonical_ai_education_writing';
          } else {
            // Create backend project for this topic so it is properly isolated
            const created = await createProject(
              cleanTopic,
              `Investigation: ${cleanTopic}`,
              `Automated research gap identification for topic: ${cleanTopic}`
            );
            targetId = created.id;
            setActiveProjectId(created.id);
            startResearchWorkflow(created.id).catch(() => {});
          }
        } catch (e) {
          console.warn('Could not match or create project for topic:', e);
        }
      } else if (!targetId && isDefaultEdu) {
        targetId = 'canonical_ai_education_writing';
      }

      const key = `${cleanTopic}::${targetId || ''}`;

      setTopic(cleanTopic);
      setActiveTopic(cleanTopic);

      // 1. Immediately hide/clear previous investigation's results so they are NEVER mixed
      setCorpus([]);
      setGaps([]);
      setLandscape({
        themes: [],
        trends: [],
        methodologyDistribution: {},
        populationDistribution: {},
        geographicDistribution: {},
        nodes: [],
        edges: [],
      });
      setContradictions([]);
      setHeatmapData({ xAxisLabel: '', yAxisLabel: '', xCategories: [], yCategories: [], cells: [] });
      setUnderexploredAreas([]);
      setLiteratureReview(null as any);
      setDevelopment(null as any);
      setDraft(null as any);
      setAgentActivities([]);
      setCitationsByStyle({} as Record<CitationStyle, FormattedCitation[]>);
      setClaimVerifications([]);
      setSelectedPaperId('');
      setSelectedGapId('');
      setSelectedGapIdsForReview([]);
      setPipelineError(null);

      // 2. Set research progress state
      setDiscoveryPipeline({
        isDiscovering: true,
        stage: 'Searching literature...',
        queryCount: 6,
        candidatesFound: 0,
        relevantRetained: 0,
        sourcesSearched: ['PubMed', 'OpenAlex', 'arXiv', 'CrossRef'],
      });

      lastLoadedRef.current = key;

      if (health.connected && targetId && !targetId.startsWith('proj_')) {
        try {
          const [
            existingPapers,
            existingGaps,
            existingLandscape,
            existingContras,
            existingHeatmap,
            existingUnderexplored,
            existingDev,
            existingDraft,
            existingActs,
            existingCits,
          ] = await Promise.all([
            getPapers(targetId).catch(() => []),
            getGaps(targetId).catch(() => []),
            getLandscape(targetId).catch(() => null),
            getContradictionsDataApi(targetId).catch(() => []),
            getHeatmapDataApi(targetId).catch(() => null),
            getUnderexploredDataApi(targetId).catch(() => []),
            getDevelopment(targetId).catch(() => null),
            getDraft(targetId).catch(() => null),
            getAgentActivities(targetId).catch(() => []),
            getCitations(targetId, reviewCitationStyle).catch(() => []),
          ]);

          if (existingPapers && existingPapers.length > 0) {
            setCorpus(existingPapers);
            setIsRealCorpus(true);
            setMode('live');
            if (existingGaps && existingGaps.length > 0) {
              const groundedGaps = existingGaps.map(g => ({
                ...g,
                investigationId: g.investigationId || targetId,
                source: 'backend' as const,
              })).filter(g => {
                // Hard rule: can NEVER have 0 supporting papers and status Validated/Verified
                const count = Math.max(g.supportingPaperIds?.length || 0, g.supportingPapers?.length || 0);
                if (count === 0 && (g.status === 'Validated' || g.status === 'Validated Gap' || (g.status as string) === 'SUPPORTED')) {
                  g.status = 'Insufficient Evidence';
                }
                return true;
              });

              console.group(`[SciLens Gap Grounding Audit] Topic: "${cleanTopic}" | Investigation ID: "${targetId}"`);
              groundedGaps.forEach((g) => {
                const count = Math.max(g.supportingPaperIds?.length || 0, g.supportingPapers?.length || 0);
                console.log({
                  'Gap Title': g.title,
                  'Investigation ID': g.investigationId || targetId,
                  'Supporting Paper IDs': g.supportingPaperIds,
                  'Supporting Paper Titles': g.supportingPapers,
                  'Evidence Count': g.evidenceSnippets?.length || count,
                  'Validation Status': g.status,
                  'Confidence': `${Math.round(g.confidence * 100)}%`,
                  'Source': 'backend'
                });
              });
              console.groupEnd();

              setGaps(groundedGaps);
              setSelectedGapIdsForReview(groundedGaps.slice(0, 2).map((g) => g.id));
              setSelectedGapId(groundedGaps[0].id);
            } else {
              detectGapsApi(targetId).then((detected) => {
                if (detected && detected.length > 0) {
                  const groundedDetected = detected.map(g => ({
                    ...g,
                    investigationId: g.investigationId || targetId,
                    source: 'backend' as const,
                  })).filter(g => {
                    const count = Math.max(g.supportingPaperIds?.length || 0, g.supportingPapers?.length || 0);
                    if (count === 0 && (g.status === 'Validated' || g.status === 'Validated Gap' || (g.status as string) === 'SUPPORTED')) {
                      g.status = 'Insufficient Evidence';
                    }
                    return true;
                  });

                  console.group(`[SciLens Gap Grounding Audit - Detected] Topic: "${cleanTopic}" | Investigation ID: "${targetId}"`);
                  groundedDetected.forEach((g) => {
                    const count = Math.max(g.supportingPaperIds?.length || 0, g.supportingPapers?.length || 0);
                    console.log({
                      'Gap Title': g.title,
                      'Investigation ID': g.investigationId || targetId,
                      'Supporting Paper IDs': g.supportingPaperIds,
                      'Supporting Paper Titles': g.supportingPapers,
                      'Evidence Count': g.evidenceSnippets?.length || count,
                      'Validation Status': g.status,
                      'Confidence': `${Math.round(g.confidence * 100)}%`,
                      'Source': 'backend'
                    });
                  });
                  console.groupEnd();

                  setGaps(groundedDetected);
                  setSelectedGapIdsForReview(groundedDetected.slice(0, 2).map((g) => g.id));
                  setSelectedGapId(groundedDetected[0].id);
                  setPipelineError(null);
                } else {
                  setGaps([]);
                }
              }).catch((err: any) => {
                console.warn('Initial gap detection failed:', err);
                setPipelineError(err?.message || 'Paper analysis or gap detection encountered an error.');
              });
            }
            if (existingLandscape) {
              setLandscape(existingLandscape);
            }
            if (existingContras && existingContras.length > 0) {
              setContradictions(existingContras);
            }
            if (existingHeatmap && existingHeatmap.cells) {
              setHeatmapData(existingHeatmap);
            }
            if (existingUnderexplored && existingUnderexplored.length > 0) {
              setUnderexploredAreas(existingUnderexplored);
            }
            if (existingDev && existingDev.researchQuestions) {
              setDevelopment(existingDev);
            }
            if (existingDraft && existingDraft.sections) {
              setDraft(existingDraft);
            }
            if (existingActs && existingActs.length > 0) {
              setAgentActivities(existingActs);
            }
            if (existingCits && existingCits.length > 0) {
              setCitationsByStyle((prev) => ({
                ...prev,
                [reviewCitationStyle]: existingCits,
              }));
            }
            setSelectedPaperId(existingPapers[0].id);
            setDiscoveryPipeline({
              isDiscovering: false,
              stage: 'Corpus Ready',
              queryCount: 6,
              candidatesFound: existingPapers.length,
              relevantRetained: existingPapers.length,
              sourcesSearched: ['PubMed', 'OpenAlex', 'arXiv', 'CrossRef'],
            });
            return;
          }

          // If project has no papers yet, run live literature discovery
          setDiscoveryPipeline((prev) => ({
            ...prev,
            stage: 'Searching literature...',
            candidatesFound: 0,
          }));

          const discovered = await discoverTopicLiterature(targetId, cleanTopic, 40);

          if (discovered && discovered.length > 0) {
            // Stage 2: Extracting evidence...
            setDiscoveryPipeline((prev) => ({
              ...prev,
              stage: 'Extracting evidence...',
              candidatesFound: discovered.length,
            }));
            setCorpus(discovered);
            setIsRealCorpus(true);
            setMode('live');
            setSelectedPaperId(discovered[0].id);

            // Stage 3: Detecting research gaps...
            setDiscoveryPipeline((prev) => ({
              ...prev,
              stage: 'Detecting research gaps...',
            }));

            const [detectedGaps, newLandscape, newContras, newDev, newDraft, newActs, newCits] = await Promise.all([
              detectGapsApi(targetId).catch(() => []),
              getLandscape(targetId).catch(() => null),
              getContradictionsDataApi(targetId).catch(() => []),
              getDevelopment(targetId).catch(() => null),
              getDraft(targetId).catch(() => null),
              getAgentActivities(targetId).catch(() => []),
              getCitations(targetId, reviewCitationStyle).catch(() => []),
            ]);

            // Stage 4: Validating findings...
            setDiscoveryPipeline((prev) => ({
              ...prev,
              stage: 'Validating findings...',
            }));

            if (detectedGaps && detectedGaps.length > 0) {
              const groundedDetected = detectedGaps.map(g => ({
                ...g,
                investigationId: g.investigationId || targetId,
                source: 'backend' as const,
              })).filter(g => {
                const count = Math.max(g.supportingPaperIds?.length || 0, g.supportingPapers?.length || 0);
                if (count === 0 && (g.status === 'Validated' || g.status === 'Validated Gap' || (g.status as string) === 'SUPPORTED')) {
                  g.status = 'Insufficient Evidence';
                }
                return true;
              });

              console.group(`[SciLens Gap Grounding Audit - Discovered] Topic: "${cleanTopic}" | Investigation ID: "${targetId}"`);
              groundedDetected.forEach((g) => {
                const count = Math.max(g.supportingPaperIds?.length || 0, g.supportingPapers?.length || 0);
                console.log({
                  'Gap Title': g.title,
                  'Investigation ID': g.investigationId || targetId,
                  'Supporting Paper IDs': g.supportingPaperIds,
                  'Supporting Paper Titles': g.supportingPapers,
                  'Evidence Count': g.evidenceSnippets?.length || count,
                  'Validation Status': g.status,
                  'Confidence': `${Math.round(g.confidence * 100)}%`,
                  'Source': 'backend'
                });
              });
              console.groupEnd();

              setGaps(groundedDetected);
              setSelectedGapIdsForReview(groundedDetected.slice(0, 2).map((g) => g.id));
              setSelectedGapId(groundedDetected[0].id);
            } else {
              setGaps([]);
            }
            if (newLandscape) {
              setLandscape(newLandscape);
            }
            if (newContras && newContras.length > 0) {
              setContradictions(newContras);
            }
            if (newDev && newDev.researchQuestions) {
              setDevelopment(newDev);
            }
            if (newDraft && newDraft.sections) {
              setDraft(newDraft);
            }
            if (newActs && newActs.length > 0) {
              setAgentActivities(newActs);
            }
            if (newCits && newCits.length > 0) {
              setCitationsByStyle((prev) => ({
                ...prev,
                [reviewCitationStyle]: newCits,
              }));
            }

            setDiscoveryPipeline({
              isDiscovering: false,
              stage: 'Corpus Ready',
              queryCount: 6,
              candidatesFound: discovered.length,
              relevantRetained: discovered.length,
              sourcesSearched: ['PubMed', 'OpenAlex', 'arXiv', 'CrossRef'],
            });
            return;
          }
        } catch (err) {
          console.warn('Real literature discovery error:', err);
        }
      }

      // Offline / standalone demo fallback:
      // ONLY the exact initial benchmark prompt loads the canonical 42-paper pre-compiled dataset.
      // Any other topic (even containing 'education' or 'writing') will execute live OpenAlex discovery.
      if (!health.connected && isDefaultEdu) {
        const baseDataset = generateTopicResearchData(cleanTopic);
        setDataset(baseDataset);
        setGaps(baseDataset.gaps);
        setLandscape(baseDataset.landscape);
        setContradictions(baseDataset.contradictions);
        setHeatmapData(baseDataset.heatmapData);
        setUnderexploredAreas(baseDataset.underexploredAreas);
        setLiteratureReview(baseDataset.literatureReview);
        setDevelopment(baseDataset.development);
        setDraft(baseDataset.draft);
        setAgentActivities(baseDataset.agentActivities);
        setCitationsByStyle(baseDataset.citationsByStyle);
        setClaimVerifications(baseDataset.claimVerifications);
        setChallengeIdea(baseDataset.challengeIdea);
        setAskQuestions(baseDataset.askQuestions);
        setCorpus(baseDataset.papers);
        setSelectedPaperId(baseDataset.papers[0]?.id || '');
        setSelectedGapId(baseDataset.gaps[0]?.id || '');
        setIsRealCorpus(false);
        setMode('demo');
        setDiscoveryPipeline({
          isDiscovering: false,
          stage: 'Corpus Ready',
          queryCount: 6,
          candidatesFound: baseDataset.papers.length,
          relevantRetained: baseDataset.papers.length,
          sourcesSearched: ['PubMed (Synthesized)', 'OpenAlex (Synthesized)', 'arXiv (Synthesized)'],
        });
      } else {
        // Dynamic live discovery: Query OpenAlex directly from client-side for ANY other topic!
        setDiscoveryPipeline({
          isDiscovering: true,
          stage: `Querying scientific literature for "${cleanTopic}"...`,
          queryCount: 6,
          candidatesFound: 0,
          relevantRetained: 0,
          sourcesSearched: ['OpenAlex', 'arXiv', 'CrossRef'],
        });

        let livePapers: Paper[] = [];
        try {
          livePapers = await fetchOnlineOpenAlexPapers(cleanTopic, 30);
        } catch (err) {
          console.warn('Direct OpenAlex search error:', err);
        }

        if (livePapers.length > 0) {
          // Real papers were found (client-side OpenAlex), but there is no backend
          // connected to run actual evidence-grounded gap detection on them.
          // Previously this branch fed the real papers into generateTopicResearchData(),
          // which stapled on fully templated/fabricated gaps, contradictions, heatmap
          // cells, and underexplored areas -- while isRealCorpus/mode were set to
          // "live"/"real" because the *papers* were real. That made fabricated
          // analysis content look verified. We now show the real papers plainly and
          // leave gap-analysis state empty with a clear pipelineError explaining that
          // the backend must be connected to analyze them -- no synthetic gaps are
          // generated or displayed in their place.
          setDataset((prev) => ({ ...prev, papers: livePapers, gaps: [], contradictions: [] }));
          setGaps([]);
          setContradictions([]);
          setLandscape({
            themes: [],
            trends: [],
            methodologyDistribution: {},
            populationDistribution: {},
            geographicDistribution: {},
            nodes: [],
            edges: [],
          });
          setHeatmapData({
            xAxisLabel: 'Research Themes',
            yAxisLabel: 'Methodology Types',
            xCategories: [],
            yCategories: [],
            cells: [],
          });
          setUnderexploredAreas([]);
          setCorpus(livePapers);
          setSelectedPaperId(livePapers[0]?.id || '');
          setSelectedGapId('');
          setIsRealCorpus(true);
          setMode('live');
          setPipelineError(
            `${livePapers.length} real papers were found via live OpenAlex search, but no backend ` +
            'is connected to run evidence-grounded gap detection on them. Connect the SciLens ' +
            'backend and click "Recalculate" to analyze these papers -- gap analysis is not ' +
            'fabricated or shown for unanalyzed papers.'
          );
          setDiscoveryPipeline({
            isDiscovering: false,
            stage: 'Corpus Ready — Backend Required for Gap Analysis',
            queryCount: 6,
            candidatesFound: livePapers.length,
            relevantRetained: livePapers.length,
            sourcesSearched: ['OpenAlex (Direct API)', 'arXiv', 'CrossRef'],
          });
        } else {
          // No real papers could be found (offline and no backend) -- fall back to
          // the fully synthetic demo dataset. This is fine because it's honestly
          // labeled as demo/not-real throughout (isRealCorpus=false, mode='demo'),
          // unlike the case above where real papers were mixed with fabricated
          // analysis and labeled as real.
          const syntheticDataset = generateTopicResearchData(cleanTopic);
          setDataset(syntheticDataset);
          setGaps(syntheticDataset.gaps);
          setLandscape(syntheticDataset.landscape);
          setContradictions(syntheticDataset.contradictions);
          setHeatmapData(syntheticDataset.heatmapData);
          setUnderexploredAreas(syntheticDataset.underexploredAreas);
          setLiteratureReview(syntheticDataset.literatureReview);
          setDevelopment(syntheticDataset.development);
          setDraft(syntheticDataset.draft);
          setAgentActivities(syntheticDataset.agentActivities);
          setCitationsByStyle(syntheticDataset.citationsByStyle);
          setClaimVerifications(syntheticDataset.claimVerifications);
          setChallengeIdea(syntheticDataset.challengeIdea);
          setAskQuestions(syntheticDataset.askQuestions);
          setCorpus(syntheticDataset.papers);
          setSelectedPaperId(syntheticDataset.papers[0]?.id || '');
          setSelectedGapId(syntheticDataset.gaps[0]?.id || '');
          setIsRealCorpus(false);
          setMode('demo');
          setPipelineError(null);
          setDiscoveryPipeline({
            isDiscovering: false,
            stage: 'Corpus Ready',
            queryCount: 6,
            candidatesFound: syntheticDataset.papers.length,
            relevantRetained: syntheticDataset.papers.length,
            sourcesSearched: ['Synthesized Literature Graph'],
          });
        }
      }
    },
    [health.connected, activeProjectId, reviewCitationStyle]
  );

  useEffect(() => {
    if (activeTopic && activeTopic !== topic) {
      setTopic(activeTopic);
    }
  }, [activeTopic]);

  useEffect(() => {
    const targetTopic = topic;
    const targetId = activeProjectId;
    const key = `${targetTopic}::${targetId || ''}`;
    if (lastLoadedRef.current === key) return;
    loadInvestigationForTopic(targetTopic, targetId);
  }, [topic, activeProjectId, loadInvestigationForTopic]);

  const changeTopic = async (newTopic: string) => {
    const clean = newTopic.trim();
    if (!clean) return;

    setTopic(clean);
    setActiveTopic(clean);

    // 1. Immediately hide/clear previous investigation's results
    setCorpus([]);
    setGaps([]);
    setLandscape({
      themes: [],
      trends: [],
      methodologyDistribution: {},
      populationDistribution: {},
      geographicDistribution: {},
      nodes: [],
      edges: [],
    });
    setContradictions([]);
    setHeatmapData({ xAxisLabel: '', yAxisLabel: '', xCategories: [], yCategories: [], cells: [] });
    setUnderexploredAreas([]);
    setLiteratureReview(null as any);
    setDevelopment(null as any);
    setDraft(null as any);
    setAgentActivities([]);
    setCitationsByStyle({} as Record<CitationStyle, FormattedCitation[]>);
    setClaimVerifications([]);
    setSelectedPaperId('');
    setSelectedGapId('');
    setSelectedGapIdsForReview([]);

    // 2. Set research progress state
    setDiscoveryPipeline({
      isDiscovering: true,
      stage: 'Searching literature...',
      queryCount: 6,
      candidatesFound: 0,
      relevantRetained: 0,
      sourcesSearched: ['PubMed', 'OpenAlex', 'arXiv', 'CrossRef'],
    });

    // 3. Trigger backend project creation and load investigation
    if (health.connected) {
      try {
        const projects = await listProjects();
        const cleanNorm = clean.toLowerCase().replace(/["']/g, '').trim();
        const existing = projects.find((p: any) => {
          const pNorm = (p.topic || p.title || '').toLowerCase().replace(/["']/g, '').trim();
          return pNorm === cleanNorm || pNorm.includes(cleanNorm) || cleanNorm.includes(pNorm);
        });

        let targetId = existing?.id;
        if (!targetId) {
          const created = await createProject(
            clean,
            `Investigation: ${clean}`,
            `Automated research gap identification for topic: ${clean}`
          );
          targetId = created.id;
          startResearchWorkflow(created.id).catch(() => {});
        }
        setActiveProjectId(targetId);
        setActiveTopic(clean);
        lastLoadedRef.current = `${clean}::${targetId}`;
        await loadInvestigationForTopic(clean, targetId);
      } catch (e) {
        console.warn('Could not sync project on backend:', e);
        await loadInvestigationForTopic(clean);
      }
    } else {
      await loadInvestigationForTopic(clean);
    }
  };

  const discoverMorePapers = async () => {
    setDiscoveryPipeline((prev) => ({
      ...prev,
      isDiscovering: true,
      stage: `Running secondary discovery queries for "${topic}"...`,
    }));

    if (health.connected && activeProjectId && !activeProjectId.startsWith('proj_')) {
      const more = await searchOnlinePapers(activeProjectId, `${topic} state of the art advances`, 15);
      if (more && more.length > 0) {
        setCorpus((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const existingTitles = new Set(prev.map((p) => p.title.toLowerCase().trim()));
          const newPapers = more.filter(
            (p) => !existingIds.has(p.id) && !existingTitles.has(p.title.toLowerCase().trim())
          );
          return [...prev, ...newPapers];
        });
      }
    } else {
      try {
        const more = await fetchOnlineOpenAlexPapers(`${topic} recent empirical advances`, 15);
        if (more && more.length > 0) {
          setCorpus((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const existingTitles = new Set(prev.map((p) => p.title.toLowerCase().trim()));
            const newPapers = more.filter(
              (p) => !existingIds.has(p.id) && !existingTitles.has(p.title.toLowerCase().trim())
            );
            return [...prev, ...newPapers];
          });
        }
      } catch (err) {
        console.warn('Offline discoverMorePapers error:', err);
      }
    }

    setDiscoveryPipeline((prev) => ({
      ...prev,
      isDiscovering: false,
      stage: 'Corpus expansion completed',
    }));
  };

  const generateLiteratureReview = async (
    targetGapIds?: string[],
    depth?: ReviewDepth,
    org?: ReviewOrganization,
    style?: CitationStyle
  ) => {
    const gapsToUse = targetGapIds || selectedGapIdsForReview;
    const depthToUse = depth || reviewDepth;
    const orgToUse = org || reviewOrg;
    const styleToUse = style || reviewCitationStyle;

    setIsGeneratingReview(true);

    if (health.connected && activeProjectId && !activeProjectId.startsWith('proj_')) {
      try {
        const res = await generateLiteratureReviewApi(activeProjectId, {
          selected_gap_ids: gapsToUse,
          review_depth: depthToUse,
          organization: orgToUse,
          citation_style: styleToUse,
        });
        if (res && res.sections && res.sections.length > 0) {
          setLiteratureReview(res);
          setIsGeneratingReview(false);
          return;
        }
      } catch (err) {
        console.warn('Backend literature review generation error, falling back:', err);
      }
    }

    const generated = generateTopicLiteratureReview(
      topic,
      depthToUse,
      orgToUse,
      styleToUse
    );
    setLiteratureReview(generated);
    setIsGeneratingReview(false);
  };

  const refreshCorpus = async () => {
    await loadInvestigationForTopic(topic, activeProjectId);
  };

  const triggerInvestigateGap = async (gapId: string): Promise<any> => {
    if (health.connected && activeProjectId && !activeProjectId.startsWith('proj_')) {
      const res = await investigateGap(activeProjectId, gapId);
      if (res && res.success) {
        const updatedGaps = await getGaps(activeProjectId);
        if (updatedGaps && updatedGaps.length > 0) {
          setGaps(updatedGaps);
        }
      }
      return res;
    }
    return null;
  };

  const triggerValidateGap = async (gapId: string): Promise<any> => {
    if (health.connected && activeProjectId && !activeProjectId.startsWith('proj_')) {
      const res = await validateGapApi(activeProjectId, gapId);
      if (res && res.status) {
        const updatedGaps = await getGaps(activeProjectId);
        if (updatedGaps && updatedGaps.length > 0) {
          setGaps(updatedGaps);
        }
      }
      return res;
    }
    return null;
  };

  const recalculateGaps = async (): Promise<void> => {
    if (health.connected && activeProjectId && !activeProjectId.startsWith('proj_')) {
      try {
        setPipelineError(null);
        const updatedGaps = await detectGapsApi(activeProjectId);
        if (updatedGaps && updatedGaps.length > 0) {
          setGaps(updatedGaps);
          setSelectedGapIdsForReview(updatedGaps.slice(0, 2).map((g) => g.id));
          setSelectedGapId(updatedGaps[0].id);
        }
      } catch (err: any) {
        console.warn('recalculateGaps error:', err);
        setPipelineError(err?.message || 'Paper analysis or gap detection encountered an error.');
      }
    }
  };

  return (
    <InvestigationContext.Provider
      value={{
        topic,
        activeProjectId,
        status: projectStatus?.status || 'active',
        mode,
        isRealCorpus,
        corpus,
        setCorpus,
        landscape,
        gaps,
        contradictions,
        heatmapData,
        underexploredAreas,
        agentActivities,
        evidenceFlowSteps: dataset.evidenceFlowSteps,
        development,
        draft,
        literatureReview,
        selectedGapIdsForReview,
        setSelectedGapIdsForReview,
        reviewDepth,
        setReviewDepth,
        reviewOrg,
        setReviewOrg,
        reviewCitationStyle,
        setReviewCitationStyle,
        generateLiteratureReview,
        isGeneratingReview,
        citationsByStyle,
        claimVerifications,
        challengeIdea,
        askQuestions,
        discoveryPipeline,
        selectedPaperId,
        selectedGapId,
        setSelectedPaperId,
        setSelectedGapId,
        changeTopic,
        discoverMorePapers,
        refreshCorpus,
        triggerInvestigateGap,
        triggerValidateGap,
        recalculateGaps,
        pipelineError,
        setPipelineError,
      }}
    >
      {children}
    </InvestigationContext.Provider>
  );
};

export const useInvestigation = (): InvestigationContextType => {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
};
