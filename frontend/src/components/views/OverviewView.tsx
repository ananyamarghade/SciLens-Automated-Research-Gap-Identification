import React, { useEffect } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { useBackend } from '../../context/BackendContext';
import { PageHeader } from '../common/PageHeader';
import { Metric } from '../common/Metric';
import { WorkspaceView } from '../layout/Sidebar';
import {
  ArrowRight,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  GitPullRequest,
  BarChart2,
  Compass,
} from 'lucide-react';

interface OverviewViewProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { activeProjectId, health } = useBackend();
  const {
    topic,
    corpus,
    landscape,
    gaps,
    contradictions,
    agentActivities,
    setSelectedGapId,
    discoveryPipeline,
    isRealCorpus,
  } = useInvestigation();

  // HARD RULE: Only display gaps that belong to the active investigation
  const activeGaps = gaps.filter(
    (gap) => !gap.investigationId || gap.investigationId === activeProjectId || gap.investigationId === topic
  );

  useEffect(() => {
    if (activeGaps.length > 0) {
      console.group(`[SciLens Gap Grounding Audit] Active Topic: "${topic}" | Active Investigation ID: "${activeProjectId}"`);
      activeGaps.forEach((g) => {
        const supportingCount = Math.max(g.supportingPaperIds?.length || 0, g.supportingPapers?.length || 0);
        console.log({
          'Gap Title': g.title,
          'Investigation ID': g.investigationId || activeProjectId,
          'Supporting Paper IDs': g.supportingPaperIds,
          'Supporting Paper Titles': g.supportingPapers,
          'Evidence Count': g.evidenceSnippets?.length || supportingCount,
          'Validation Status': g.status,
          'Confidence': `${Math.round(g.confidence * 100)}%`,
          'Source': g.source || (isRealCorpus ? (health.connected ? 'backend' : 'openalex_retrieval') : 'demo')
        });
      });
      console.groupEnd();
    }
  }, [activeGaps, topic, activeProjectId, isRealCorpus, health.connected]);

  const validatedGapsCount = activeGaps.filter(
    (g) => (g.status === 'Validated' || g.status === 'Validated Gap' || (g.status as string) === 'SUPPORTED') &&
           Math.max(g.supportingPaperIds?.length || 0, g.supportingPapers?.length || 0) > 0
  ).length;
  const latestActivity = agentActivities[agentActivities.length - 1] || {
    agentName: 'Literature Discovery Agent',
    timestamp: 'Just now',
    action: `Indexing literature for ${topic}`,
    details: 'Harvesting scholarly evidence records.',
  };

  const PROGRESS_STAGES = [
    'Searching literature...',
    'Extracting evidence...',
    'Detecting research gaps...',
    'Validating findings...',
  ] as const;

  const currentStageIndex = (() => {
    const s = (discoveryPipeline.stage || '').toLowerCase();
    if (s.includes('validat') || s.includes('critic')) return 3;
    if (s.includes('gap')) return 2;
    if (s.includes('extract') || s.includes('evidence') || s.includes('analyz') || s.includes('landscape')) return 1;
    return 0;
  })();

  if (discoveryPipeline.isDiscovering) {
    return (
      <div className="space-y-8 max-w-6xl pb-16">
        <PageHeader
          label="RESEARCH COMMAND CENTER"
          title="Investigation"
          italicWord="Overview"
          description="Comprehensive intelligence snapshot synthesizing core literature, semantic clusters, validated gaps, and ongoing agent iterations."
        />

        {/* Active Research Domain Header Card */}
        <div className="p-6 bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500 block mb-1">
                ACTIVE RESEARCH DOMAIN
              </span>
              <h2 className="font-serif text-xl md:text-2xl font-bold text-scilens-navy dark:text-white">
                {topic}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-scilens-teal dark:text-scilens-glowteal font-semibold border border-teal-500/20">
                Active Investigation
              </span>
            </div>
          </div>
        </div>

        {/* Simple Research Progress State */}
        <div className="p-6 bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-scilens-teal animate-pulse" />
              <span className="font-mono text-xs tracking-wider uppercase font-semibold text-scilens-navy dark:text-white">
                RESEARCH ANALYSIS IN PROGRESS
              </span>
            </div>
            <div className="text-xs font-mono text-scilens-teal dark:text-scilens-glowteal font-semibold">
              {discoveryPipeline.candidatesFound > 0
                ? `${discoveryPipeline.candidatesFound} candidates retrieved`
                : 'Searching research corpus...'}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {PROGRESS_STAGES.map((stageLabel, idx) => {
              const isCompleted = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;

              return (
                <div
                  key={stageLabel}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-sans transition-colors ${
                    isCurrent
                      ? 'border-scilens-teal/40 bg-teal-50/40 dark:bg-teal-950/20 text-scilens-navy dark:text-white font-semibold'
                      : isCompleted
                      ? 'border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 text-slate-700 dark:text-slate-300'
                      : 'border-slate-100 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 opacity-60'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-scilens-teal dark:bg-scilens-glowteal animate-pulse shrink-0 ml-1 mr-1" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 ml-1 mr-1" />
                  )}
                  <span>{stageLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      <PageHeader
        label="RESEARCH COMMAND CENTER"
        title="Investigation"
        italicWord="Overview"
        description="Comprehensive intelligence snapshot synthesizing core literature, semantic clusters, validated gaps, and ongoing agent iterations."
        actions={
          <button
            onClick={() => onNavigate('gaps')}
            className="px-4 py-2 rounded-xl bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-sm shadow-scilens-teal/20"
          >
            <span>Explore Gaps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      />

      {/* Active Research Domain Header Card */}
      <div className="p-6 bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500 block mb-1">
              ACTIVE RESEARCH DOMAIN
            </span>
            <h2 className="font-serif text-xl md:text-2xl font-bold text-scilens-navy dark:text-white">
              {topic}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-scilens-teal dark:text-scilens-glowteal font-semibold border border-teal-500/20">
              Active Investigation
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-50 dark:bg-[#070D1E] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
              2020 – 2025
            </span>
          </div>
        </div>

        {/* Quick Stats Grid with Icons matching the reference style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-1">
          <Metric
            label="Papers Analyzed"
            value={corpus.length}
            subtext="Indexed in corpus"
            icon={<BookOpen className="w-4 h-4" />}
            trend={{ direction: 'up', text: `+${corpus.length} active` }}
          />
          <Metric
            label="Themes Mapped"
            value={landscape?.themes?.length || 0}
            subtext="Dense clusters"
            icon={<Layers className="w-4 h-4" />}
          />
          <Metric
            label="Candidate Gaps"
            value={gaps.length}
            subtext="Identified voids"
            icon={<Sparkles className="w-4 h-4" />}
          />
          <Metric
            label="Validated Gaps"
            value={validatedGapsCount}
            subtext="Adversarial verified"
            icon={<CheckCircle2 className="w-4 h-4" />}
            trend={{ direction: 'up', text: `${validatedGapsCount} verified` }}
          />
          <Metric
            label="Contradictions"
            value={contradictions.length}
            subtext="Direct divergences"
            icon={<GitPullRequest className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Top Validated Research Gaps */}
          <div className="bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-scilens-navy dark:text-white">
                  Top Validated Research Gaps
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Surviving adversarial counter-search and evidence criticism
                </p>
              </div>
              <button
                onClick={() => onNavigate('gaps')}
                className="text-xs font-mono text-scilens-teal dark:text-scilens-glowteal hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View all ({activeGaps.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {activeGaps.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  Insufficient evidence to identify a validated gap for this investigation.
                </div>
              ) : (
                activeGaps.slice(0, 3).map((gap) => {
                  const paperCount = Math.max(gap.supportingPaperIds?.length || 0, gap.supportingPapers?.length || 0);
                  // HARD RULE: If supporting paper count is 0, status can NEVER be VERIFIED
                  const isVerified = (gap.status === 'Validated' || gap.status === 'Validated Gap' || (gap.status as string) === 'SUPPORTED') && paperCount > 0;
                  const displayStatus = paperCount === 0 ? 'INSUFFICIENT EVIDENCE' : isVerified ? 'VERIFIED' : gap.status.toUpperCase();
                  const statusColorClass = paperCount === 0
                    ? 'text-zinc-500 dark:text-zinc-400'
                    : isVerified
                    ? 'text-scilens-teal dark:text-scilens-glowteal'
                    : 'text-amber-600 dark:text-amber-400';

                  return (
                    <div
                      key={gap.id}
                      onClick={() => {
                        setSelectedGapId(gap.id);
                        onNavigate('gap_investigator');
                      }}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-scilens-teal hover:shadow-xs transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-scilens-teal dark:text-scilens-glowteal font-semibold uppercase border border-teal-500/20">
                          {gap.gapType} GAP
                        </span>
                        <span className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${statusColorClass}`}>
                          <span>{displayStatus} ({Math.round(gap.confidence * 100)}%)</span>
                        </span>
                      </div>

                      <h4 className="font-serif text-base font-semibold text-scilens-navy dark:text-white group-hover:text-scilens-teal transition-colors">
                        {gap.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {gap.description}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60">
                        <span>Supporting: {paperCount} {paperCount === 1 ? 'paper' : 'papers'}</span>
                        <span className="group-hover:translate-x-0.5 transition-transform text-scilens-teal dark:text-scilens-glowteal flex items-center gap-1 font-sans font-medium">
                          Investigate timeline →
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Presentation-Ready Methodology Breakdown Bar Chart */}
          <div className="bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-scilens-navy dark:text-white">
                  Methodology Landscape Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribution of research paradigms across active corpus
                </p>
              </div>
              <button
                onClick={() => onNavigate('landscape')}
                className="text-xs font-mono text-scilens-teal dark:text-scilens-glowteal hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Cartography map →</span>
              </button>
            </div>

            <div className="space-y-3.5 pt-2">
              {(() => {
                const dist = landscape?.methodologyDistribution || (landscape as any)?.methodology_distribution || {};
                const entries = Object.entries(dist);
                if (entries.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3 font-sans">
                      Synthesizing methodology distributions from indexed corpus...
                    </p>
                  );
                }
                return entries.map(([method, count], idx) => {
                  const numCount = typeof count === 'number' ? count : 1;
                  const total = corpus.length || 1;
                  const percentage = Math.round((numCount / total) * 100);
                  return (
                    <div key={idx} className="space-y-1.5 group">
                      <div className="flex justify-between text-xs font-sans text-scilens-navy dark:text-white">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{method}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                            {numCount} {numCount === 1 ? 'paper' : 'papers'}
                          </span>
                          <span className="font-mono text-xs font-bold text-scilens-teal dark:text-scilens-glowteal w-9 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                      {/* Modern pill bar */}
                      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800/90 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-teal-600 via-teal-500 to-teal-400 rounded-full transition-all duration-500 ease-out shadow-xs"
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Agent Activity Box */}
          <div className="bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h3 className="font-serif text-base font-bold text-scilens-navy dark:text-white">
                Agentic Pipeline Activity
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-scilens-teal animate-pulse" />
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="p-3.5 bg-slate-50/70 dark:bg-[#070D1E] rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span className="text-scilens-teal dark:text-scilens-glowteal font-semibold">
                    {latestActivity.agentName}
                  </span>
                  <span>{latestActivity.timestamp}</span>
                </div>
                <p className="font-medium text-scilens-navy dark:text-white leading-snug">
                  {latestActivity.action}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-light">
                  {latestActivity.details}
                </p>
              </div>

              <button
                onClick={() => onNavigate('agent_activity')}
                className="w-full py-2.5 text-center text-xs font-mono text-scilens-teal dark:text-scilens-glowteal hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors block font-semibold"
              >
                View full agent execution log →
              </button>
            </div>
          </div>

          {/* Next Recommended Actions */}
          <div className="bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-scilens-navy dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3">
              Next Recommended Actions
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('gap_investigator')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-scilens-teal hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-xs text-scilens-navy dark:text-white block group-hover:text-scilens-teal dark:group-hover:text-scilens-glowteal">
                    Inspect Gap Disproof Loop
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Review adversarial literature search
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-scilens-teal group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('development')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-scilens-teal hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-xs text-scilens-navy dark:text-white block group-hover:text-scilens-teal dark:group-hover:text-scilens-glowteal">
                    Develop Research Framework
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Formulate hypotheses &amp; objectives
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-scilens-teal group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('draft_builder')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-scilens-teal hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-xs text-scilens-navy dark:text-white block group-hover:text-scilens-teal dark:group-hover:text-scilens-glowteal">
                    Build Proposal Draft
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Generate citations &amp; review modes
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-scilens-teal group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
