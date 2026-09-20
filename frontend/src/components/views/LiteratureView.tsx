import React, { useState, useRef } from 'react';
import { Paper } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';
import { WorkspaceView } from '../layout/Sidebar';
import { useInvestigation } from '../../context/InvestigationContext';
import { useBackend } from '../../context/BackendContext';
import { uploadPdfDocument, uploadMultipleDocuments, searchOnlinePapers, DocumentUploadItemStatus, BatchUploadResult } from '../../services/api';
import {
  Search,
  Upload,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  SlidersHorizontal,
  Compass,
  Archive,
  X,
  AlertTriangle,
} from 'lucide-react';

import { clsx } from 'clsx';

interface LiteratureViewProps {
  onNavigate: (view: WorkspaceView) => void;
  onSelectPaper: (paperId: string) => void;
}

export const LiteratureView: React.FC<LiteratureViewProps> = ({
  onNavigate,
  onSelectPaper,
}) => {
  const { health, activeProjectId } = useBackend();
  const {
    topic,
    corpus,
    isRealCorpus,
    mode,
    discoveryPipeline,
    discoverMorePapers,
    refreshCorpus,
    setSelectedPaperId,
  } = useInvestigation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedRelevanceTier, setSelectedRelevanceTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'citations'>('relevance');
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [activeDetailPaper, setActiveDetailPaper] = useState<Paper | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [batchResults, setBatchResults] = useState<DocumentUploadItemStatus[]>([]);
  const [fileProgressMap, setFileProgressMap] = useState<Record<string, string>>({});
  const [identifierInput, setIdentifierInput] = useState('');
  const [isDiscoveringMore, setIsDiscoveringMore] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDiscoverMore = async () => {
    setIsDiscoveringMore(true);
    await discoverMorePapers();
    setIsDiscoveringMore(false);
  };

  const handleFileSelect = (newFiles: FileList | File[]) => {
    const fileArr = Array.from(newFiles);
    const validFiles = fileArr.filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.zip')
    );
    if (validFiles.length < fileArr.length) {
      setUploadError('Some files were ignored: only .pdf and .zip archives are supported.');
    } else {
      setUploadError(null);
    }
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    setBatchResults([]);

    if (selectedFiles.length > 0 && health.connected && activeProjectId) {
      // Initialize progress tracking
      const initialProgress: Record<string, string> = {};
      selectedFiles.forEach((f) => {
        initialProgress[f.name] = f.name.toLowerCase().endsWith('.zip') ? 'Extracting & processing...' : 'Uploading & indexing...';
      });
      setFileProgressMap(initialProgress);

      const batchRes = await uploadMultipleDocuments(activeProjectId, selectedFiles);
      if (batchRes && (batchRes.processed_count > 0 || batchRes.results.length > 0)) {
        setBatchResults(batchRes.results);
        if (batchRes.processed_count > 0) {
          setUploadSuccess(true);
          await refreshCorpus();
        }
        if (batchRes.failed_count > 0 && batchRes.processed_count === 0) {
          setUploadError(`Failed to process uploaded files. ${batchRes.results[0]?.error || ''}`);
        }
      } else {
        setUploadError('Failed to process documents on backend.');
      }
    } else if (identifierInput && health.connected && activeProjectId) {
      await searchOnlinePapers(activeProjectId, identifierInput);
      await refreshCorpus();
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsUploadModalOpen(false);
        setIdentifierInput('');
      }, 1500);
    }
    setUploading(false);
  };

  // Filter across the entire corpus
  const filteredPapers = corpus
    .filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.authors.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.methodology.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.venue.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesYear = selectedYear === 'all' || p.year.toString() === selectedYear;
      const matchesMethod =
        selectedMethod === 'all' ||
        p.methodology.toLowerCase().includes(selectedMethod.toLowerCase());

      let matchesRelevance = true;
      if (selectedRelevanceTier === 'high') matchesRelevance = p.relevance >= 90;
      else if (selectedRelevanceTier === 'moderate') matchesRelevance = p.relevance >= 80 && p.relevance < 90;
      else if (selectedRelevanceTier === 'foundational') matchesRelevance = p.relevance < 80;

      return matchesSearch && matchesYear && matchesMethod && matchesRelevance;
    })
    .sort((a, b) => {
      if (sortBy === 'relevance') return b.relevance - a.relevance;
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'citations') return b.citationCount - a.citationCount;
      return 0;
    });

  // Calculate pagination
  const totalFiltered = filteredPapers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const visiblePapers = filteredPapers.slice(startIndex, endIndex);

  // Relevance counts
  const highRelCount = corpus.filter((p) => p.relevance >= 90).length;
  const modRelCount = corpus.filter((p) => p.relevance >= 80 && p.relevance < 90).length;
  const lowRelCount = corpus.filter((p) => p.relevance < 80).length;

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      <PageHeader
        label="LITERATURE CORPUS"
        title="Literature"
        italicWord="Discovery"
        description={`Scholarly publications and evidence records for active investigation: "${topic}".`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscoverMore}
              disabled={isDiscoveringMore || discoveryPipeline.isDiscovering}
              className="px-3.5 py-2 rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard text-xs font-sans font-medium text-scilens-navy dark:text-white transition-colors flex items-center gap-2 shadow-subtle disabled:opacity-60"
            >
              {isDiscoveringMore || discoveryPipeline.isDiscovering ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-scilens-teal" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-scilens-teal" />
              )}
              <span>Discover More Papers</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-subtle"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add PDF / DOI</span>
            </button>
          </div>
        }
      />

      {/* Discovery Pipeline & Evidence Origin Status */}
      <div className="p-4 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium uppercase border ${
                isRealCorpus
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {isRealCorpus ? 'DISCOVERED PAPERS (REAL)' : 'DEMO RESEARCH CORPUS'}
            </span>

            <span className="text-xs text-scilens-muted dark:text-scilens-darkmuted font-sans">
              {isRealCorpus
                ? 'Harvested across PubMed, OpenAlex, arXiv & CrossRef'
                : `Generated specifically for "${topic}"`}
            </span>
          </div>

          <p className="text-xs text-scilens-slate dark:text-scilens-darkmuted font-sans">
            {discoveryPipeline.stage}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1 rounded-lg bg-scilens-parchment dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder flex items-center gap-2">
            <span className="text-scilens-muted dark:text-scilens-darkmuted">Total:</span>
            <span className="font-semibold text-scilens-navy dark:text-white">{corpus.length}</span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{highRelCount} High Rel.</span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-scilens-lightteal/40 dark:bg-scilens-teal/20 border border-scilens-borderteal text-scilens-teal dark:text-scilens-glowteal flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-scilens-teal" />
            <span>{modRelCount} Moderate</span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-scilens-warmgray dark:bg-scilens-darkcard border border-scilens-border dark:border-scilens-darkborder text-scilens-muted dark:text-scilens-darkmuted flex items-center gap-1.5">
            <span>{lowRelCount} Foundational</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-scilens-muted dark:text-scilens-darkmuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search across all ${corpus.length} papers (titles, authors, abstracts, methods, datasets)...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs font-sans rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-scilens-ivory/50 dark:bg-black/20 focus:outline-none focus:border-scilens-teal text-scilens-navy dark:text-white placeholder:text-scilens-muted transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-scilens-border/60 dark:border-scilens-darkborder/60">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-sans rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] text-scilens-navy dark:text-white focus:outline-none focus:border-scilens-teal"
            >
              <option value="all">All Years</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>

            <select
              value={selectedRelevanceTier}
              onChange={(e) => {
                setSelectedRelevanceTier(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-sans rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] text-scilens-navy dark:text-white focus:outline-none focus:border-scilens-teal"
            >
              <option value="all">All Relevance Levels</option>
              <option value="high">High Relevance (&gt;=90%)</option>
              <option value="moderate">Moderate Relevance (80–89%)</option>
              <option value="foundational">Foundational (&lt;80%)</option>
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-sans rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] text-scilens-navy dark:text-white focus:outline-none focus:border-scilens-teal"
            >
              <option value="all">All Methodologies</option>
              <option value="systematic">Systematic Reviews &amp; Meta-Analyses</option>
              <option value="empirical">Empirical &amp; Experimental Trials</option>
              <option value="qualitative">Qualitative &amp; Case Studies</option>
              <option value="framework">Conceptual &amp; Curricular Frameworks</option>
              <option value="survey">Surveys &amp; Faculty Evaluations</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-scilens-muted dark:text-scilens-darkmuted">Per Page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 text-xs font-sans rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] text-scilens-navy dark:text-white focus:outline-none focus:border-scilens-teal font-mono"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-scilens-muted dark:text-scilens-darkmuted">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-sans rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] text-scilens-navy dark:text-white focus:outline-none focus:border-scilens-teal"
              >
                <option value="relevance">Highest Relevance</option>
                <option value="year">Newest First</option>
                <option value="citations">Most Cited</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-scilens-border/40 dark:border-scilens-darkborder/40 text-xs text-scilens-muted dark:text-scilens-darkmuted font-sans">
          <span>
            Showing <strong className="text-scilens-navy dark:text-white">{totalFiltered === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of{' '}
            <strong className="text-scilens-navy dark:text-white">{totalFiltered}</strong> papers ({corpus.length} total indexed in corpus)
          </span>
          {(searchTerm || selectedYear !== 'all' || selectedMethod !== 'all' || selectedRelevanceTier !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedYear('all');
                setSelectedMethod('all');
                setSelectedRelevanceTier('all');
                setCurrentPage(1);
              }}
              className="text-xs text-scilens-teal hover:underline font-mono"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Paper Cards List */}
      <div className="space-y-4">
        {filteredPapers.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle space-y-4">
            <BookOpen className="w-10 h-10 text-scilens-teal mx-auto opacity-70" />
            <div className="space-y-1">
              <h4 className="font-serif text-base font-semibold text-scilens-navy dark:text-white">
                No matching publications found
              </h4>
              <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted max-w-md mx-auto">
                No indexed papers matched your filters. Try relaxing the search parameters or click below to discover additional publications.
              </p>
            </div>
            <button
              onClick={handleDiscoverMore}
              className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium inline-flex items-center gap-2 shadow-subtle"
            >
              <Sparkles className="w-4 h-4" />
              <span>Discover Additional Literature for "{topic}"</span>
            </button>
          </div>
        )}

        {visiblePapers.map((paper, idx) => {
          const isExpanded = expandedAbstracts[paper.id];
          return (
            <div
              key={paper.id}
              className="p-5 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle hover:border-scilens-teal/50 dark:hover:border-scilens-teal/40 transition-all space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-scilens-parchment dark:bg-[#070D1E] text-scilens-slate dark:text-scilens-darkmuted border border-scilens-border dark:border-scilens-darkborder">
                      {paper.year || 'N/A'}
                    </span>
                    {paper.relevanceTier && (
                      <span
                        className={clsx(
                          'font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border',
                          paper.relevanceTier === 'DIRECT' &&
                            'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
                          paper.relevanceTier === 'FOUNDATIONAL' &&
                            'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
                          paper.relevanceTier === 'RELATED' &&
                            'bg-scilens-lightteal/40 border-scilens-borderteal text-scilens-teal dark:text-scilens-glowteal',
                          paper.relevanceTier === 'PERIPHERAL' &&
                            'bg-scilens-warmgray dark:bg-scilens-darkcard border-scilens-border dark:border-scilens-darkborder text-scilens-muted dark:text-scilens-darkmuted'
                        )}
                      >
                        {paper.relevanceTier === 'DIRECT'
                          ? 'DIRECT EVIDENCE'
                          : paper.relevanceTier === 'FOUNDATIONAL'
                          ? 'FOUNDATIONAL CONTEXT'
                          : paper.relevanceTier === 'RELATED'
                          ? 'RELATED LITERATURE'
                          : 'PERIPHERAL CONTEXT'}
                      </span>
                    )}
                    <span className="text-xs text-scilens-muted dark:text-scilens-darkmuted font-serif italic truncate max-w-xs">
                      {paper.venue || 'Peer-Reviewed Journal'}
                    </span>
                    {paper.doi && (
                      <span className="font-mono text-[10px] text-scilens-teal dark:text-scilens-glowteal truncate max-w-[220px]">
                        DOI: {paper.doi}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => {
                      setSelectedPaperId(paper.id);
                      setActiveDetailPaper(paper);
                    }}
                    className="font-serif text-base md:text-lg font-semibold text-scilens-navy dark:text-white leading-snug cursor-pointer hover:text-scilens-teal dark:hover:text-scilens-glowteal transition-colors"
                  >
                    {paper.title}
                  </h3>

                  <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted font-sans">
                    {paper.authors && paper.authors.length > 0 ? paper.authors.join(', ') : 'Not explicitly reported.'}
                  </p>
                </div>

                <div className="shrink-0 flex items-center md:items-end justify-between md:flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-scilens-border/60 dark:border-scilens-darkborder/60">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 h-1.5 rounded-full bg-scilens-warmgray dark:bg-scilens-darkcard overflow-hidden">
                        <div
                          className="h-full bg-scilens-teal dark:bg-scilens-glowteal rounded-full"
                          style={{ width: `${paper.relevance}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-scilens-navy dark:text-white">
                        {paper.relevance}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-scilens-muted dark:text-scilens-darkmuted">
                    {paper.citationCount} citations
                  </span>
                </div>
              </div>

              {/* Abstract Snippet */}
              <div className="text-xs text-scilens-slate dark:text-scilens-darkmuted font-sans leading-relaxed">
                <p className={clsx(!isExpanded && 'line-clamp-2')}>
                  {paper.abstract || 'Abstract details not explicitly reported in open index.'}
                </p>
                {paper.abstract && (
                  <button
                    onClick={() => toggleAbstract(paper.id)}
                    className="mt-1 text-[11px] font-mono text-scilens-teal dark:text-scilens-glowteal hover:underline inline-flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <span>Show less</span>
                        <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>Read full abstract</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Metadata Badges & Quick Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-scilens-border/40 dark:border-scilens-darkborder/40 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-scilens-parchment dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder">
                    <span className="text-scilens-muted dark:text-scilens-darkmuted font-mono">Method: </span>
                    <span className="text-scilens-navy dark:text-white font-medium">{paper.methodology || 'Not explicitly reported.'}</span>
                  </div>

                  <div className="px-2 py-0.5 rounded bg-scilens-parchment dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder">
                    <span className="text-scilens-muted dark:text-scilens-darkmuted font-mono">Dataset: </span>
                    <span className="text-scilens-navy dark:text-white font-medium truncate max-w-[200px] inline-block align-bottom">{paper.dataset || 'Not explicitly reported.'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPaperId(paper.id);
                      setActiveDetailPaper(paper);
                    }}
                    className="px-2.5 py-1 rounded border border-scilens-border dark:border-scilens-darkborder hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard text-xs font-sans text-scilens-navy dark:text-white transition-colors"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPaperId(paper.id);
                      onNavigate('paper_analysis');
                    }}
                    className="px-2.5 py-1 rounded bg-scilens-lightteal dark:bg-scilens-teal/20 text-scilens-teal dark:text-scilens-glowteal hover:bg-scilens-teal hover:text-white transition-colors text-xs font-sans font-medium"
                  >
                    Analyze Paper →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-scilens-border/60 dark:border-scilens-darkborder/60">
          <div className="text-xs text-scilens-muted dark:text-scilens-darkmuted font-mono">
            Page {effectivePage} of {totalPages} ({totalFiltered} matching papers)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={effectivePage <= 1}
              className="px-3 py-1.5 rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard text-xs font-sans font-medium text-scilens-navy dark:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - effectivePage) <= 1)
              .reduce((acc: (number | string)[], p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-xs text-scilens-muted dark:text-scilens-darkmuted font-mono"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${item}`}
                    onClick={() => setCurrentPage(Number(item))}
                    className={clsx(
                      'w-8 h-8 rounded-lg text-xs font-mono font-medium transition-colors',
                      effectivePage === item
                        ? 'bg-scilens-teal text-white'
                        : 'border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] text-scilens-navy dark:text-white hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard'
                    )}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={effectivePage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard text-xs font-sans font-medium text-scilens-navy dark:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Paper Detailed Modal (Evidence Provenance, Never Fabricated) */}
      <Modal
        isOpen={!!activeDetailPaper}
        onClose={() => setActiveDetailPaper(null)}
        title={activeDetailPaper?.title || 'Paper Details'}
        subtitle={`Publication Year: ${activeDetailPaper?.year || 'Not explicitly reported.'} • Venue: ${activeDetailPaper?.venue || 'Not explicitly reported.'}`}
        maxWidth="2xl"
      >
        {activeDetailPaper && (
          <div className="space-y-4 text-xs font-sans leading-relaxed text-scilens-slate dark:text-scilens-darkmuted">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-scilens-parchment dark:bg-[#070D1E] rounded-lg border border-scilens-border dark:border-scilens-darkborder">
              <div>
                <span className="font-mono text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted block mb-0.5">Authors</span>
                <p className="text-scilens-navy dark:text-white font-medium">
                  {activeDetailPaper.authors && activeDetailPaper.authors.length > 0
                    ? activeDetailPaper.authors.join(', ')
                    : 'Not explicitly reported.'}
                </p>
              </div>
              {activeDetailPaper.relevanceTier && (
                <span
                  className={clsx(
                    'font-mono text-[10px] uppercase font-semibold px-2.5 py-1 rounded border',
                    activeDetailPaper.relevanceTier === 'DIRECT' &&
                      'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
                    activeDetailPaper.relevanceTier === 'FOUNDATIONAL' &&
                      'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
                    activeDetailPaper.relevanceTier === 'RELATED' &&
                      'bg-scilens-lightteal/40 border-scilens-borderteal text-scilens-teal dark:text-scilens-glowteal',
                    activeDetailPaper.relevanceTier === 'PERIPHERAL' &&
                      'bg-scilens-warmgray dark:bg-scilens-darkcard border-scilens-border dark:border-scilens-darkborder text-scilens-muted dark:text-scilens-darkmuted'
                  )}
                >
                  {activeDetailPaper.relevanceTier === 'DIRECT'
                    ? 'DIRECT EVIDENCE'
                    : activeDetailPaper.relevanceTier === 'FOUNDATIONAL'
                    ? 'FOUNDATIONAL CONTEXT'
                    : activeDetailPaper.relevanceTier === 'RELATED'
                    ? 'RELATED LITERATURE'
                    : 'PERIPHERAL CONTEXT'}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="font-serif text-sm font-semibold text-scilens-navy dark:text-white">
                Abstract
              </h4>
              <p className="p-3 bg-white dark:bg-[#0C1528] rounded-lg border border-scilens-border dark:border-scilens-darkborder">
                {activeDetailPaper.abstract || 'Not explicitly reported.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528]">
                <span className="font-mono text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted block mb-1">
                  Methodology
                </span>
                <p className="font-medium text-scilens-navy dark:text-white">
                  {activeDetailPaper.methodology || 'Not explicitly reported.'}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528]">
                <span className="font-mono text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted block mb-1">
                  Dataset / Context
                </span>
                <p className="font-medium text-scilens-navy dark:text-white">
                  {activeDetailPaper.dataset || 'Not explicitly reported.'}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528]">
                <span className="font-mono text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted block mb-1">
                  Population / Geography
                </span>
                <p className="font-medium text-scilens-navy dark:text-white">
                  {activeDetailPaper.population
                    ? `${activeDetailPaper.population}${activeDetailPaper.geography ? ` (${activeDetailPaper.geography})` : ''}`
                    : 'Not explicitly reported.'}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528]">
                <span className="font-mono text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted block mb-1">
                  Relevance Score &amp; Citations
                </span>
                <p className="font-medium text-scilens-navy dark:text-white font-mono">
                  {activeDetailPaper.relevance}% relevance • {activeDetailPaper.citationCount} citations
                </p>
              </div>
            </div>

            {activeDetailPaper.analysis?.keyFindings && activeDetailPaper.analysis.keyFindings.length > 0 && (
              <div className="p-3 bg-white dark:bg-[#0C1528] rounded-lg border border-scilens-border dark:border-scilens-darkborder space-y-1">
                <span className="font-mono text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted block">
                  Extracted Key Findings
                </span>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  {activeDetailPaper.analysis.keyFindings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeDetailPaper.analysis?.limitations && activeDetailPaper.analysis.limitations.length > 0 && (
              <div className="p-3 bg-white dark:bg-[#0C1528] rounded-lg border border-scilens-border dark:border-scilens-darkborder space-y-1">
                <span className="font-mono text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted block">
                  Declared Empirical Limitations
                </span>
                <ul className="list-disc pl-4 space-y-1 text-xs text-amber-800 dark:text-amber-300">
                  {activeDetailPaper.analysis.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-scilens-border dark:border-scilens-darkborder">
              {activeDetailPaper.sourceUrl ? (
                <a
                  href={activeDetailPaper.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-scilens-navy dark:bg-scilens-teal text-white font-sans font-medium text-xs hover:opacity-90 inline-flex items-center gap-1.5"
                >
                  <span>Open Scholarly Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-scilens-muted font-mono">Source URL: Not available</span>
              )}

              <button
                onClick={() => {
                  setSelectedPaperId(activeDetailPaper.id);
                  setActiveDetailPaper(null);
                  onNavigate('paper_analysis');
                }}
                className="px-4 py-2 rounded-lg border border-scilens-teal text-scilens-teal dark:text-scilens-glowteal font-sans font-medium text-xs hover:bg-scilens-teal hover:text-white transition-colors"
              >
                Deep Paper Analysis →
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Literature Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedFiles([]);
          setBatchResults([]);
          setUploadError(null);
          setUploadSuccess(false);
        }}
        title="Upload Research Papers"
        subtitle="Upload individual PDFs or a ZIP archive containing multiple research papers"
        maxWidth="lg"
      >
        <form onSubmit={handleProcessUpload} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase text-scilens-muted dark:text-scilens-darkmuted">
                Research Papers (PDF, ZIP)
              </label>
              <span className="text-[10px] font-mono text-scilens-teal dark:text-scilens-glowteal">
                Multiple PDFs or ZIP supported
              </span>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileSelect(e.dataTransfer.files);
                }
              }}
              className={clsx(
                'p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-scilens-teal bg-scilens-teal/10 dark:bg-scilens-glowteal/10'
                  : 'border-scilens-border dark:border-scilens-darkborder hover:border-scilens-teal dark:hover:border-scilens-glowteal'
              )}
            >
              <div className="flex items-center justify-center gap-2 mb-2 opacity-75">
                <FileText className="w-7 h-7 text-scilens-teal dark:text-scilens-glowteal" />
                <Archive className="w-6 h-6 text-scilens-muted dark:text-scilens-darkmuted" />
              </div>
              <p className="text-xs font-sans text-scilens-navy dark:text-white font-medium">
                Click to browse or drag & drop research papers here
              </p>
              <span className="text-[10px] text-scilens-muted dark:text-scilens-darkmuted font-mono block mt-1">
                Supported: PDF, ZIP (extracts all nested PDFs) • Multiple file selection enabled
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.zip,application/pdf,application/zip"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files);
                  }
                }}
              />
            </div>
          </div>

          {/* Selected Files Queue */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-scilens-muted dark:text-scilens-darkmuted">
                <span>Selected Queue ({selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}):</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-red-500 hover:underline text-[10px]"
                >
                  Clear All
                </button>
              </div>
              {selectedFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-scilens-warmgray/50 dark:bg-scilens-darkcard text-xs border border-scilens-border/60 dark:border-scilens-darkborder"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {f.name.toLowerCase().endsWith('.zip') ? (
                      <Archive className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-scilens-teal shrink-0" />
                    )}
                    <span className="truncate text-scilens-navy dark:text-white font-mono text-[11px]" title={f.name}>
                      {f.name}
                    </span>
                    <span className="text-[9px] text-scilens-muted font-mono shrink-0">
                      ({(f.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1 text-scilens-muted hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Per-Document Processing Results */}
          {batchResults.length > 0 && (
            <div className="space-y-1.5 p-3 bg-scilens-warmgray/40 dark:bg-[#070D1E] rounded-xl border border-scilens-border dark:border-scilens-darkborder">
              <span className="text-[10px] font-mono uppercase tracking-wider text-scilens-muted block mb-1">
                Processing Status ({batchResults.filter((r) => r.status === 'completed').length}/{batchResults.length} Indexed)
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {batchResults.map((res, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'flex items-center justify-between p-2 rounded text-xs font-mono',
                      res.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {res.status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="truncate text-[11px]" title={res.filename}>
                        {res.filename}
                      </span>
                      {res.extracted_from && (
                        <span className="text-[9px] text-scilens-muted font-mono opacity-80 shrink-0">
                          (from {res.extracted_from})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] shrink-0 font-medium ml-2">
                      {res.status === 'completed'
                        ? `Complete • ${res.pages || 0} pages`
                        : (res.error || 'Failed')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase text-scilens-muted dark:text-scilens-darkmuted">
              Or Fetch by DOI / Identifier
            </label>
            <input
              type="text"
              placeholder="e.g. 10.1038/s41591-024-02890-x or arXiv:2403.12345"
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              className="w-full px-3 py-2 text-xs font-sans rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] text-scilens-navy dark:text-white focus:outline-none focus:border-scilens-teal"
            />
          </div>

          {uploadError && (
            <p className="text-xs text-red-500 font-sans">{uploadError}</p>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {batchResults.length > 0
                  ? `Batch processing finished: ${batchResults.filter((r) => r.status === 'completed').length} publication(s) indexed!`
                  : 'Publication indexed and added to active corpus!'}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-scilens-border dark:border-scilens-darkborder">
            <button
              type="button"
              onClick={() => {
                setIsUploadModalOpen(false);
                setSelectedFiles([]);
                setBatchResults([]);
              }}
              className="px-4 py-2 rounded-lg border border-scilens-border dark:border-scilens-darkborder text-xs font-sans text-scilens-navy dark:text-white hover:bg-scilens-warmgray"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={uploading || (selectedFiles.length === 0 && !identifierInput)}
              className="px-4 py-2 rounded-lg bg-scilens-teal text-white text-xs font-sans font-medium hover:bg-scilens-darkteal disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing & Indexing...</span>
                </>
              ) : (
                <span>
                  {selectedFiles.length > 1
                    ? `Upload & Process (${selectedFiles.length} files)`
                    : 'Upload & Index'}
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
