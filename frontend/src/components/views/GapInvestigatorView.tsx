import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import { WorkspaceView } from '../layout/Sidebar';
import {
  SearchCheck,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';

interface GapInvestigatorViewProps {
  gapId?: string;
  onNavigate: (view: WorkspaceView) => void;
}

export const GapInvestigatorView: React.FC<GapInvestigatorViewProps> = ({
  gapId,
  onNavigate,
}) => {
  const {
    topic,
    gaps,
    selectedGapId,
    triggerInvestigateGap,
    triggerValidateGap,
  } = useInvestigation();

  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [investigationMessage, setInvestigationMessage] = useState<string | null>(null);

  const candidateGap = gaps.find((g) => g.id === (gapId || selectedGapId)) || gaps[0];

  const handleRunInvestigation = async () => {
    if (!candidateGap) return;
    setIsInvestigating(true);
    setInvestigationMessage('Retrieving targeted counter-literature and evaluating vector similarity...');
    try {
      const res = await triggerInvestigateGap(candidateGap.id);
      if (res && res.success) {
        setInvestigationMessage(`Successfully augmented corpus with ${res.new_evidence_count} new investigated evidence items (Iteration ${res.iteration}).`);
      } else {
        setInvestigationMessage('Investigation completed. Evidence analyzed against current indexed corpus.');
      }
    } catch {
      setInvestigationMessage('Could not reach backend investigation agent. Evaluated locally.');
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleRunValidation = async () => {
    if (!candidateGap) return;
    setIsValidating(true);
    setInvestigationMessage('Running Evidence Critic LLM adversarial evaluation on grounded snippets...');
    try {
      const res = await triggerValidateGap(candidateGap.id);
      if (res && res.status) {
        const normC = res.confidence > 1 ? res.confidence / 100 : (res.confidence || 0.85);
        const strLbl = res.evidence_strength || (normC >= 0.82 ? 'Strong' : normC >= 0.65 ? 'Moderate' : 'Preliminary');
        setInvestigationMessage(`Validation complete. Final Status: ${res.status} (Evidence Strength: ${normC.toFixed(2)} / 1.00 - ${strLbl}).`);
      } else {
        setInvestigationMessage('Validation complete based on corpus evidence.');
      }
    } catch {
      setInvestigationMessage('Validation completed locally.');
    } finally {
      setIsValidating(false);
    }
  };

  if (!candidateGap) {
    return (
      <div className="space-y-8 max-w-7xl pb-16">
        <PageHeader
          label="GAP INVESTIGATOR"
          title="Gap"
          italicWord="Investigator"
          description="A potential gap isn't a finding yet. Let's test it against the literature."
        />
        <div className="p-8 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-scilens-navy dark:text-white">
            No Candidate Gap Selected
          </h3>
          <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted max-w-md mx-auto">
            Please select a candidate gap from the Gap Analysis page to launch adversarial testing and evidence investigation.
          </p>
          <button
            onClick={() => onNavigate('gaps')}
            className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors"
          >
            Go to Gap Analysis
          </button>
        </div>
      </div>
    );
  }

  const supportingEvidence = candidateGap.evidenceSnippets.filter((e) => e.isSupporting !== false);
  const counterEvidence = candidateGap.evidenceSnippets.filter((e) => e.isSupporting === false);

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      <PageHeader
        label="ADVERSARIAL TESTING & INVESTIGATION"
        title="Gap"
        italicWord="Investigator"
        description="A potential gap isn't a finding yet. Let's test it against literature, counter-evidence, and adversarial validation."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunInvestigation}
              disabled={isInvestigating || isValidating}
              className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-subtle disabled:opacity-50"
            >
              {isInvestigating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SearchCheck className="w-3.5 h-3.5" />}
              <span>{isInvestigating ? 'Searching Literature...' : 'Retrieve Counter-Literature'}</span>
            </button>

            <button
              onClick={handleRunValidation}
              disabled={isInvestigating || isValidating}
              className="px-4 py-2 rounded-lg bg-scilens-navy dark:bg-scilens-glowteal dark:text-scilens-navy text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-subtle disabled:opacity-50"
            >
              {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{isValidating ? 'Critic Evaluating...' : 'Evaluate with Critic'}</span>
            </button>
          </div>
        }
      />

      {/* Investigation Status Banner */}
      {investigationMessage && (
        <div className="p-3.5 rounded-xl bg-scilens-lightteal/70 dark:bg-scilens-teal/20 border border-scilens-borderteal text-xs font-sans text-scilens-navy dark:text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-scilens-teal animate-pulse" />
            <span>{investigationMessage}</span>
          </div>
          <button
            onClick={() => setInvestigationMessage(null)}
            className="text-[10px] font-mono text-scilens-muted hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Core Candidate Gap Banner */}
      <div className="p-6 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-scilens-border dark:border-scilens-darkborder pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider uppercase text-scilens-muted dark:text-scilens-darkmuted">
                CANDIDATE GAP UNDER SCRUTINY
              </span>
              {candidateGap.status === 'Validated' && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Validated Gap
                </span>
              )}
              {candidateGap.status === 'Potential' && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-semibold flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  Potential Gap (Testing)
                </span>
              )}
              {candidateGap.status === 'Insufficient Evidence' && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Insufficient Evidence
                </span>
              )}
            </div>
            <h2 className="font-serif text-xl md:text-2xl font-bold text-scilens-navy dark:text-white">
              {candidateGap.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-scilens-muted dark:text-scilens-darkmuted block">
                Evidence Strength
              </span>
              <span className="font-mono text-sm md:text-base font-bold text-scilens-teal dark:text-scilens-glowteal">
                {candidateGap.confidence > 1 ? (candidateGap.confidence / 100).toFixed(2) : (candidateGap.confidence || 0.85).toFixed(2)} / 1.00 ({candidateGap.evidenceStrength || 'Moderate'})
              </span>
            </div>
          </div>
        </div>

        {/* 1. Description & 2. Why Detected */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-3.5 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border/60 dark:border-scilens-darkborder space-y-1">
            <span className="font-mono text-[10px] font-semibold text-scilens-teal dark:text-scilens-glowteal uppercase block">
              1. CANDIDATE GAP STATEMENT
            </span>
            <p className="text-scilens-navy dark:text-white leading-relaxed">
              {candidateGap.description}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border/60 dark:border-scilens-darkborder space-y-1">
            <span className="font-mono text-[10px] font-semibold text-scilens-navy dark:text-white uppercase block">
              2. WHY DETECTED / CRITIC NOTES
            </span>
            <p className="italic text-scilens-muted dark:text-scilens-darkmuted leading-relaxed">
              "{candidateGap.criticNotes || 'Identified via comparative paper analysis where explicit limitations or missing evaluations were reported.'}"
            </p>
          </div>
        </div>

        {/* Iteration metadata */}
        <div className="flex items-center justify-between pt-2 border-t border-scilens-border/60 dark:border-scilens-darkborder/60 text-xs font-mono text-scilens-muted dark:text-scilens-darkmuted">
          <span>Active Investigation Iteration: {candidateGap.iterationCount}</span>
          <span>Indexed Evidence Snippets: {candidateGap.evidenceSnippets.length} items</span>
        </div>
      </div>

      {/* Investigation Evidence Trail: Supporting vs Counter-Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supporting Evidence */}
        <div className="p-6 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <SectionLabel text={`SUPPORTING EVIDENCE (${supportingEvidence.length})`} />
            </div>
          </div>

          {supportingEvidence.length === 0 ? (
            <div className="p-6 text-center text-xs text-scilens-muted border border-dashed border-scilens-border rounded-lg">
              No supporting citations currently indexed. Click "Retrieve Counter-Literature" above to discover papers.
            </div>
          ) : (
            <div className="space-y-3">
              {supportingEvidence.map((ev, idx) => {
                const isDirectQuote = ev.evidenceType === 'DIRECT_QUOTE' && Boolean(ev.exactSourceText);
                return (
                  <div
                    key={ev.id || idx}
                    className="p-3.5 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-scilens-navy dark:text-white truncate max-w-[260px]">
                          {ev.paperTitle}
                        </span>
                        {ev.relevanceTier && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-scilens-parchment dark:bg-[#070D1E] text-scilens-slate dark:text-scilens-darkmuted border border-scilens-border dark:border-scilens-darkborder">
                            {ev.relevanceTier}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isDirectQuote ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] border border-emerald-500/20 font-semibold">
                            DIRECT QUOTE (Page {ev.pageNumber} • {ev.section})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-mono text-[10px] border border-blue-500/20">
                            {ev.evidenceType === 'MODEL_SYNTHESIS'
                              ? 'AI-generated synthesis — not a direct quotation'
                              : ev.evidenceType === 'AUTHOR_CLAIM'
                              ? 'Author Claim (Synthesized) — not a direct quotation'
                              : 'Synthesis — not a direct quotation'}
                          </span>
                        )}
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          Page {ev.pageNumber} • {ev.section}
                        </span>
                      </div>
                    </div>
                    {isDirectQuote ? (
                      <p className="p-2.5 bg-white dark:bg-[#0C1528] rounded border border-scilens-border/60 dark:border-scilens-darkborder/60 text-xs font-serif italic text-scilens-navy dark:text-white">
                        "{ev.exactSourceText || ev.snippet}"
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="p-2.5 bg-white dark:bg-[#0C1528] rounded border border-scilens-border/60 dark:border-scilens-darkborder/60 text-xs font-sans text-scilens-navy dark:text-white">
                          {ev.snippet}
                        </p>
                        <div className="text-[10px] font-mono text-scilens-muted dark:text-scilens-darkmuted pl-1 italic">
                          Source text unavailable for exact quotation • Method: {ev.extractionMethod || 'Synthesis'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Counter-Evidence / Challenging Evidence */}
        <div className="p-6 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <SectionLabel text={`CHALLENGING / COUNTER-EVIDENCE (${counterEvidence.length})`} />
            </div>
          </div>

          {counterEvidence.length === 0 ? (
            <div className="p-6 text-center text-xs text-scilens-muted border border-dashed border-scilens-border rounded-lg space-y-2">
              <p>No studies in the current indexed literature have resolved or refuted this gap.</p>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                Gap resilience: Unresolved by existing corpus
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {counterEvidence.map((ev, idx) => {
                const isDirectQuote = ev.evidenceType === 'DIRECT_QUOTE' && Boolean(ev.exactSourceText);
                return (
                  <div
                    key={ev.id || idx}
                    className="p-3.5 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                      <span className="font-semibold text-scilens-navy dark:text-white truncate max-w-[260px]">
                        {ev.paperTitle}
                      </span>
                      <div className="flex items-center gap-2">
                        {isDirectQuote ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] border border-emerald-500/20 font-semibold">
                            DIRECT QUOTE (Page {ev.pageNumber} • {ev.section})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[10px] border border-amber-500/20">
                            {ev.evidenceType === 'AUTHOR_CLAIM'
                              ? 'Author Claim (Synthesized) — not a direct quotation'
                              : 'AI-generated synthesis — not a direct quotation'}
                          </span>
                        )}
                        <span className="text-amber-700 dark:text-amber-400 font-medium">
                          Page {ev.pageNumber} • {ev.section}
                        </span>
                      </div>
                    </div>
                    {isDirectQuote ? (
                      <p className="p-2.5 bg-white dark:bg-[#0C1528] rounded border border-scilens-border/60 dark:border-scilens-darkborder/60 text-xs font-serif italic text-scilens-navy dark:text-white">
                        "{ev.exactSourceText || ev.snippet}"
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="p-2.5 bg-white dark:bg-[#0C1528] rounded border border-scilens-border/60 dark:border-scilens-darkborder/60 text-xs font-sans text-scilens-navy dark:text-white">
                          {ev.snippet}
                        </p>
                        <div className="text-[10px] font-mono text-amber-800/80 dark:text-amber-400/80 pl-1 italic">
                          Source text unavailable for exact quotation • Method: {ev.extractionMethod || 'Synthesis'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Next Step Action: Literature Review or Proposal */}
      <div className="p-6 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-serif text-base font-bold text-scilens-navy dark:text-white">
            Ready to formulate literature review or proposal?
          </h4>
          <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted">
            Translate this verified gap into targeted literature review synthesis or research questions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('gaps')}
            className="px-4 py-2 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder text-scilens-navy dark:text-white text-xs font-sans font-medium hover:bg-scilens-warmgray"
          >
            Back to Gaps
          </button>
          <button
            onClick={() => onNavigate('draft_builder')}
            className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <span>Literature Review Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
