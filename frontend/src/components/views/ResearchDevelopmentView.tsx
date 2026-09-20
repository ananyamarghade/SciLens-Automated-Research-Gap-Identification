import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import { WorkspaceView } from '../layout/Sidebar';
import {
  Lightbulb,
  FileEdit,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Target,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ResearchDevelopmentViewProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const ResearchDevelopmentView: React.FC<ResearchDevelopmentViewProps> = ({
  onNavigate,
}) => {
  const { topic, development, corpus, gaps } = useInvestigation();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
    }, 1000);
  };

  const primaryAuthor = corpus[0]?.authors[0] || 'Scholarly Corpus';
  const primaryYear = corpus[0]?.year || 2024;

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      <PageHeader
        label="PROPOSAL SYNTHESIS ENGINE"
        title="Research"
        italicWord="Development"
        description={`Transform validated literature voids into publication-grade research questions, operationalized objectives, and testable hypotheses for "${topic}".`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-3.5 py-2 rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard text-scilens-navy dark:text-white text-xs font-sans font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5 text-scilens-teal', isRegenerating && 'animate-spin')} />
              <span>{isRegenerating ? 'Refining with Critic...' : 'Refine Formulations'}</span>
            </button>

            <button
              onClick={() => onNavigate('draft_builder')}
              className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-subtle"
            >
              <span>Build Manuscript Draft</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {/* 1. Research Questions (RQs) */}
      <div className="p-6 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-scilens-border dark:border-scilens-darkborder pb-3">
          <div>
            <SectionLabel text="FORMULATED RESEARCH QUESTIONS" />
            <h3 className="font-serif text-lg font-bold text-scilens-navy dark:text-white mt-1">
              Primary &amp; Secondary Inquiry Formulations
            </h3>
          </div>
          <span className="text-[11px] font-mono text-scilens-teal dark:text-scilens-glowteal font-medium">
            Grounded in {primaryAuthor} ({primaryYear}) &amp; {gaps.length} Active Gaps
          </span>
        </div>

        <div className="space-y-4 pt-2">
          {development.researchQuestions.map((rq, idx) => (
            <div
              key={rq.id}
              className={clsx(
                'p-4 rounded-xl border space-y-2',
                idx === 0
                  ? 'bg-scilens-lightteal/30 dark:bg-scilens-teal/10 border-scilens-borderteal'
                  : 'bg-scilens-ivory dark:bg-[#070D1E] border-scilens-border dark:border-scilens-darkborder'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    'text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase',
                    idx === 0
                      ? 'bg-scilens-teal text-white'
                      : 'bg-scilens-warmgray dark:bg-scilens-darkcard text-scilens-muted dark:text-scilens-darkmuted'
                  )}
                >
                  {idx === 0 ? 'PRIMARY RESEARCH QUESTION (RQ1)' : `SECONDARY QUESTION (RQ${idx + 1})`}
                </span>
                <span className="text-[10px] font-mono text-scilens-muted dark:text-scilens-darkmuted">
                  Novelty Index: 96%
                </span>
              </div>

              <p className="font-serif text-base font-bold text-scilens-navy dark:text-white leading-relaxed">
                "{rq.question}"
              </p>

              <p className="text-xs font-sans text-scilens-muted dark:text-scilens-darkmuted leading-relaxed">
                <strong className="text-scilens-navy dark:text-white font-medium">Theoretical Rationale:</strong> {rq.rationale}
              </p>

              <div className="text-[11px] font-mono text-scilens-teal dark:text-scilens-glowteal pt-1">
                Suggested Methodology: {rq.suggestedMethodology}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Objectives & Hypotheses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-scilens-teal" />
            <SectionLabel text="OPERATIONALIZED OBJECTIVES" />
          </div>

          <div className="space-y-3">
            {development.studyObjectives.map((obj, i) => (
              <div
                key={obj.id}
                className="p-4 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-scilens-navy dark:bg-scilens-teal text-white text-xs font-mono flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-scilens-navy dark:text-white">
                    {obj.objective}
                  </h4>
                </div>
                <p className="text-xs font-sans text-scilens-muted dark:text-scilens-darkmuted pl-7">
                  <strong className="text-scilens-navy dark:text-white font-medium">Milestone:</strong> {obj.milestone}
                </p>
                <p className="text-[11px] font-mono text-scilens-teal dark:text-scilens-glowteal pl-7">
                  Target Metric: {obj.targetMetric}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-scilens-teal" />
            <SectionLabel text="TESTABLE HYPOTHESES" />
          </div>

          <div className="space-y-3">
            {development.hypotheses.map((hyp, i) => (
              <div
                key={hyp.id}
                className="p-4 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-scilens-teal dark:text-scilens-glowteal">
                    H{i + 1}: Null &amp; Alternative Formulation
                  </span>
                </div>
                <p className="text-xs font-serif font-bold text-scilens-navy dark:text-white italic">
                  "{hyp.statement}"
                </p>
                <div className="text-[11px] font-sans text-scilens-muted dark:text-scilens-darkmuted space-y-0.5 pt-1 border-t border-scilens-border/60 dark:border-scilens-darkborder/60">
                  <div>
                    <strong className="text-scilens-navy dark:text-white">Independent:</strong> {hyp.independentVars.join(', ')}
                  </div>
                  <div>
                    <strong className="text-scilens-navy dark:text-white">Dependent:</strong> {hyp.dependentVars.join(', ')}
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-1">
                    Falsification: {hyp.falsificationCondition}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Methodological Roadmap */}
      <div className="p-6 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle space-y-4">
        <SectionLabel text="METHODOLOGICAL ROADMAP" />
        <h3 className="font-serif text-lg font-bold text-scilens-navy dark:text-white">
          Experimental Phases &amp; Validation Deliverables
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {development.methodologicalRoadmap.map((phase, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-scilens-navy dark:bg-scilens-teal text-white font-medium">
                  {phase.phase}
                </span>
                <span className="text-[10px] font-mono text-scilens-muted dark:text-scilens-darkmuted">
                  {phase.duration}
                </span>
              </div>
              <h4 className="font-serif text-sm font-semibold text-scilens-navy dark:text-white">
                {phase.title}
              </h4>
              <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted leading-relaxed">
                {phase.description}
              </p>
              <div className="pt-2 border-t border-scilens-border/40 dark:border-scilens-darkborder/40 text-[11px] font-mono text-scilens-teal dark:text-scilens-glowteal space-y-0.5">
                {phase.deliverables.map((d, i) => (
                  <div key={i}>• {d}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
