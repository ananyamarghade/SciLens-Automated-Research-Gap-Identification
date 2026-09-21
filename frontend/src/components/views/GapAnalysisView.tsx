import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { useBackend } from '../../context/BackendContext';
import { ResearchGap, GapType, GapStatus } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import { WorkspaceView } from '../layout/Sidebar';
import {
  Split,
  SearchCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  Layers,
  ArrowRight,
  Sparkles,
  GitPullRequest,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';

interface GapAnalysisViewProps {
  onNavigate: (view: WorkspaceView) => void;
  onSelectGap: (gapId: string) => void;
}

export const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({
  onNavigate,
  onSelectGap,
}) => {
  const { activeProjectId } = useBackend();
  const {
    topic,
    corpus,
    gaps,
    contradictions,
    heatmapData,
    underexploredAreas,
    selectedGapIdsForReview,
    setSelectedGapIdsForReview,
    recalculateGaps,
    pipelineError,
  } = useInvestigation();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'cards' | 'heatmap' | 'contradictions' | 'underexplored'>('cards');
  const [expandedGapIds, setExpandedGapIds] = useState<Record<string, boolean>>({});
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      await recalculateGaps();
    } finally {
      setIsRecalculating(false);
    }
  };

  const toggleGapExpanded = (id: string) => {
    setExpandedGapIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleSelectGap = (gapId: string) => {
    if (selectedGapIdsForReview.includes(gapId)) {
      setSelectedGapIdsForReview(selectedGapIdsForReview.filter((id) => id !== gapId));
    } else {
      setSelectedGapIdsForReview([...selectedGapIdsForReview, gapId]);
    }
  };

  const handleSelectAllGaps = () => {
    setSelectedGapIdsForReview(gaps.map((g) => g.id));
  };

  const handleClearAllGaps = () => {
    setSelectedGapIdsForReview([]);
  };

  const gapTypes: (GapType | 'all')[] = [
    'all',
    'Methodological',
    'Population',
    'Geographical',
    'Contextual',
    'Temporal',
    'Theoretical',
    'Technological',
    'Data',
    'Contradictory Findings',
  ];

  const filteredGaps = gaps.filter((g) => {
    // HARD RULE: Only display gaps that belong to the active investigation
    const matchesInvestigation = !g.investigationId || g.investigationId === activeProjectId || g.investigationId === topic;
    const matchesType = selectedType === 'all' || g.gapType === selectedType;
    const matchesStatus = selectedStatus === 'all' || g.status === selectedStatus;
    return matchesInvestigation && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl pb-12">
      <PageHeader
        label="RESEARCH INTELLIGENCE"
        title="Research Gap"
        italicWord="Analysis"
        description="Literature voids, method-space blindspots, and contradictory findings verified through grounded multi-source evidence."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#0C1528] hover:bg-scilens-warmgray dark:hover:bg-scilens-darkborder border border-scilens-border dark:border-scilens-darkborder text-scilens-navy dark:text-white text-xs font-sans font-medium transition-colors flex items-center gap-1.5 shadow-subtle disabled:opacity-50 cursor-pointer"
              title="Trigger Paper-First dynamic gap detection across all indexed papers in corpus"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5 text-scilens-teal", isRecalculating && "animate-spin")} />
              <span>{isRecalculating ? 'Recalculating...' : 'Recalculate from Corpus'}</span>
            </button>
            <button
              onClick={() => {
                if (gaps.length > 0) onSelectGap(gaps[0].id);
                onNavigate('gap_investigator');
              }}
              className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-subtle"
            >
              <SearchCheck className="w-3.5 h-3.5" />
              <span>Investigate a Gap</span>
            </button>
          </div>
        }
      />

      {/* Step-by-Step Research Journey Progress */}
      <div className="p-4 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2 text-scilens-muted dark:text-scilens-darkmuted font-mono text-[11px] uppercase tracking-wider">
            <span>Research Journey:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Literature Mapped {corpus.length > 0 ? `(${corpus.length} papers)` : ''}</span>
            </div>
            <ArrowRight className="w-3 h-3 text-scilens-muted/40 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-scilens-teal dark:text-scilens-glowteal font-semibold">
              <span className="w-5 h-5 rounded-full bg-scilens-lightteal dark:bg-scilens-teal/30 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Gap Analysis ({gaps.length} gaps)</span>
            </div>
            <ArrowRight className="w-3 h-3 text-scilens-muted/40 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-scilens-muted dark:text-scilens-darkmuted">
              <span className="w-5 h-5 rounded-full bg-scilens-warmgray dark:bg-scilens-darkborder flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Adversarial Testing</span>
            </div>
            <ArrowRight className="w-3 h-3 text-scilens-muted/40 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-scilens-muted dark:text-scilens-darkmuted">
              <span className="w-5 h-5 rounded-full bg-scilens-warmgray dark:bg-scilens-darkborder flex items-center justify-center text-[10px] font-bold">4</span>
              <span>Proposal & Literature Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Cards, Heatmap, Contradictions, Underexplored */}
      <div className="flex border-b border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] rounded-xl p-1 gap-1 shadow-subtle">
        <button
          onClick={() => setActiveSubTab('cards')}
          className={clsx(
            'px-4 py-2 rounded-lg text-xs font-sans font-medium transition-colors flex items-center gap-2',
            activeSubTab === 'cards'
              ? 'bg-scilens-navy text-white shadow-subtle'
              : 'text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white hover:bg-scilens-warmgray dark:hover:bg-scilens-darkborder'
          )}
        >
          <Split className="w-3.5 h-3.5" />
          <span>Research Gaps ({gaps.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('heatmap')}
          className={clsx(
            'px-4 py-2 rounded-lg text-xs font-sans font-medium transition-colors flex items-center gap-2',
            activeSubTab === 'heatmap'
              ? 'bg-scilens-navy text-white shadow-subtle'
              : 'text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white hover:bg-scilens-warmgray dark:hover:bg-scilens-darkborder'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Coverage Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contradictions')}
          className={clsx(
            'px-4 py-2 rounded-lg text-xs font-sans font-medium transition-colors flex items-center gap-2',
            activeSubTab === 'contradictions'
              ? 'bg-scilens-navy text-white shadow-subtle'
              : 'text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white hover:bg-scilens-warmgray dark:hover:bg-scilens-darkborder'
          )}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Contradictory Findings ({contradictions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('underexplored')}
          className={clsx(
            'px-4 py-2 rounded-lg text-xs font-sans font-medium transition-colors flex items-center gap-2',
            activeSubTab === 'underexplored'
              ? 'bg-scilens-navy text-white shadow-subtle'
              : 'text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white hover:bg-scilens-warmgray dark:hover:bg-scilens-darkborder'
          )}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Underexplored Areas</span>
        </button>
      </div>

      {/* Sub-Tab 1: Gap Cards */}
      {activeSubTab === 'cards' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-scilens-muted flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Type:
                </span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-sans rounded-lg border border-scilens-border bg-white text-scilens-navy focus:outline-none focus:border-scilens-teal"
                >
                  <option value="all">All 9 Gap Types</option>
                  {gapTypes
                    .filter((t) => t !== 'all')
                    .map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                </select>

                <span className="text-xs font-mono text-scilens-muted ml-2">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-sans rounded-lg border border-scilens-border bg-white text-scilens-navy focus:outline-none focus:border-scilens-teal"
                >
                  <option value="all">All Statuses</option>
                  <option value="Validated">Validated by Critic</option>
                  <option value="Potential">Potential</option>
                  <option value="Insufficient Evidence">Insufficient Evidence</option>
                </select>
              </div>

              <span className="text-xs font-mono text-scilens-muted">
                Showing <strong className="text-scilens-navy">{filteredGaps.length}</strong> gaps
              </span>
            </div>
          </div>

          {/* Gap Selection Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-scilens-lightteal/50 dark:bg-scilens-teal/10 border border-scilens-borderteal dark:border-scilens-darkborder rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold text-scilens-teal dark:text-scilens-glowteal">
                SELECT GAPS FOR LITERATURE REVIEW:
              </span>
              <span className="text-xs font-sans text-scilens-navy dark:text-white">
                <strong>{selectedGapIdsForReview.length}</strong> of {gaps.length} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllGaps}
                className="px-2.5 py-1 text-xs font-sans rounded bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder text-scilens-navy dark:text-white hover:bg-scilens-warmgray"
              >
                Select All
              </button>
              <button
                onClick={handleClearAllGaps}
                className="px-2.5 py-1 text-xs font-sans rounded bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder text-scilens-muted dark:text-scilens-darkmuted hover:bg-scilens-warmgray"
              >
                Clear
              </button>
              <button
                onClick={() => onNavigate('draft_builder')}
                className="px-3 py-1 text-xs font-sans font-medium rounded bg-scilens-teal hover:bg-scilens-darkteal text-white flex items-center gap-1.5 shadow-subtle ml-2"
              >
                <span>Synthesize in Literature Review</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Empty State Guard */}
          {filteredGaps.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl space-y-3 shadow-subtle">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-scilens-navy dark:text-white">
                {pipelineError
                  ? 'ANALYSIS PIPELINE ISSUE'
                  : corpus.length > 0
                  ? 'NO RESEARCH GAPS IDENTIFIED'
                  : 'NO SUFFICIENT EVIDENCE'}
              </h3>
              <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted max-w-md mx-auto">
                {pipelineError
                  ? pipelineError
                  : corpus.length > 0
                  ? `No research gaps identified in the current evidence. ${corpus.length} papers analyzed.`
                  : 'No grounded research gaps match current criteria. Run a literature discovery investigation across indexed peer-reviewed sources to identify evidence-backed research gaps.'}
              </p>
              {corpus.length > 0 ? (
                <button
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={clsx("w-3.5 h-3.5", isRecalculating && "animate-spin")} />
                  <span>{isRecalculating ? 'Re-analyzing Corpus...' : 'Re-analyze Corpus'}</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('literature')}
                  className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Search Literature Corpus</span>
                </button>
              )}
            </div>
          )}

          {/* Gap List */}
          <div className="space-y-5">
            {filteredGaps.map((gap) => {
              const isExpanded = !!expandedGapIds[gap.id];
              const isSelected = selectedGapIdsForReview.includes(gap.id);
              const supportingSnippets = gap.evidenceSnippets.filter((s) => s.isSupporting !== false);
              const counterSnippets = gap.evidenceSnippets.filter((s) => s.isSupporting === false);
              const normConf = gap.confidence > 1 ? gap.confidence / 100 : (gap.confidence || 0.85);
              const strengthLabel = normConf >= 0.82 ? 'Strong' : normConf >= 0.65 ? 'Moderate' : 'Preliminary';
              const strengthDisplay = `${normConf.toFixed(2)} / 1.00 (${strengthLabel})`;

              return (
                <div
                  key={gap.id}
                  className={clsx(
                    'p-6 bg-white dark:bg-[#0C1528] border rounded-xl shadow-subtle transition-all space-y-4',
                    isSelected
                      ? 'border-scilens-teal dark:border-scilens-glowteal ring-1 ring-scilens-teal/30'
                      : 'border-scilens-border dark:border-scilens-darkborder hover:border-scilens-teal/40'
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    {/* 7. Action: Select for Literature Review Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectGap(gap.id)}
                        className="w-4 h-4 rounded text-scilens-teal focus:ring-scilens-teal border-scilens-border cursor-pointer"
                        title="Select this gap for Literature Review synthesis"
                      />
                    </div>

                    <div className="space-y-4 flex-1">
                      {/* Top Meta: Type, Status Badge & Normalized Strength */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-scilens-border/60 dark:border-scilens-darkborder pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder text-scilens-navy dark:text-white font-medium">
                            {gap.gapType} Gap
                          </span>

                          {((gap.status === 'Validated' || gap.status === 'Validated Gap' || (gap.status as string) === 'SUPPORTED' || (gap.status as string) === 'VALID') && ((gap.supportingPaperIds?.length || 0) > 0 || (gap.supportingPapers?.length || 0) > 0)) && (
                            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Validated / Supported Gap
                            </span>
                          )}
                          {(gap.status === 'Potential' || gap.status === 'Potential Gap' || (gap.status as string) === 'CANDIDATE' || gap.status === 'Candidate Gap') && (
                            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Candidate / Potential Gap
                            </span>
                          )}
                          {(gap.status === 'Insufficient Evidence' || (gap.status as string) === 'CONTESTED' || gap.status === 'Contested Gap' || ((gap.supportingPaperIds?.length || 0) === 0 && (gap.supportingPapers?.length || 0) === 0)) && (
                            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Contested / Insufficient Evidence
                            </span>
                          )}

                          <span className="text-[11px] font-mono text-scilens-lightmuted">
                            Iteration {gap.iterationCount}
                          </span>
                        </div>

                        {/* Normalized Evidence Strength Display (e.g. 0.85 / 1.00 (Strong)) */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-scilens-lightmuted uppercase block">
                              Evidence Strength
                            </span>
                            <span className="font-mono text-xs sm:text-sm font-bold text-scilens-teal dark:text-scilens-glowteal">
                              {strengthDisplay}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1. Title */}
                      <h3 className="font-serif text-xl font-bold text-scilens-navy dark:text-white leading-snug">
                        {gap.title}
                      </h3>

                      {/* Evidence-Supported Cross-Paper Pattern */}
                      {gap.crossPaperPattern && (
                        <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-lg text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <GitPullRequest className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="font-mono text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                              EVIDENCE-SUPPORTED CROSS-PAPER PATTERN
                            </span>
                          </div>
                          <p className="font-sans text-xs text-scilens-navy/90 dark:text-white/90 leading-relaxed pl-5">
                            {gap.crossPaperPattern}
                          </p>
                        </div>
                      )}

                      {/* Derived From Indexed Corpus (Traceable Paper Observations) */}
                      {gap.derivedFrom && gap.derivedFrom.length > 0 && (
                        <div className="space-y-2 p-3.5 bg-slate-50/80 dark:bg-[#070D1E] rounded-lg border border-scilens-border/70 dark:border-scilens-darkborder">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                              DERIVED FROM CORPUS ANALYSIS ({gap.derivedFrom.length} independent papers)
                            </span>
                            <span className="text-[10px] font-mono text-scilens-lightmuted">
                              Paper-First Grounding
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {gap.derivedFrom.map((obs, oIdx) => {
                              const hasExcerpt = obs.exact_excerpt && obs.exact_excerpt !== 'Not reported in source';
                              return (
                                <div
                                  key={oIdx}
                                  className="p-2.5 rounded border border-scilens-border/60 dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] text-xs space-y-1"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-scilens-navy dark:text-white">
                                        {obs.paper_title} ({obs.year})
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-scilens-warmgray dark:bg-[#070D1E] text-scilens-muted border border-scilens-border/60 dark:border-scilens-darkborder">
                                        § {obs.source_section}
                                      </span>
                                    </div>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-medium">
                                      {obs.extraction_type ? obs.extraction_type.replace(/_/g, ' ') : 'OBSERVATION'}
                                    </span>
                                  </div>
                                  <p className="font-sans text-xs text-scilens-navy/90 dark:text-white/90">
                                    <strong className="font-medium text-scilens-slate dark:text-zinc-300">Observed: </strong>
                                    {obs.observation}
                                  </p>
                                  {hasExcerpt && (
                                    <div className="space-y-0.5 pl-2 border-l-2 border-emerald-500">
                                      <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider">
                                        Exact Source Excerpt:
                                      </span>
                                      <p className="font-serif italic text-[11px] text-scilens-navy/90 dark:text-white/90">
                                        "{obs.exact_excerpt}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Why This Appears to be a Gap */}
                      <div className="p-3.5 bg-scilens-ivory dark:bg-[#070D1E] rounded-lg border border-scilens-border/60 dark:border-scilens-darkborder text-xs space-y-1.5">
                        <span className="font-mono text-[10px] font-semibold text-scilens-teal dark:text-scilens-glowteal uppercase tracking-wider block">
                          2. WHY THIS APPEARS TO BE A GAP
                        </span>
                        <p className="font-sans text-xs text-scilens-navy/90 dark:text-white/90 leading-relaxed">
                          {gap.description}
                        </p>
                      </div>

                      {/* 3. Evidence from the Literature (Supporting Studies) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                            3. EVIDENCE FROM THE LITERATURE ({supportingSnippets.length} supporting citations)
                          </span>
                          <button
                            onClick={() => toggleGapExpanded(gap.id)}
                            className="text-[11px] font-mono text-scilens-teal dark:text-scilens-glowteal hover:underline flex items-center gap-1"
                          >
                            <span>{isExpanded ? 'Collapse snippets' : 'Inspect paper snippets'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>

                        {supportingSnippets.length > 0 ? (
                          <div className="space-y-2">
                            {supportingSnippets.slice(0, isExpanded ? supportingSnippets.length : 2).map((snip, sIdx) => {
                              const isDirectQuote = snip.evidenceType === 'DIRECT_QUOTE' && Boolean(snip.exactSourceText);
                              return (
                                <div
                                  key={snip.id || sIdx}
                                  className="p-3 rounded-lg border border-scilens-border/70 dark:border-scilens-darkborder bg-scilens-ivory/40 dark:bg-[#070D1E]/40 text-xs space-y-1.5"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-scilens-navy dark:text-white">
                                        {snip.paperTitle} ({snip.year || 2024})
                                      </span>
                                      {snip.relevanceTier && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-scilens-parchment dark:bg-[#070D1E] text-scilens-slate dark:text-scilens-darkmuted border border-scilens-border dark:border-scilens-darkborder">
                                          {snip.relevanceTier}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isDirectQuote && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] border border-emerald-500/20 font-semibold">
                                          DIRECT QUOTE (Page {snip.pageNumber || 'N/A'}, § {snip.section})
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {isDirectQuote ? (
                                    <p className="font-serif italic text-xs text-scilens-navy/90 dark:text-white/90 pl-2 border-l-2 border-emerald-500">
                                      "{snip.exactSourceText || snip.snippet}"
                                    </p>
                                  ) : (
                                    <p className="font-sans text-xs text-scilens-navy/90 dark:text-white/90 pl-2 border-l-2 border-blue-400">
                                      {snip.snippet}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-scilens-muted">
                            No direct supporting snippets indexed yet. Run Gap Investigator to augment evidence.
                          </div>
                        )}
                      </div>

                      {/* 4. What the Literature Does NOT Yet Establish */}
                      <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-lg text-xs space-y-1">
                        <span className="font-mono text-[10px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                          4. WHAT THE LITERATURE DOES NOT YET ESTABLISH
                        </span>
                        <p className="font-sans text-xs text-scilens-navy/90 dark:text-white/90 leading-relaxed">
                          {gap.missingEvidence
                            ? gap.missingEvidence
                            : gap.criticNotes && gap.criticNotes.includes('Boundary:')
                            ? gap.criticNotes.replace('Boundary:', '').trim()
                            : gap.criticNotes
                            ? gap.criticNotes
                            : `Published studies have not verified cross-experimental replicability, external validity, or longitudinal boundaries under unconstrained operational settings.`}
                        </p>
                      </div>

                      {/* 5. Counter-Evidence / Alternative Interpretations */}
                      <div className="space-y-1.5">
                        <span className="font-mono text-[10px] font-semibold text-scilens-muted dark:text-scilens-darkmuted uppercase tracking-wider block">
                          5. COUNTER-EVIDENCE & CHALLENGING FINDINGS
                        </span>
                        {counterSnippets.length > 0 ? (
                          <div className="space-y-2">
                            {counterSnippets.map((csnip, cIdx) => {
                              const isDirectQuote = csnip.evidenceType === 'DIRECT_QUOTE' && Boolean(csnip.exactSourceText);
                              return (
                                <div
                                  key={csnip.id || cIdx}
                                  className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 text-xs space-y-1.5"
                                >
                                  <div className="flex flex-wrap items-center justify-between text-[10px] font-mono">
                                    <span className="font-semibold text-amber-900 dark:text-amber-300">
                                      {csnip.paperTitle}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {isDirectQuote && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] border border-emerald-500/20 font-semibold">
                                          DIRECT QUOTE (Page {csnip.pageNumber || 'N/A'}, § {csnip.section})
                                        </span>
                                      )}
                                      <span className="text-amber-700 dark:text-amber-400">
                                        Contradictory / Divergent Context
                                      </span>
                                    </div>
                                  </div>

                                  {isDirectQuote ? (
                                    <p className="font-serif italic text-xs text-scilens-navy/90 dark:text-white/90 pl-2 border-l-2 border-amber-500">
                                      "{csnip.exactSourceText || csnip.snippet}"
                                    </p>
                                  ) : (
                                    <p className="font-sans text-xs text-scilens-navy/90 dark:text-white/90 pl-2 border-l-2 border-amber-500">
                                      {csnip.snippet}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span>No contradictory evidence was identified in the searched corpus.</span>
                          </div>
                        )}
                      </div>

                      {/* 6. Current Assessment Rationale & 7. Action Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-scilens-border/60 dark:border-scilens-darkborder">
                        <div className="text-xs space-y-0.5 flex-1 pr-4">
                          <span className="font-mono text-[10px] font-semibold text-scilens-lightmuted uppercase block">
                            6. Assessment Rationale & Corpus Evidence:
                          </span>
                          <span className="text-scilens-navy/80 dark:text-white/80 font-sans text-xs block leading-relaxed">
                            {gap.confidenceRationale
                              ? gap.confidenceRationale
                              : gap.status === 'Validated' || gap.status === 'Validated Gap' || (gap.status as string) === 'SUPPORTED' || (gap.status as string) === 'VALID'
                              ? 'Validated via multiple converging peer-reviewed studies without unresolved refutations.'
                              : gap.status === 'Potential' || (gap.status as string) === 'Candidate Gap' || (gap.status as string) === 'Supported Gap'
                              ? 'Corroborated by preliminary evidence; requires secondary adversarial validation.'
                              : 'Corroborated by empirical literature analysis across indexed publications.'}
                          </span>
                        </div>

                        {/* 7. Action: Test this Gap */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              onSelectGap(gap.id);
                              onNavigate('gap_investigator');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
                          >
                            <SearchCheck className="w-3.5 h-3.5" />
                            <span>Test This Gap</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Gap Heatmap Matrix */}
      {activeSubTab === 'heatmap' && (
        <div className="p-6 bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <SectionLabel text="LITERATURE SATURATION HEATMAP" />
              <h3 className="font-serif text-lg font-bold text-scilens-navy dark:text-white mt-1">
                Methodology vs. Demographic Population Coverage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Deep teal cells indicate well-explored research hubs. Soft rose blocks indicate verified literature voids.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {heatmapData.xCategories.length * heatmapData.yCategories.length} Matrix Intersections
              </span>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-mono uppercase bg-slate-50/80 dark:bg-[#070D1E]">
                  <th className="p-3.5 text-slate-500 dark:text-slate-400 font-semibold border-r border-slate-200/80 dark:border-slate-800">
                    Research Modality
                  </th>
                  {heatmapData.xCategories.map((col, idx) => (
                    <th key={idx} className="p-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#0C1528] border border-slate-200/60 dark:border-slate-700 shadow-xs">
                        {col}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-sans">
                {heatmapData.yCategories.map((modality, rIdx) => (
                  <tr key={rIdx} className="transition-colors">
                    <td className="p-3.5 font-semibold text-scilens-navy dark:text-white bg-slate-50/60 dark:bg-[#070D1E] border-r border-slate-200/80 dark:border-slate-800 whitespace-nowrap">
                      {modality}
                    </td>
                    {heatmapData.xCategories.map((col, cIdx) => {
                      const cell = heatmapData.cells.find(
                        (c) => c.x === col && c.y === modality
                      );
                      const isVoid = cell?.status === 'Total Void' || cell?.density === 0;
                      const isSevere = cell?.status === 'Severe Gap';
                      const isSaturated = (cell?.density || 0) > 0.6;

                      return (
                        <td
                          key={cIdx}
                          className={clsx(
                            'p-3.5 transition-all',
                            isVoid
                              ? 'bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/40'
                              : isSevere
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/40'
                              : isSaturated
                              ? 'bg-teal-50/60 dark:bg-teal-950/30 hover:bg-teal-100/60 dark:hover:bg-teal-950/50'
                              : 'bg-slate-50/30 dark:bg-slate-900/30 hover:bg-slate-100/40 dark:hover:bg-slate-800/40'
                          )}
                        >
                          <div className="flex flex-col gap-1.5 min-w-[130px]">
                            <div className="flex items-center gap-2">
                              <span
                                className={clsx(
                                  'w-2.5 h-2.5 rounded-full flex-shrink-0',
                                  isVoid
                                    ? 'bg-rose-500 animate-pulse'
                                    : isSevere
                                    ? 'bg-amber-500'
                                    : isSaturated
                                    ? 'bg-scilens-teal dark:bg-scilens-glowteal shadow-xs'
                                    : 'bg-slate-400 dark:bg-slate-500'
                                )}
                              />
                              <span className="font-mono font-bold text-xs text-scilens-navy dark:text-white">
                                {cell?.paperCount || 0} {(cell?.paperCount || 0) === 1 ? 'paper' : 'papers'}
                              </span>
                            </div>

                            <span
                              className={clsx(
                                'text-[10px] font-mono px-2 py-0.5 rounded-full inline-block w-max font-semibold uppercase tracking-wider',
                                isVoid
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                  : isSevere
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                  : isSaturated
                                  ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              )}
                            >
                              {cell?.status || 'Moderate'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Heatmap Color Scale Legend */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                Saturation Scale:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Total Void (0 papers)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Severe Gap (1 paper)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Moderate (2-3 papers)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-scilens-teal dark:bg-scilens-glowteal shadow-xs" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Saturated Hub (4+ papers)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Contradiction Finder */}
      {activeSubTab === 'contradictions' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-2">
            <SectionLabel text="EMPIRICAL CONTRADICTION FINDER" />
            <h3 className="font-serif text-lg font-bold text-scilens-navy">
              Direct Divergences & Conflicting Literature Claims
            </h3>
            <p className="text-xs text-scilens-muted font-sans">
              SciLens identifies contradictory empirical findings between published studies, explaining methodology discrepancies, sample divergences, and hypothesized root causes.
            </p>
          </div>

          <div className="space-y-4">
            {contradictions.map((c) => (
              <div
                key={c.id}
                className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4"
              >
                <div className="flex items-center justify-between border-b border-scilens-border pb-3">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-amber-600" />
                    <h4 className="font-serif text-base font-bold text-scilens-navy">
                      {c.topic}
                    </h4>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    {c.divergenceLevel}
                  </span>
                </div>

                {/* Paper A vs Paper B Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-scilens-ivory border border-scilens-border space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-scilens-muted">
                      <span className="font-bold text-scilens-navy">Paper A: {c.paperA.title}</span>
                      <span>({c.paperA.year})</span>
                    </div>
                    <p className="text-xs font-serif italic text-scilens-navy leading-relaxed">
                      "{c.paperA.finding}"
                    </p>
                    <div className="text-[10px] font-mono text-scilens-lightmuted">
                      Method: {c.paperA.methodology}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-scilens-ivory border border-scilens-border space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-scilens-muted">
                      <span className="font-bold text-scilens-navy">Paper B: {c.paperB.title}</span>
                      <span>({c.paperB.year})</span>
                    </div>
                    <p className="text-xs font-serif italic text-scilens-navy leading-relaxed">
                      "{c.paperB.finding}"
                    </p>
                    <div className="text-[10px] font-mono text-scilens-lightmuted">
                      Method: {c.paperB.methodology}
                    </div>
                  </div>
                </div>

                {/* AI Explanation of Divergence */}
                <div className="p-4 rounded-lg bg-scilens-warmgray/50 border border-scilens-border space-y-2 text-xs">
                  <span className="font-mono text-[10px] uppercase text-scilens-lightmuted font-semibold block">
                    SciLens Discrepancy Decomposition
                  </span>
                  <div className="space-y-1 text-scilens-navy">
                    <p>
                      <strong>Methodological Difference:</strong> {c.methodologyDifferences}
                    </p>
                    <p>
                      <strong>Population Bias:</strong> {c.populationDifferences}
                    </p>
                    <p className="text-scilens-teal font-medium mt-1">
                      <strong>Reconciliation Hypothesis:</strong> {c.possibleExplanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Underexplored Domains */}
      {activeSubTab === 'underexplored' && (
        <div className="space-y-4">
          <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-2">
            <SectionLabel text="STRATEGIC RESEARCH OPPORTUNITIES" />
            <h3 className="font-serif text-lg font-bold text-scilens-navy">
              High-Value Underexplored Research Territory
            </h3>
            <p className="text-xs text-scilens-muted font-sans">
              Identified scientific intersections with high theoretical significance, actionable clinical relevance, and currently less than 3 peer-reviewed citations in international indexing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {underexploredAreas.map((area, idx) => (
              <div
                key={idx}
                className="p-5 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-scilens-lightteal text-scilens-teal font-medium">
                    {area.category}
                  </span>
                  <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Priority: {area.priority}
                  </span>
                </div>

                <h4 className="font-serif text-base font-bold text-scilens-navy">
                  {area.title}
                </h4>

                <p className="text-xs text-scilens-muted font-sans leading-relaxed">
                  {area.description}
                </p>

                <div className="pt-2 border-t border-scilens-border text-[11px] font-sans text-scilens-navy flex items-center justify-between">
                  <span className="text-scilens-lightmuted font-mono">Literature Saturation:</span>
                  <span className="font-medium text-amber-800">{area.exploredRatio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
