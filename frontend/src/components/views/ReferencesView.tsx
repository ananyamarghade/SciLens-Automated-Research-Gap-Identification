import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { CitationStyle, FormattedCitation, ClaimVerificationItem } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import { WorkspaceView } from '../layout/Sidebar';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Download,
  BookOpen,
  FileCheck,
  ShieldCheck,
  ExternalLink,
  Search,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ReferencesViewProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const ReferencesView: React.FC<ReferencesViewProps> = ({ onNavigate }) => {
  const { citationsByStyle, claimVerifications, topic } = useInvestigation();
  const [activeTab, setActiveTab] = useState<'references' | 'verification'>('references');
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('APA 7');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const styles: CitationStyle[] = ['APA 7', 'IEEE', 'MLA 9', 'Harvard', 'Chicago', 'Vancouver'];

  const citations = citationsByStyle[selectedStyle] || citationsByStyle['APA 7'] || [];

  const filteredCitations = citations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.authors.some((a: string) => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-8 max-w-7xl pb-12">
      <PageHeader
        label="GROUNDED CITATION & CLAIM VERIFICATION"
        title="References &"
        italicWord="Verification"
        description="Dynamic academic citation engine supporting 6 international referencing formats alongside automated sentence-level claim grounding analysis."
      />

      {/* Sub-Tabs: References Library vs Claim Verification Engine */}
      <div className="flex border-b border-scilens-border bg-white rounded-xl p-1 gap-1 shadow-subtle">
        <button
          onClick={() => setActiveTab('references')}
          className={clsx(
            'px-4 py-2 rounded-lg text-xs font-sans font-medium transition-colors flex items-center gap-2',
            activeTab === 'references'
              ? 'bg-scilens-navy text-white shadow-subtle'
              : 'text-scilens-muted hover:text-scilens-navy hover:bg-scilens-warmgray'
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Reference Library ({citations.length} Benchmarks)</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={clsx(
            'px-4 py-2 rounded-lg text-xs font-sans font-medium transition-colors flex items-center gap-2',
            activeTab === 'verification'
              ? 'bg-scilens-navy text-white shadow-subtle'
              : 'text-scilens-muted hover:text-scilens-navy hover:bg-scilens-warmgray'
          )}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Claim Verification Engine ({claimVerifications.length} Claims)</span>
        </button>
      </div>

      {/* Tab 1: Reference Library */}
      {activeTab === 'references' && (
        <div className="space-y-6">
          {/* Style Selector & Search Bar */}
          <div className="p-4 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-scilens-muted">Citation Style:</span>
                <div className="flex flex-wrap gap-1 bg-scilens-ivory border border-scilens-border rounded-lg p-1">
                  {styles.map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={clsx(
                        'px-2.5 py-1 text-xs font-mono rounded transition-colors',
                        selectedStyle === style
                          ? 'bg-scilens-teal text-white font-medium shadow-subtle'
                          : 'text-scilens-navy hover:bg-scilens-warmgray'
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-scilens-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter references..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-sans rounded-lg border border-scilens-border bg-white text-scilens-navy focus:outline-none focus:border-scilens-teal"
                />
              </div>
            </div>
          </div>

          {/* Bibliography List */}
          <div className="space-y-3">
            {filteredCitations.map((cit) => (
              <div
                key={cit.paperId}
                className="p-5 bg-white border border-scilens-border rounded-xl shadow-subtle hover:border-scilens-teal/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <p className="font-serif text-sm text-scilens-navy leading-relaxed">
                      {cit.bibliography}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-scilens-muted pt-1">
                      <span>In-text key: <strong className="text-scilens-teal">{cit.inText}</strong></span>
                      {cit.doi && (
                        <a
                          href={`https://doi.org/${cit.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-scilens-muted flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>doi:{cit.doi}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(cit.inText, `intext_${cit.paperId}`)}
                      className="px-2.5 py-1 rounded bg-scilens-ivory border border-scilens-border hover:bg-scilens-warmgray text-xs font-mono text-scilens-navy flex items-center gap-1 transition-colors"
                      title="Copy In-Text citation"
                    >
                      <Copy className="w-3 h-3 text-scilens-muted" />
                      <span>{copiedId === `intext_${cit.paperId}` ? 'Copied!' : 'In-Text'}</span>
                    </button>

                    <button
                      onClick={() => handleCopy(cit.bibliography, `bib_${cit.paperId}`)}
                      className="px-3 py-1 rounded bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-mono flex items-center gap-1 transition-colors shadow-subtle"
                      title="Copy full bibliography entry"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === `bib_${cit.paperId}` ? 'Copied!' : 'Copy Entry'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Claim Verification Engine */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-2">
            <SectionLabel text="SENTENCE-LEVEL GROUNDING ENGINE" />
            <h3 className="font-serif text-lg font-bold text-scilens-navy">
              Proposal Claims Grounding & Evidence Check
            </h3>
            <p className="text-xs text-scilens-muted font-sans">
              SciLens compares every assertion in your draft against indexed literature chunks, verifying empirical support and flagging unsubstantiated claims before peer review submission.
            </p>
          </div>

          <div className="space-y-4">
            {claimVerifications.map((claim) => (
              <div
                key={claim.id}
                className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-scilens-border pb-3">
                  <div className="flex items-center gap-2">
                    {claim.status === 'Verified' && (
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-scilens-lightteal text-scilens-teal border border-scilens-borderteal font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Grounded & Verified
                      </span>
                    )}
                    {claim.status === 'Needs Evidence' && (
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Needs Additional Evidence
                      </span>
                    )}
                    {claim.status === 'Unsupported Claim' && (
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Unsupported Assertion
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-xs text-scilens-lightmuted">
                    Verification Confidence: <strong className="text-scilens-navy">{claim.confidence}%</strong>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-scilens-lightmuted block mb-1">
                    Draft Claim Assertion
                  </span>
                  <p className="font-serif text-base font-bold text-scilens-navy leading-relaxed">
                    "{claim.claim}"
                  </p>
                </div>

                {/* Grounded Evidence Chunks */}
                {claim.supportingEvidence.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono uppercase text-scilens-teal font-semibold block">
                      Direct Grounding in Literature
                    </span>
                    {claim.supportingEvidence.map((ev: any, i: number) => {
                      const isDirectQuote = Boolean(ev.quote && !ev.isSynthesis);
                      return (
                        <div
                          key={i}
                          className="p-3 bg-scilens-ivory dark:bg-[#070D1E] rounded-lg border border-scilens-border dark:border-scilens-darkborder space-y-1 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between font-mono text-[10px] text-scilens-muted dark:text-scilens-darkmuted gap-1">
                            <span className="font-semibold text-scilens-navy dark:text-white">{ev.paperTitle}</span>
                            <div className="flex items-center gap-2">
                              {isDirectQuote && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[9px] border border-emerald-500/20 font-semibold">
                                  VERBATIM SOURCE TEXT
                                </span>
                              )}
                              <span>Page {ev.page} • {ev.section}</span>
                            </div>
                          </div>
                          {isDirectQuote ? (
                            <p className="font-serif italic text-scilens-navy dark:text-white leading-relaxed pl-2 border-l-2 border-emerald-500">
                              "{ev.quote}"
                            </p>
                          ) : (
                            <p className="font-sans text-scilens-navy dark:text-white leading-relaxed pl-2 border-l-2 border-blue-400">
                              {ev.quote}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg text-xs text-red-800">
                    No indexed paper provides direct empirical verification for this specific claim. Consider adding an empirical citation or qualifying with 'hypothesized'.
                  </div>
                )}

                {/* AI Interpretation & Recommendation */}
                <div className="p-3.5 bg-scilens-warmgray/50 rounded-lg border border-scilens-border text-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase text-scilens-lightmuted font-semibold block">
                    SciLens Editorial Recommendation
                  </span>
                  <p className="font-sans text-scilens-navy leading-relaxed">
                    {claim.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
