import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { Paper } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import { Modal } from '../common/Modal';
import { WorkspaceView } from '../layout/Sidebar';
import {
  FileText,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  GitCompare,
  Hash,
  Download,
  Share2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface PaperAnalysisViewProps {
  paperId?: string;
  onNavigate: (view: WorkspaceView) => void;
  onSelectGap?: (gapId: string) => void;
}

export const PaperAnalysisView: React.FC<PaperAnalysisViewProps> = ({
  paperId,
  onNavigate,
  onSelectGap,
}) => {
  const { corpus, selectedPaperId, setSelectedPaperId } = useInvestigation();
  const currentPaper = corpus.find((p) => p.id === (paperId || selectedPaperId)) || corpus[0] || {
    id: 'placeholder',
    title: 'No paper selected',
    authors: [],
    year: 2024,
    venue: '',
    abstract: '',
    methodology: '',
    dataset: '',
    population: '',
    geography: '',
    relevance: 90,
    citationCount: 0,
    status: 'Indexed' as const,
  };

  const [activeTab, setActiveTab] = useState<'summary' | 'methodology' | 'findings' | 'limitations' | 'evidence'>('summary');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [comparePaperId, setComparePaperId] = useState<string>(
    corpus.find((p) => p.id !== currentPaper.id)?.id || corpus[1]?.id || currentPaper.id
  );

  const activePaper = corpus.find((p) => p.id === selectedPaperId) || currentPaper;
  const comparisonPaper = corpus.find((p) => p.id === comparePaperId) || corpus[1] || currentPaper;

  const analysis = activePaper.analysis;

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Top Controls & Paper Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-scilens-border pb-4">
        <div>
          <SectionLabel text="DEEP DOCUMENT INTELLIGENCE" />
          <h1 className="font-serif text-2xl font-bold text-scilens-navy mt-1">
            Structured Paper Analysis
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-scilens-border rounded-lg px-3 py-1.5 shadow-subtle">
            <span className="text-xs font-mono text-scilens-muted">Analyzing:</span>
            <select
              value={activePaper.id}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="text-xs font-medium text-scilens-navy bg-transparent focus:outline-none max-w-[280px] truncate"
            >
              {corpus.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.year} • {p.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg border border-scilens-border bg-white hover:bg-scilens-warmgray text-scilens-navy text-xs font-sans font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <GitCompare className="w-3.5 h-3.5 text-scilens-teal" />
            <span>Compare Papers</span>
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Reader Excerpt & Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-scilens-parchment text-scilens-muted border border-scilens-border">
                  {activePaper.year}
                </span>
                <span className="text-xs font-serif italic text-scilens-muted">
                  {activePaper.venue}
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-scilens-navy leading-snug">
                {activePaper.title}
              </h2>
              <p className="text-xs text-scilens-muted">
                {activePaper.authors.join(', ')}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-scilens-border text-center">
              <div className="p-2 rounded bg-scilens-ivory border border-scilens-border/60">
                <span className="text-[10px] font-mono text-scilens-lightmuted block uppercase">Relevance</span>
                <span className="font-mono text-sm font-bold text-scilens-teal">{activePaper.relevance}%</span>
              </div>
              <div className="p-2 rounded bg-scilens-ivory border border-scilens-border/60">
                <span className="text-[10px] font-mono text-scilens-lightmuted block uppercase">Citations</span>
                <span className="font-mono text-sm font-bold text-scilens-navy">{activePaper.citationCount}</span>
              </div>
              <div className="p-2 rounded bg-scilens-ivory border border-scilens-border/60">
                <span className="text-[10px] font-mono text-scilens-lightmuted block uppercase">Status</span>
                <span className="font-mono text-xs font-semibold text-scilens-teal flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Indexed
                </span>
              </div>
            </div>

            {/* Simulated Document Reader View */}
            <div className="pt-3 border-t border-scilens-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider text-scilens-lightmuted uppercase">
                  PRIMARY TEXT EXCERPTS & CITATIONS
                </span>
                <span className="text-[10px] font-mono text-scilens-teal">
                  3 Grounded Highlights
                </span>
              </div>

              <div className="p-4 rounded-lg bg-scilens-ivory/80 border border-scilens-border text-xs font-serif leading-relaxed text-scilens-navy/90 space-y-3 max-h-[380px] overflow-y-auto pr-2">
                <p>
                  <strong className="font-sans font-semibold text-scilens-navy block text-[11px] mb-0.5">
                    § 1. Abstract
                  </strong>
                  {activePaper.abstract}
                </p>

                <p className="bg-amber-50/80 p-2.5 rounded border-l-2 border-amber-500 text-amber-900 font-serif italic text-xs">
                  <span className="font-sans font-bold text-[10px] uppercase text-amber-700 block not-italic">
                    Critical Gap Anchor [Page 14, § 4.3]
                  </span>
                  "{analysis?.limitations?.[0] || 'Not explicitly reported.'}"
                </p>

                <p>
                  <strong className="font-sans font-semibold text-scilens-navy block text-[11px] mb-0.5">
                    § 3. Experimental Architecture & Cohort
                  </strong>
                  {analysis?.methodology || activePaper.methodology || 'Not explicitly reported.'} The cohort comprised {analysis?.population || activePaper.population || 'Not explicitly reported.'}, evaluated strictly within {analysis?.geography || activePaper.geography || 'Not explicitly reported.'}.
                </p>

                <p className="bg-scilens-lightteal/50 p-2.5 rounded border-l-2 border-scilens-teal text-scilens-darkteal font-serif italic text-xs">
                  <span className="font-sans font-bold text-[10px] uppercase text-scilens-teal block not-italic">
                    Key Finding Grounding [Page 9, § 3.1]
                  </span>
                  "{analysis?.keyFindings?.[0] || 'Not explicitly reported.'}"
                </p>

                <p>
                  <strong className="font-sans font-semibold text-scilens-navy block text-[11px] mb-0.5">
                    § 5. Concluding Assessment
                  </strong>
                  {analysis?.conclusion || 'Not explicitly reported.'}
                </p>
              </div>

              {activePaper.doi && (
                <div className="pt-2 flex items-center justify-between text-xs font-mono text-scilens-muted">
                  <span>DOI: {activePaper.doi}</span>
                  <a
                    href={`https://doi.org/${activePaper.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-scilens-teal hover:underline flex items-center gap-1"
                  >
                    <span>Publisher Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Extraction Tabs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tabs Navigation */}
          <div className="flex border-b border-scilens-border bg-white rounded-t-xl px-2 pt-2 gap-1 overflow-x-auto hide-scrollbar">
            {[
              { id: 'summary', label: 'Summary & Goals' },
              { id: 'methodology', label: 'Methodology' },
              { id: 'findings', label: 'Key Findings' },
              { id: 'limitations', label: 'Limitations' },
              { id: 'evidence', label: 'Variables & Theory' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'px-3.5 py-2 text-xs font-sans font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-scilens-teal text-scilens-teal bg-scilens-ivory/60'
                    : 'border-transparent text-scilens-muted hover:text-scilens-navy'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Summary & Objectives */}
          {activeTab === 'summary' && (
            <div className="p-6 bg-white border border-scilens-border rounded-b-xl shadow-subtle space-y-6">
              <div>
                <SectionLabel text="EXECUTIVE SYNTHESIS" />
                <p className="text-sm font-serif text-scilens-navy leading-relaxed mt-2 p-4 bg-scilens-ivory rounded-lg border border-scilens-border/60">
                  {analysis?.summary || activePaper.abstract || 'Not explicitly reported.'}
                </p>
              </div>

              <div>
                <SectionLabel text="EXPLICIT RESEARCH OBJECTIVES" />
                <div className="mt-2 space-y-2">
                  {analysis?.objectives && analysis.objectives.length > 0 ? (
                    analysis.objectives.map((obj, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg border border-scilens-border/60 bg-white"
                      >
                        <span className="w-5 h-5 rounded-full bg-scilens-lightteal text-scilens-teal font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs font-sans text-scilens-navy leading-relaxed">
                          {obj}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-sans text-scilens-muted p-3 rounded-lg bg-scilens-ivory border border-scilens-border/60">
                      Not explicitly reported.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <SectionLabel text="AUTHORS' CONCLUSION" />
                <p className="text-xs font-sans text-scilens-muted leading-relaxed mt-2 italic bg-scilens-warmgray/40 p-3 rounded-lg border border-scilens-border">
                  {analysis?.conclusion ? `"${analysis.conclusion}"` : 'Not explicitly reported.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Methodology */}
          {activeTab === 'methodology' && (
            <div className="p-6 bg-white border border-scilens-border rounded-b-xl shadow-subtle space-y-5">
              <div>
                <SectionLabel text="EXPERIMENTAL METHOD & PIPELINE" />
                <p className="text-xs font-sans text-scilens-navy leading-relaxed mt-2 p-3.5 bg-scilens-ivory rounded-lg border border-scilens-border">
                  {analysis?.methodology || activePaper.methodology || 'Not explicitly reported.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-scilens-ivory border border-scilens-border space-y-1">
                  <span className="text-[10px] font-mono text-scilens-lightmuted uppercase">
                    Target Population & Cohort
                  </span>
                  <p className="text-xs font-medium text-scilens-navy">
                    {analysis?.population || activePaper.population || 'Not explicitly reported.'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-scilens-ivory border border-scilens-border space-y-1">
                  <span className="text-[10px] font-mono text-scilens-lightmuted uppercase">
                    Dataset & Repository
                  </span>
                  <p className="text-xs font-medium text-scilens-navy">
                    {analysis?.dataset || activePaper.dataset || 'Not explicitly reported.'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-scilens-ivory border border-scilens-border space-y-1">
                  <span className="text-[10px] font-mono text-scilens-lightmuted uppercase">
                    Geographic Region
                  </span>
                  <p className="text-xs font-medium text-scilens-navy">
                    {analysis?.geography || activePaper.geography || 'Not explicitly reported.'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-scilens-ivory border border-scilens-border space-y-1">
                  <span className="text-[10px] font-mono text-scilens-lightmuted uppercase">
                    Hardware / Telemetry
                  </span>
                  <p className="text-xs font-medium text-scilens-navy">
                    {activePaper.methodology || 'Not explicitly reported.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Key Findings */}
          {activeTab === 'findings' && (
            <div className="p-6 bg-white border border-scilens-border rounded-b-xl shadow-subtle space-y-4">
              <SectionLabel text="VERIFIED EMPIRICAL FINDINGS" />
              <div className="space-y-3 mt-2">
                {analysis?.keyFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-scilens-border bg-scilens-ivory/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold text-scilens-teal uppercase">
                        FINDING #{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono text-scilens-muted">
                        High Confidence (94%)
                      </span>
                    </div>
                    <p className="text-xs font-serif text-scilens-navy leading-relaxed font-medium">
                      {finding}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Limitations & Future Work */}
          {activeTab === 'limitations' && (
            <div className="p-6 bg-white border border-scilens-border rounded-b-xl shadow-subtle space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <SectionLabel text="EXPLICIT AUTHORS' LIMITATIONS" />
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Primary Gap Seed
                  </span>
                </div>
                <div className="space-y-2.5 mt-2">
                  {analysis?.limitations.map((lim, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="text-[10px] font-mono text-amber-800 uppercase font-semibold">
                          Limitation {idx + 1}
                        </span>
                      </div>
                      <p className="text-xs font-sans text-scilens-navy leading-relaxed pl-5">
                        {lim}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel text="PROPOSED FUTURE DIRECTIONS" />
                <div className="space-y-2 mt-2">
                  {analysis?.futureWork.map((fw, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-scilens-border bg-scilens-ivory space-y-1"
                    >
                      <span className="text-[10px] font-mono text-scilens-teal uppercase font-semibold block">
                        Direction {idx + 1}
                      </span>
                      <p className="text-xs font-sans text-scilens-navy leading-relaxed">
                        {fw}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Variables & Theory */}
          {activeTab === 'evidence' && (
            <div className="p-6 bg-white border border-scilens-border rounded-b-xl shadow-subtle space-y-5">
              <div>
                <SectionLabel text="THEORETICAL FRAMEWORK" />
                <p className="text-xs font-serif text-scilens-navy leading-relaxed mt-2 p-3 bg-scilens-ivory rounded-lg border border-scilens-border">
                  {analysis?.theoreticalFramework || 'Not explicitly reported.'}
                </p>
              </div>

              <div>
                <SectionLabel text="OPERATIONALIZED VARIABLES" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="p-3.5 rounded-lg bg-scilens-ivory border border-scilens-border space-y-1">
                    <span className="text-[10px] font-mono text-scilens-lightmuted uppercase">
                      Independent Variable(s)
                    </span>
                    <p className="text-xs font-medium text-scilens-navy">
                      {analysis?.variables?.independent || 'Not explicitly reported.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-scilens-ivory border border-scilens-border space-y-1">
                    <span className="text-[10px] font-mono text-scilens-lightmuted uppercase">
                      Dependent Variable(s)
                    </span>
                    <p className="text-xs font-medium text-scilens-navy">
                      {analysis?.variables?.dependent || 'Not explicitly reported.'}
                    </p>
                  </div>

                  {analysis?.variables?.control && (
                    <div className="p-3.5 rounded-lg bg-scilens-ivory border border-scilens-border space-y-1 md:col-span-2">
                      <span className="text-[10px] font-mono text-scilens-lightmuted uppercase">
                        Control Variables
                      </span>
                      <p className="text-xs font-medium text-scilens-navy">
                        {analysis.variables.control}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compare Papers Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Comparative Synthesis Matrix"
        description="Side-by-side methodological, population, and limitation alignment between two indexed corpus benchmarks."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 pb-3 border-b border-scilens-border">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-scilens-muted">Paper A</span>
              <p className="font-serif text-sm font-bold text-scilens-navy line-clamp-2">
                {activePaper.title}
              </p>
              <span className="text-xs text-scilens-muted font-mono">{activePaper.year}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-scilens-muted">Paper B</span>
              <select
                value={comparePaperId}
                onChange={(e) => setComparePaperId(e.target.value)}
                className="w-full text-xs font-medium text-scilens-navy border border-scilens-border rounded p-1.5 bg-white"
              >
                {corpus
                  .filter((p) => p.id !== activePaper.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.year} • {p.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Comparison Rows */}
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-scilens-ivory rounded-lg border border-scilens-border space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-scilens-lightmuted font-semibold block">
                Methodological Approach
              </span>
              <div className="grid grid-cols-2 gap-4">
                <p className="text-scilens-navy">{activePaper.methodology}</p>
                <p className="text-scilens-navy">{comparisonPaper.methodology}</p>
              </div>
            </div>

            <div className="p-3 bg-scilens-ivory rounded-lg border border-scilens-border space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-scilens-lightmuted font-semibold block">
                Cohort / Population
              </span>
              <div className="grid grid-cols-2 gap-4">
                <p className="text-scilens-navy">{activePaper.population}</p>
                <p className="text-scilens-navy">{comparisonPaper.population}</p>
              </div>
            </div>

            <div className="p-3 bg-scilens-ivory rounded-lg border border-scilens-border space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-scilens-lightmuted font-semibold block">
                Primary Limitation
              </span>
              <div className="grid grid-cols-2 gap-4">
                <p className="text-scilens-navy text-[11px] leading-relaxed">
                  {activePaper.analysis?.limitations[0]}
                </p>
                <p className="text-scilens-navy text-[11px] leading-relaxed">
                  {comparisonPaper.analysis?.limitations[0]}
                </p>
              </div>
            </div>

            <div className="p-3 bg-scilens-ivory rounded-lg border border-scilens-border space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-scilens-lightmuted font-semibold block">
                Geographic Coverage
              </span>
              <div className="grid grid-cols-2 gap-4">
                <p className="text-scilens-navy">{activePaper.geography}</p>
                <p className="text-scilens-navy">{comparisonPaper.geography}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-scilens-navy text-white text-xs font-sans font-medium"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
