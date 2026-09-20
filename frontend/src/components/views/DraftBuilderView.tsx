import React, { useState, useEffect } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { DraftSection } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import { WorkspaceView } from '../layout/Sidebar';
import { LiteratureReviewStudio } from './LiteratureReviewStudio';
import {
  FileEdit,
  Download,
  CheckCircle2,
  BookOpen,
  Quote,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  Save,
  RotateCcw,
  Table,
} from 'lucide-react';
import { clsx } from 'clsx';

interface DraftBuilderViewProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const DraftBuilderView: React.FC<DraftBuilderViewProps> = ({ onNavigate }) => {
  const { draft: investigationDraft, corpus, topic, literatureReview } = useInvestigation();
  const [draft, setDraft] = useState(investigationDraft);
  const [studioMode, setStudioMode] = useState<'lit_review' | 'proposal'>('lit_review');
  const [activeSectionId, setActiveSectionId] = useState<string>(
    investigationDraft.sections[1]?.id || investigationDraft.sections[0]?.id || 'sec_1'
  );
  const [reviewMode, setReviewMode] = useState<'Thematic' | 'Chronological' | 'Methodological'>('Thematic');
  const [showCitationDropdown, setShowCitationDropdown] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    setDraft(investigationDraft);
    if (investigationDraft.sections.length > 0) {
      setActiveSectionId(investigationDraft.sections[1]?.id || investigationDraft.sections[0]?.id);
    }
  }, [investigationDraft]);

  const activeSection =
    draft.sections.find((s) => s.id === activeSectionId) || draft.sections[0];

  const handleContentChange = (newText: string) => {
    const updatedSections = draft.sections.map((s) => {
      if (s.id === activeSectionId) {
        return {
          ...s,
          content: newText,
          wordCount: newText.trim().split(/\s+/).filter(Boolean).length,
        };
      }
      return s;
    });
    setDraft({ ...draft, sections: updatedSections, lastEdited: 'Saved just now' });
  };

  const handleInsertCitation = (citationText: string) => {
    const newContent = `${activeSection.content} (${citationText})`;
    handleContentChange(newContent);
    setShowCitationDropdown(false);
  };

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const totalWords = draft.sections.reduce((acc, s) => acc + s.wordCount, 0);

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      <PageHeader
        label="ACADEMIC DRAFT STUDIO"
        title="Draft"
        italicWord="Builder"
        description="Comprehensive 15-section academic proposal generator and editor with grounded inline citations, variable structuring modes, and journal-ready export."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-3.5 py-2 rounded-lg border border-scilens-border bg-white hover:bg-scilens-warmgray text-scilens-navy text-xs font-sans font-medium transition-colors flex items-center gap-1.5 shadow-subtle"
            >
              <Save className="w-3.5 h-3.5 text-scilens-teal" />
              <span>{saveToast ? 'Draft Saved!' : 'Save Progress'}</span>
            </button>

            <button
              onClick={() => onNavigate('export')}
              className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-subtle"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export to PDF / DOCX</span>
            </button>
          </div>
        }
      />

      {/* Document Overview Strip */}
      <div className="p-4 bg-white border border-scilens-border rounded-xl shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-scilens-lightmuted">
            WORKING DOCUMENT TITLE
          </span>
          <h2 className="font-serif text-sm md:text-base font-bold text-scilens-navy max-w-2xl truncate">
            {draft.title}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-[10px] text-scilens-lightmuted uppercase block">Total Words</span>
            <span className="font-bold text-scilens-navy">{totalWords.toLocaleString()}</span>
          </div>
          <div className="text-right border-l border-scilens-border pl-4">
            <span className="text-[10px] text-scilens-lightmuted uppercase block">Sections</span>
            <span className="font-bold text-scilens-teal">
              {draft.sections.filter((s) => (s.content || '').trim().length > 60).length} / {draft.sections.length} Drafted
            </span>
          </div>
          <div className="text-right border-l border-scilens-border pl-4">
            <span className="text-[10px] text-scilens-lightmuted uppercase block">Last Sync</span>
            <span className="text-scilens-muted">{draft.lastEdited}</span>
          </div>
        </div>
      </div>

      {/* Studio Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-scilens-border pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStudioMode('lit_review')}
            className={clsx(
              'px-4 py-2.5 rounded-t-lg text-xs font-serif font-bold transition-all flex items-center gap-2 border-b-2',
              studioMode === 'lit_review'
                ? 'border-scilens-teal text-scilens-navy bg-white shadow-subtle'
                : 'border-transparent text-scilens-muted hover:text-scilens-navy hover:bg-scilens-warmgray/50'
            )}
          >
            <BookOpen className="w-4 h-4 text-scilens-teal" />
            <span>Literature Review Studio</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-scilens-teal/10 text-scilens-teal font-semibold">
              {(literatureReview?.sections?.length || 0) > 0
                ? `${literatureReview.sections.length} Sections • ${literatureReview.tables?.length || 0} Tables`
                : 'Ready to Synthesize'}
            </span>
          </button>

          <button
            onClick={() => setStudioMode('proposal')}
            className={clsx(
              'px-4 py-2.5 rounded-t-lg text-xs font-serif font-bold transition-all flex items-center gap-2 border-b-2',
              studioMode === 'proposal'
                ? 'border-scilens-teal text-scilens-navy bg-white shadow-subtle'
                : 'border-transparent text-scilens-muted hover:text-scilens-navy hover:bg-scilens-warmgray/50'
            )}
          >
            <FileEdit className="w-4 h-4 text-scilens-muted" />
            <span>NIH / NSF Proposal Draft</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-scilens-warmgray text-scilens-muted font-normal">
              15 Sections Stepper
            </span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-scilens-lightmuted hidden sm:block">
          Active Engine: <span className="font-semibold text-scilens-navy">Gemini / LangGraph Scholarly Synthesizer</span>
        </div>
      </div>

      {studioMode === 'lit_review' ? (
        <LiteratureReviewStudio />
      ) : (
        /* Two-Column Editor Layout: 15-Section Stepper on Left, Rich Editor on Right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section Stepper (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-scilens-border rounded-xl shadow-subtle p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-scilens-border pb-2">
            <span className="text-[10px] font-mono uppercase text-scilens-lightmuted">
              DOCUMENT SECTIONS (15)
            </span>
            <span className="text-[10px] font-mono text-scilens-teal font-medium">
              NIH / NSF Format
            </span>
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1 hide-scrollbar">
            {draft.sections.map((sec, idx) => {
              const isActive = activeSection.id === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={clsx(
                    'w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-sans text-left transition-all',
                    isActive
                      ? 'bg-scilens-warmgray text-scilens-navy font-bold border-l-2 border-scilens-teal rounded-l-none shadow-subtle'
                      : 'text-scilens-muted hover:text-scilens-navy hover:bg-scilens-warmgray/50'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-scilens-lightmuted w-4">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                    <span className="truncate">{sec.sectionName}</span>
                  </div>
                  <span className="font-mono text-[10px] text-scilens-lightmuted shrink-0">
                    {sec.wordCount}w
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Rich Editor Pane (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-scilens-border rounded-xl shadow-subtle p-6 space-y-4">
          {/* Section Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-scilens-border pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-scilens-lightmuted">
                ACTIVE SECTION
              </span>
              <h3 className="font-serif text-xl font-bold text-scilens-navy">
                {activeSection.sectionName}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Literature Review Mode Switcher (only shown if Literature Review section is selected) */}
              {activeSection.id === 'sec_lit_review' && (
                <div className="flex items-center bg-scilens-ivory border border-scilens-border rounded-lg p-0.5 text-xs font-mono">
                  <span className="px-2 text-scilens-muted text-[10px]">Mode:</span>
                  {(['Thematic', 'Chronological', 'Methodological'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setReviewMode(mode)}
                      className={clsx(
                        'px-2 py-1 rounded transition-colors text-[10px]',
                        reviewMode === mode
                          ? 'bg-scilens-teal text-white font-medium'
                          : 'text-scilens-navy hover:bg-scilens-warmgray'
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}

              {/* Citation Inserter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCitationDropdown(!showCitationDropdown)}
                  className="px-3 py-1.5 rounded-lg border border-scilens-border bg-scilens-ivory hover:bg-scilens-warmgray text-scilens-navy text-xs font-sans font-medium flex items-center gap-1.5 shadow-subtle"
                >
                  <Quote className="w-3.5 h-3.5 text-scilens-teal" />
                  <span>Insert Citation</span>
                </button>

                {showCitationDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-scilens-border rounded-xl shadow-xl z-30 p-2 space-y-1 max-h-72 overflow-y-auto">
                    <span className="text-[10px] font-mono uppercase text-scilens-lightmuted px-2 py-1 block">
                      Indexed Benchmark Papers ({corpus.length})
                    </span>
                    {corpus.slice(0, 10).map((p) => {
                      const firstAuthor = p.authors[0] || 'Author';
                      const surname = firstAuthor.includes(' ') ? firstAuthor.split(' ').slice(-1)[0] : firstAuthor;
                      return (
                        <button
                          key={p.id}
                          onClick={() =>
                            handleInsertCitation(`${surname} et al., ${p.year}`)
                          }
                          className="w-full text-left p-2 rounded hover:bg-scilens-warmgray text-xs space-y-0.5 transition-colors"
                        >
                          <p className="font-serif font-bold text-scilens-navy line-clamp-1">
                            {p.title}
                          </p>
                          <p className="text-[10px] font-mono text-scilens-muted">
                            {firstAuthor} ({p.year})
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div className="space-y-3">
            <textarea
              rows={14}
              value={activeSection.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full p-4 text-sm font-serif text-scilens-navy leading-relaxed rounded-lg border border-scilens-border bg-scilens-ivory/30 focus:outline-none focus:border-scilens-teal focus:bg-white resize-y font-normal transition-all"
              placeholder="Draft section content..."
            />

            {/* In-Text Citations Chips */}
            {activeSection.citations && activeSection.citations.length > 0 && (
              <div className="p-3 bg-scilens-ivory rounded-lg border border-scilens-border space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-scilens-lightmuted block">
                  Grounding Citations Referenced in This Section
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSection.citations.map((cite, i) => (
                    <span
                      key={i}
                      className="text-xs font-mono px-2.5 py-1 rounded bg-white text-scilens-teal border border-scilens-borderteal shadow-subtle font-medium"
                    >
                      {cite}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section Footer Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-scilens-border text-xs">
            <span className="font-mono text-scilens-muted">
              Section words: <strong className="text-scilens-navy">{activeSection.wordCount}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const currIdx = draft.sections.findIndex((s) => s.id === activeSection.id);
                  if (currIdx > 0) setActiveSectionId(draft.sections[currIdx - 1].id);
                }}
                disabled={draft.sections[0].id === activeSection.id}
                className="px-3 py-1.5 rounded border border-scilens-border text-scilens-navy disabled:opacity-40"
              >
                Previous Section
              </button>

              <button
                onClick={() => {
                  const currIdx = draft.sections.findIndex((s) => s.id === activeSection.id);
                  if (currIdx < draft.sections.length - 1) {
                    setActiveSectionId(draft.sections[currIdx + 1].id);
                  } else {
                    onNavigate('export');
                  }
                }}
                className="px-3.5 py-1.5 rounded bg-scilens-navy text-white hover:bg-scilens-darknavy transition-colors flex items-center gap-1.5"
              >
                <span>
                  {draft.sections[draft.sections.length - 1].id === activeSection.id
                    ? 'Proceed to Export'
                    : 'Next Section'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
