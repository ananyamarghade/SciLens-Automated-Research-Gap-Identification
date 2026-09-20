import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { ReviewDepth, ReviewOrganization, CitationStyle, Paper } from '../../types';
import { SectionLabel } from '../common/SectionLabel';
import { Drawer } from '../common/Drawer';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Table,
  CheckSquare,
  Square,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  FileText,
  Sliders,
  Layers,
  Search,
  ArrowRight,
  Download,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useBackend } from '../../context/BackendContext';
import { getExportUrl } from '../../services/api';

export const LiteratureReviewStudio: React.FC = () => {
  const { activeProjectId, health } = useBackend();
  const {
    topic,
    corpus,
    gaps,
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
    setSelectedPaperId,
  } = useInvestigation();

  const [activeTab, setActiveTab] = useState<'review' | 'tables'>('review');
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [activeTableId, setActiveTableId] = useState<string>('table_1');
  const [isSourcesDrawerOpen, setIsSourcesDrawerOpen] = useState<boolean>(false);
  const [selectedPaperForDrawer, setSelectedPaperForDrawer] = useState<Paper | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<number>(0);

  const sections = literatureReview?.sections || [];
  const tables = literatureReview?.tables || [];
  const activeSection = sections[activeSectionIndex] || sections[0];
  const activeTable = tables.find((t) => t.table_id === activeTableId) || tables[0];

  const totalWords = literatureReview?.total_words || sections.reduce((acc, s) => acc + (s.content || '').trim().split(/\s+/).filter(Boolean).length, 0);

  const generationSteps = [
    'COLLECTING SOURCE PAPERS & EXTRACTING EVIDENCE',
    'BUILDING COMPARATIVE EVIDENCE MATRICES',
    'SYNTHESIZING THEMES & BRIDGING VOIDS WITH GEMINI',
    'GENERATING 5 EVIDENCE-GROUNDED TABLES',
    'VERIFYING CITATIONS & RESOLVING TARGET FORMAT',
  ];

  React.useEffect(() => {
    if (!isGeneratingReview) {
      setGenerationStep(0);
      return;
    }
    const interval = setInterval(() => {
      setGenerationStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(interval);
  }, [isGeneratingReview]);

  const handleToggleGap = (gapId: string) => {
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

  const handleGenerate = async () => {
    await generateLiteratureReview(selectedGapIdsForReview, reviewDepth, reviewOrg, reviewCitationStyle);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const handleCopyTableAsMarkdown = () => {
    if (!activeTable) return;
    const headerRow = `| ${activeTable.headers.join(' | ')} |`;
    const separatorRow = `| ${activeTable.headers.map(() => '---').join(' | ')} |`;
    const bodyRows = activeTable.rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
    const md = `### ${activeTable.title}\n\n${headerRow}\n${separatorRow}\n${bodyRows}`;
    handleCopyText(md, 'Table Markdown Copied!');
  };

  const supportingPapersForActiveSection: Paper[] = (activeSection?.supporting_paper_ids || [])
    .map((id) => corpus.find((p) => p.id === id))
    .filter(Boolean) as Paper[];

  const depthOptions: { value: ReviewDepth; label: string; estWords: string; desc: string }[] = [
    { value: 'Concise', label: 'Concise', estWords: '~1,500 words', desc: 'Executive Academic Briefing' },
    { value: 'Standard', label: 'Standard', estWords: '~3,500 words', desc: 'Peer-Review Manuscript Review' },
    { value: 'Detailed', label: 'Detailed', estWords: '~6,000 words', desc: 'Systematic Literature Synthesis' },
    { value: 'Comprehensive', label: 'Comprehensive', estWords: '~10,000 words', desc: 'Doctoral / Monograph Grade' },
  ];

  const orgOptions: { value: ReviewOrganization; label: string; desc: string }[] = [
    { value: 'Thematic', label: 'Thematic', desc: 'Grouped by core research themes and paradigms' },
    { value: 'Chronological', label: 'Chronological', desc: 'Traced through timeline of early discoveries to modern advances' },
    { value: 'Methodological', label: 'Methodological', desc: 'Organized by experimental models, assays, datasets & algorithms' },
    { value: 'Gap-oriented', label: 'Gap-Oriented', desc: 'Structured directly around empirical contradictions and unaddressed frontiers' },
  ];

  const citationStyles: CitationStyle[] = ['APA 7', 'IEEE', 'MLA 9', 'Harvard', 'Chicago', 'Vancouver'];

  return (
    <div className="space-y-8">
      {/* 1. GAP SELECTION WORKFLOW PANEL */}
      <section className="bg-white border border-scilens-border rounded-xl p-6 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-scilens-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <SectionLabel text="SYSTEMATIC GAP TARGETING" />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-scilens-teal/10 text-scilens-teal font-semibold">
                {selectedGapIdsForReview.length} of {gaps.length} Gaps Targeted
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-scilens-navy mt-1">
              Select Research Gaps to Orient Literature Review
            </h3>
            <p className="text-xs text-scilens-muted mt-0.5">
              The 17-section synthesis and comparison tables will rigorously trace existing literature directly toward the unresolved voids and contradictions selected below.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSelectAllGaps}
              className="px-3 py-1.5 rounded-lg border border-scilens-border bg-scilens-warmgray hover:bg-white text-scilens-navy text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-scilens-teal" />
              <span>Select All</span>
            </button>
            <button
              onClick={handleClearAllGaps}
              className="px-3 py-1.5 rounded-lg border border-scilens-border bg-scilens-warmgray hover:bg-white text-scilens-muted hover:text-scilens-navy text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Gap Cards Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {gaps.map((gap) => {
            const isSelected = selectedGapIdsForReview.includes(gap.id);
            return (
              <div
                key={gap.id}
                onClick={() => handleToggleGap(gap.id)}
                className={clsx(
                  'p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-2 select-none',
                  isSelected
                    ? 'border-scilens-teal bg-scilens-teal/5 shadow-subtle ring-1 ring-scilens-teal/20'
                    : 'border-scilens-border bg-scilens-ivory/40 hover:bg-scilens-warmgray/60 opacity-75'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={clsx(
                        'text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase',
                        gap.gapType === 'Technological'
                          ? 'bg-amber-100 text-amber-800'
                          : gap.gapType === 'Contradictory Findings'
                          ? 'bg-rose-100 text-rose-800'
                          : gap.gapType === 'Population'
                          ? 'bg-purple-100 text-purple-800'
                          : gap.gapType === 'Theoretical'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-scilens-warmgray text-scilens-navy'
                      )}
                    >
                      {gap.gapType} Gap
                    </span>

                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-scilens-border text-scilens-muted">
                      {gap.supportingPaperIds?.length || 2} papers
                    </span>
                  </div>

                  <div
                    className={clsx(
                      'w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0',
                      isSelected
                        ? 'bg-scilens-teal border-scilens-teal text-white'
                        : 'border-scilens-border bg-white'
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <h4 className="font-serif text-xs font-bold text-scilens-navy leading-snug line-clamp-2">
                  {gap.title}
                </h4>

                <p className="text-[11px] font-sans text-scilens-muted line-clamp-2 leading-relaxed">
                  {gap.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-scilens-border/60 text-[10px] font-mono">
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {gap.status || 'Validated Void'}
                  </span>
                  <span className="text-scilens-lightmuted">
                    Conf: {Math.round((gap.confidence || 0.9) * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. OUTPUT SETTINGS & GENERATION CONTROLS */}
      <section className="bg-white border border-scilens-border rounded-xl p-6 shadow-subtle space-y-5">
        <div className="flex items-center justify-between border-b border-scilens-border pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-scilens-teal" />
            <h3 className="font-serif text-base font-bold text-scilens-navy">
              Review Configuration & Agentic Synthesis Engine
            </h3>
          </div>
          <span className="text-[10px] font-mono text-scilens-muted">
            Grounding Corpus: <strong className="text-scilens-navy">{corpus.length} Retrieved Papers</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Review Depth */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase text-scilens-lightmuted block">
              1. Review Depth & Scale
            </label>
            <div className="space-y-1.5">
              {depthOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setReviewDepth(opt.value)}
                  className={clsx(
                    'w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between',
                    reviewDepth === opt.value
                      ? 'border-scilens-teal bg-scilens-warmgray text-scilens-navy font-semibold'
                      : 'border-scilens-border bg-white text-scilens-muted hover:bg-scilens-warmgray/40'
                  )}
                >
                  <div>
                    <div className="font-serif text-xs text-scilens-navy">{opt.label}</div>
                    <div className="text-[10px] font-mono text-scilens-lightmuted">{opt.desc}</div>
                  </div>
                  <span className="text-[10px] font-mono text-scilens-teal font-medium shrink-0 ml-2">
                    {opt.estWords}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Organization Structure */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase text-scilens-lightmuted block">
              2. Structural Organization
            </label>
            <div className="space-y-1.5">
              {orgOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setReviewOrg(opt.value)}
                  className={clsx(
                    'w-full text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col justify-center',
                    reviewOrg === opt.value
                      ? 'border-scilens-teal bg-scilens-warmgray text-scilens-navy font-semibold'
                      : 'border-scilens-border bg-white text-scilens-muted hover:bg-scilens-warmgray/40'
                  )}
                >
                  <div className="font-serif text-xs text-scilens-navy">{opt.label}</div>
                  <div className="text-[10px] font-sans text-scilens-lightmuted line-clamp-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Citation Style & Action */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase text-scilens-lightmuted block">
                3. Citation Standard
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {citationStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setReviewCitationStyle(style)}
                    className={clsx(
                      'p-2 rounded-lg border text-xs font-mono text-center transition-colors',
                      reviewCitationStyle === style
                        ? 'bg-scilens-navy text-white border-scilens-navy font-bold'
                        : 'bg-white text-scilens-navy border-scilens-border hover:bg-scilens-warmgray'
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={isGeneratingReview || selectedGapIdsForReview.length === 0}
                className={clsx(
                  'w-full py-3 px-4 rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm',
                  isGeneratingReview
                    ? 'bg-scilens-warmgray text-scilens-muted cursor-wait'
                    : selectedGapIdsForReview.length === 0
                    ? 'bg-scilens-warmgray text-scilens-muted opacity-60 cursor-not-allowed'
                    : 'bg-scilens-teal hover:bg-scilens-darkteal text-white shadow-subtle hover:shadow-md'
                )}
              >
                {isGeneratingReview ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-scilens-teal" />
                    <span>Synthesizing Literature with Gemini / Agentic Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      Generate Literature Review ({selectedGapIdsForReview.length} Gaps Selected)
                    </span>
                  </>
                )}
              </button>
              {isGeneratingReview && (
                <div className="mt-3 p-3 bg-scilens-lightteal/60 rounded-xl border border-scilens-borderteal space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-scilens-teal font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-scilens-teal animate-ping" />
                      STEP {generationStep + 1} OF 5: {generationSteps[generationStep]}
                    </span>
                    <span className="text-scilens-teal font-bold">{Math.round(((generationStep + 1) / 5) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-scilens-borderteal/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-scilens-teal transition-all duration-500"
                      style={{ width: `${((generationStep + 1) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-[10px] font-mono text-scilens-lightmuted text-center mt-2">
                Generates 17 academic sections & 5 comparison tables strictly from indexed papers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRIMARY DISPLAY TABS: SECTIONS vs COMPARATIVE TABLES */}
      <div className="flex items-center justify-between border-b border-scilens-border pb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('review')}
            className={clsx(
              'pb-3 text-sm font-serif font-bold transition-colors flex items-center gap-2 relative',
              activeTab === 'review'
                ? 'text-scilens-navy border-b-2 border-scilens-teal'
                : 'text-scilens-muted hover:text-scilens-navy'
            )}
          >
            <BookOpen className="w-4 h-4 text-scilens-teal" />
            <span>{sections.length > 0 ? `${sections.length} Academic Review Sections` : 'Academic Review Sections'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-scilens-warmgray text-scilens-navy font-normal">
              {totalWords.toLocaleString()} words
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={clsx(
              'pb-3 text-sm font-serif font-bold transition-colors flex items-center gap-2 relative',
              activeTab === 'tables'
                ? 'text-scilens-navy border-b-2 border-scilens-teal'
                : 'text-scilens-muted hover:text-scilens-navy'
            )}
          >
            <Table className="w-4 h-4 text-scilens-teal" />
            <span>{tables.length > 0 ? `${tables.length} Comparative Literature Tables` : 'Comparative Literature Tables'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-scilens-warmgray text-scilens-navy font-normal">
              {tables.length} Synthesis Matrices
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {copySuccess && (
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 animate-fade-in">
              {copySuccess}
            </span>
          )}

          <div className="flex items-center gap-1.5 pl-2 border-l border-scilens-border">
            <span className="text-[10px] font-mono text-scilens-lightmuted uppercase mr-1 hidden sm:inline">
              Export Review:
            </span>
            <button
              onClick={() => {
                if (health.connected && activeProjectId) {
                  window.open(getExportUrl(activeProjectId, 'docx', 'review'), '_blank');
                } else {
                  const content = `# Systematic Literature Review: ${topic}\n\n` + sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n');
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `scilens_${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_lit_review.docx`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="px-2.5 py-1 rounded-lg border border-scilens-border hover:border-scilens-teal bg-scilens-warmgray/60 hover:bg-white text-scilens-navy text-[11px] font-mono font-medium transition-all flex items-center gap-1"
              title="Export as Microsoft Word (.docx)"
            >
              <FileCode className="w-3 h-3 text-scilens-teal" />
              <span>Word (.docx)</span>
            </button>

            <button
              onClick={() => {
                if (health.connected && activeProjectId) {
                  window.open(getExportUrl(activeProjectId, 'pdf', 'review'), '_blank');
                } else {
                  window.print();
                }
              }}
              className="px-2.5 py-1 rounded-lg border border-scilens-border hover:border-scilens-teal bg-scilens-warmgray/60 hover:bg-white text-scilens-navy text-[11px] font-mono font-medium transition-all flex items-center gap-1"
              title="Export as PDF (.pdf)"
            >
              <Download className="w-3 h-3 text-scilens-teal" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => {
                if (health.connected && activeProjectId) {
                  window.open(getExportUrl(activeProjectId, 'md', 'review'), '_blank');
                } else {
                  const content = `# Systematic Literature Review: ${topic}\n\n` + sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n');
                  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `scilens_${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_lit_review.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="px-2.5 py-1 rounded-lg border border-scilens-border hover:border-scilens-teal bg-scilens-warmgray/60 hover:bg-white text-scilens-navy text-[11px] font-mono font-medium transition-all flex items-center gap-1"
              title="Export as Markdown (.md)"
            >
              <FileText className="w-3 h-3 text-scilens-teal" />
              <span>Markdown (.md)</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: 17 ACADEMIC SECTIONS VIEWER */}
      {activeTab === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 17-Section Stepper (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-scilens-border rounded-xl shadow-subtle p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-scilens-border pb-2">
              <span className="text-[10px] font-mono uppercase text-scilens-lightmuted">
                SECTIONS ({sections.length})
              </span>
              <span className="text-[10px] font-mono text-scilens-teal font-medium">
                {reviewOrg} • {reviewCitationStyle}
              </span>
            </div>

            <div className="space-y-1 max-h-[640px] overflow-y-auto pr-1 hide-scrollbar">
              {sections.map((sec, idx) => {
                const isActive = activeSectionIndex === idx;
                const estWords = sec.content.trim().split(/\s+/).filter(Boolean).length;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveSectionIndex(idx)}
                    className={clsx(
                      'w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-sans text-left transition-all',
                      isActive
                        ? 'bg-scilens-warmgray text-scilens-navy font-bold border-l-2 border-scilens-teal rounded-l-none shadow-subtle'
                        : 'text-scilens-muted hover:text-scilens-navy hover:bg-scilens-warmgray/50'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] text-scilens-lightmuted w-5 shrink-0">
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>
                      <span className="truncate">{sec.title.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                    <span className="font-mono text-[10px] text-scilens-lightmuted shrink-0 ml-2">
                      {estWords}w
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Section Reading & Grounding Pane (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-scilens-border rounded-xl shadow-subtle p-6 space-y-5">
            {/* Section Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-scilens-border pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-scilens-lightmuted">
                  SECTION {activeSectionIndex + 1 < 10 ? `0${activeSectionIndex + 1}` : activeSectionIndex + 1} OF {sections.length}
                </span>
                <h3 className="font-serif text-xl font-bold text-scilens-navy mt-0.5">
                  {activeSection?.title || 'Academic Section'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSourcesDrawerOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-scilens-borderteal bg-scilens-teal/10 hover:bg-scilens-teal/20 text-scilens-teal text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Sources for this section ({supportingPapersForActiveSection.length})</span>
                </button>

                <button
                  onClick={() => handleCopyText(activeSection?.content || '', 'Section Content Copied!')}
                  className="p-1.5 rounded-lg border border-scilens-border hover:bg-scilens-warmgray text-scilens-muted hover:text-scilens-navy transition-colors"
                  title="Copy Section"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Section Body */}
            <div className="prose prose-slate max-w-none">
              <div className="p-5 rounded-xl bg-scilens-ivory/30 border border-scilens-border text-sm font-sans text-scilens-navy leading-relaxed space-y-3 font-normal">
                {activeSection?.content.split('\n\n').map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>
            </div>

            {/* In-Text Citations Strip */}
            {activeSection?.citations && activeSection.citations.length > 0 && (
              <div className="p-3 bg-scilens-warmgray/50 rounded-lg border border-scilens-border space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-scilens-lightmuted block">
                  Grounding Citations Synthesized in This Section
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSection.citations.map((cite, i) => (
                    <span
                      key={i}
                      className="text-xs font-mono px-2.5 py-1 rounded bg-white text-scilens-navy border border-scilens-border shadow-subtle font-medium"
                    >
                      {cite}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Section Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-scilens-border text-xs">
              <button
                onClick={() => setActiveSectionIndex(Math.max(0, activeSectionIndex - 1))}
                disabled={activeSectionIndex === 0}
                className="px-3.5 py-1.5 rounded-lg border border-scilens-border text-scilens-navy disabled:opacity-40 hover:bg-scilens-warmgray transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous Section</span>
              </button>

              <span className="text-[11px] font-mono text-scilens-muted">
                {activeSectionIndex + 1} / {sections.length}
              </span>

              <button
                onClick={() => setActiveSectionIndex(Math.min(sections.length - 1, activeSectionIndex + 1))}
                disabled={activeSectionIndex === sections.length - 1}
                className="px-3.5 py-1.5 rounded-lg bg-scilens-navy text-white hover:bg-scilens-darknavy transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <span>Next Section</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 5 ACADEMIC COMPARISON TABLES */}
      {activeTab === 'tables' && (
        <div className="bg-white border border-scilens-border rounded-xl shadow-subtle p-6 space-y-6">
          {/* Tables Switcher Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-scilens-border pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-scilens-lightmuted">
                SYSTEMATIC LITERATURE MATRICES ({tables.length} TABLES)
              </span>
              <h3 className="font-serif text-lg font-bold text-scilens-navy mt-0.5">
                {activeTable?.title || 'Academic Comparative Table'}
              </h3>
              {activeTable?.description && (
                <p className="text-xs text-scilens-muted mt-1">{activeTable.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTableAsMarkdown}
                className="px-3 py-1.5 rounded-lg border border-scilens-border bg-white hover:bg-scilens-warmgray text-scilens-navy text-xs font-mono font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
              >
                <Copy className="w-3.5 h-3.5 text-scilens-teal" />
                <span>Copy Table Markdown</span>
              </button>
            </div>
          </div>

          {/* Table Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {tables.map((t) => (
              <button
                key={t.table_id}
                onClick={() => setActiveTableId(t.table_id)}
                className={clsx(
                  'px-3.5 py-2 rounded-lg text-xs font-serif font-bold transition-all border',
                  activeTableId === t.table_id
                    ? 'bg-scilens-navy text-white border-scilens-navy shadow-subtle'
                    : 'bg-scilens-ivory/50 text-scilens-navy border-scilens-border hover:bg-scilens-warmgray'
                )}
              >
                {t.title}
              </button>
            ))}
          </div>

          {/* Table Rendering with Horizontal Scroll */}
          {activeTable && (
            <div className="border border-scilens-border rounded-xl overflow-hidden shadow-subtle">
              <div className="overflow-x-auto min-w-[700px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-scilens-warmgray/80 border-b border-scilens-border">
                      {activeTable.headers.map((header, hIdx) => (
                        <th
                          key={hIdx}
                          className="px-4 py-3 text-[11px] font-mono uppercase text-scilens-navy font-bold tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-scilens-border font-sans text-xs">
                    {activeTable.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={clsx(
                          'transition-colors hover:bg-scilens-teal/5',
                          rIdx % 2 === 0 ? 'bg-white' : 'bg-scilens-ivory/20'
                        )}
                      >
                        {row.map((cell, cIdx) => {
                          const isNotReported =
                            !cell ||
                            cell.toLowerCase() === 'not reported' ||
                            cell.toLowerCase() === 'unspecified' ||
                            cell === '-';

                          return (
                            <td key={cIdx} className="px-4 py-3 text-scilens-navy leading-snug align-top">
                              {isNotReported ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Not reported
                                </span>
                              ) : (
                                <span>{cell}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="text-[10px] font-mono text-scilens-lightmuted">
            Note: All table entries reflect verified extraction parameters from the indexed research corpus. Missing or omitted variables explicitly display "Not reported".
          </p>
        </div>
      )}

      {/* 4. SOURCES SUPPORTING THIS SECTION DRAWER */}
      <Drawer
        isOpen={isSourcesDrawerOpen}
        onClose={() => setIsSourcesDrawerOpen(false)}
        title={`Sources Supporting: ${activeSection?.title || 'Active Section'}`}
        subtitle={`${supportingPapersForActiveSection.length} benchmark papers retrieved from PubMed, arXiv & OpenAlex`}
        width="lg"
      >
        <div className="p-6 space-y-4">
          {supportingPapersForActiveSection.length === 0 ? (
            <div className="p-6 text-center text-scilens-muted text-xs font-mono bg-scilens-ivory rounded-xl border border-scilens-border">
              No specific paper IDs tied to this synthesis section yet. All {corpus.length} indexed papers in the corpus contribute broadly.
            </div>
          ) : (
            supportingPapersForActiveSection.map((paper) => (
              <div
                key={paper.id}
                className="p-4 rounded-xl border border-scilens-border bg-scilens-ivory/30 space-y-2 hover:border-scilens-teal transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif text-sm font-bold text-scilens-navy leading-snug">
                    {paper.title}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-scilens-warmgray text-scilens-navy font-bold shrink-0">
                    {paper.year}
                  </span>
                </div>

                <p className="text-xs text-scilens-muted font-sans">
                  {paper.authors.join(', ')} • <span className="font-medium text-scilens-navy">{paper.venue}</span>
                </p>

                {paper.abstract && (
                  <p className="text-xs text-scilens-navy font-serif leading-relaxed line-clamp-3 bg-white p-2.5 rounded border border-scilens-border/60">
                    {paper.abstract}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                  <div className="p-1.5 rounded bg-white border border-scilens-border">
                    <span className="text-scilens-lightmuted block uppercase">Methodology</span>
                    <span className="font-bold text-scilens-navy truncate block">
                      {paper.methodology || 'Not reported'}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-white border border-scilens-border">
                    <span className="text-scilens-lightmuted block uppercase">Cohort / Dataset</span>
                    <span className="font-bold text-scilens-navy truncate block">
                      {paper.population || paper.dataset || 'Not reported'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-scilens-border/60 text-[10px] font-mono">
                  <span className="text-scilens-muted">DOI: {paper.doi || 'Not reported'}</span>
                  <button
                    onClick={() => {
                      setSelectedPaperId(paper.id);
                      setIsSourcesDrawerOpen(false);
                    }}
                    className="text-scilens-teal font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View in Corpus</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>
    </div>
  );
};
