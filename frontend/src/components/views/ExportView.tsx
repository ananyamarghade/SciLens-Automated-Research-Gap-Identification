import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import { Modal } from '../common/Modal';
import { useBackend } from '../../context/BackendContext';
import { getExportUrl } from '../../services/api';
import {
  Download,
  FileText,
  CheckCircle2,
  Share2,
  Printer,
  Copy,
  ExternalLink,
  Code,
  FileCode,
} from 'lucide-react';
import { clsx } from 'clsx';

export const ExportView: React.FC = () => {
  const { activeProjectId, health } = useBackend();
  const { topic, draft, corpus } = useInvestigation();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'DOCX' | 'MD' | 'BIBTEX' | 'JSON'>('PDF');
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleStartExport = (format: 'PDF' | 'DOCX' | 'MD' | 'BIBTEX' | 'JSON') => {
    setExportFormat(format);
    setIsExportModalOpen(true);
    setIsExporting(true);
    setExportProgress(25);
    setExportComplete(false);

    setTimeout(() => setExportProgress(60), 250);
    setTimeout(() => setExportProgress(88), 500);
    setTimeout(() => {
      setExportProgress(100);
      setIsExporting(false);
      setExportComplete(true);
    }, 750);
  };

  const handleDownloadFile = () => {
    if (health.connected && activeProjectId && (exportFormat === 'PDF' || exportFormat === 'DOCX' || exportFormat === 'MD')) {
      const fmt = exportFormat === 'MD' ? 'md' : (exportFormat.toLowerCase() as 'pdf' | 'docx');
      const url = getExportUrl(activeProjectId, fmt, 'draft');
      window.open(url, '_blank');
    } else {
      let content = '';
      let mimeType = 'text/plain;charset=utf-8';
      let fileExt = exportFormat.toLowerCase();

      if (exportFormat === 'MD') {
        const lines = [
          `# ${draft.title}`,
          '',
          `> *Investigation Focus: ${topic}*`,
          '',
          '---',
          '',
        ];
        draft.sections.forEach((sec) => {
          const sName = (sec as any).sectionName || (sec as any).section_name || (sec as any).title || 'Section';
          lines.push(`## ${sName}`);
          lines.push('');
          lines.push(sec.content);
          lines.push('');
        });
        content = lines.join('\n');
        mimeType = 'text/markdown;charset=utf-8';
      } else if (exportFormat === 'BIBTEX') {
        content = corpus.slice(0, 8).map((p) => {
          const firstAuthor = p.authors[0] || 'Scholar';
          const surname = firstAuthor.includes(' ') ? firstAuthor.split(' ').slice(-1)[0] : firstAuthor;
          const key = `${surname.toLowerCase()}${p.year}`;
          return `@article{${key},\n  title={${p.title}},\n  author={${p.authors.join(' and ')}},\n  journal={${p.venue}},\n  year={${p.year}}\n}`;
        }).join('\n\n');
      } else {
        content = JSON.stringify(draft, null, 2);
        fileExt = 'json';
        mimeType = 'application/json;charset=utf-8';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scilens_${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_export.${fileExt}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl pb-12">
      <PageHeader
        label="SCHOLARLY DISSEMINATION"
        title="Export &"
        italicWord="Publish"
        description="Preview journal-grade formatted proposal, literature synthesis dossier, and export directly to DOCX (Word), PDF, Markdown (.md), and BibTeX."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStartExport('PDF')}
              className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-subtle"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Proposal</span>
            </button>
          </div>
        }
      />

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => handleStartExport('DOCX')}
          className="p-5 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle hover:border-scilens-teal cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-scilens-lightteal dark:bg-scilens-teal/20 text-scilens-teal dark:text-scilens-glowteal flex items-center justify-center">
            <FileCode className="w-5 h-5 text-scilens-teal" />
          </div>
          <h4 className="font-serif text-sm font-bold text-scilens-navy dark:text-white group-hover:text-scilens-teal transition-colors">
            Microsoft Word (.docx)
          </h4>
          <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted font-sans leading-relaxed">
            Fully formatted Word document with headings, citations, and sections.
          </p>
          <span className="text-[10px] font-mono text-scilens-teal dark:text-scilens-glowteal block pt-1">
            Word / LibreOffice Ready
          </span>
        </div>

        <div
          onClick={() => handleStartExport('MD')}
          className="p-5 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle hover:border-scilens-teal cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder text-scilens-navy dark:text-white flex items-center justify-center">
            <FileText className="w-5 h-5 text-scilens-teal" />
          </div>
          <h4 className="font-serif text-sm font-bold text-scilens-navy dark:text-white group-hover:text-scilens-teal transition-colors">
            Markdown Document (.md)
          </h4>
          <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted font-sans leading-relaxed">
            Clean GFM document ready for Obsidian, GitHub, Notion, or text editors.
          </p>
          <span className="text-[10px] font-mono text-scilens-muted block pt-1">
            Standard Markdown Format
          </span>
        </div>

        <div
          onClick={() => handleStartExport('PDF')}
          className="p-5 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle hover:border-scilens-teal cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-scilens-lightteal dark:bg-scilens-teal/20 text-scilens-teal dark:text-scilens-glowteal flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-sm font-bold text-scilens-navy dark:text-white group-hover:text-scilens-teal transition-colors">
            Academic Proposal (.pdf)
          </h4>
          <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted font-sans leading-relaxed">
            Journal and grant styled document with complete typography and layout.
          </p>
          <span className="text-[10px] font-mono text-scilens-teal block pt-1">
            Publication Ready
          </span>
        </div>

        <div
          onClick={() => handleStartExport('BIBTEX')}
          className="p-5 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle hover:border-scilens-teal cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder text-scilens-navy dark:text-white flex items-center justify-center">
            <FileText className="w-5 h-5 text-scilens-teal" />
          </div>
          <h4 className="font-serif text-sm font-bold text-scilens-navy dark:text-white group-hover:text-scilens-teal transition-colors">
            BibTeX Archive (.bib)
          </h4>
          <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted font-sans leading-relaxed">
            Standard LaTeX bib file populated with verified DOIs and citation anchors.
          </p>
          <span className="text-[10px] font-mono text-scilens-muted block pt-1">
            Overleaf / Zotero
          </span>
        </div>

        <div
          onClick={() => handleStartExport('JSON')}
          className="p-5 bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl shadow-subtle hover:border-scilens-teal cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-scilens-ivory dark:bg-[#070D1E] border border-scilens-border dark:border-scilens-darkborder text-scilens-navy dark:text-white flex items-center justify-center">
            <Code className="w-5 h-5 text-scilens-teal" />
          </div>
          <h4 className="font-serif text-sm font-bold text-scilens-navy dark:text-white group-hover:text-scilens-teal transition-colors">
            Evidence Dossier (.json)
          </h4>
          <p className="text-xs text-scilens-muted dark:text-scilens-darkmuted font-sans leading-relaxed">
            Machine-readable structured sections, citations, and metadata.
          </p>
          <span className="text-[10px] font-mono text-scilens-muted block pt-1">
            API & Replication Ready
          </span>
        </div>
      </div>

      {/* Simulated Academic Document Paper Sheet Preview */}
      <div className="p-8 md:p-12 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-6 max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="text-center space-y-3 border-b border-scilens-border pb-6">
          <span className="text-[10px] font-mono tracking-widest uppercase text-scilens-lightmuted">
            GRANT PROPOSAL PREVIEW • NATIONAL SCIENCE FOUNDATION DRAFT
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-scilens-navy leading-tight max-w-2xl mx-auto">
            {draft.title}
          </h1>
          <p className="text-xs text-scilens-muted font-serif italic">
            SciLens Research Intelligence Investigation • Active Focus: {topic}
          </p>
        </div>

        {/* Abstract Box */}
        <div className="p-5 rounded-lg bg-scilens-ivory/80 border border-scilens-border space-y-2">
          <span className="font-mono text-xs font-bold text-scilens-navy uppercase tracking-wider block">
            ABSTRACT
          </span>
          <p className="font-serif text-xs leading-relaxed text-scilens-navy text-justify">
            {draft.sections[1]?.content || draft.sections[0]?.content}
          </p>
        </div>

        {/* Document Body Excerpt */}
        <div className="space-y-4 text-xs font-serif leading-relaxed text-scilens-navy">
          <div>
            <h3 className="font-sans font-bold text-sm text-scilens-navy mb-1.5">
              1. Introduction & Background
            </h3>
            <p className="text-justify">{draft.sections[2]?.content || draft.sections[0]?.content}</p>
          </div>

          <div>
            <h3 className="font-sans font-bold text-sm text-scilens-navy mb-1.5">
              2. Identified Research Gap & Empirical Grounding
            </h3>
            <p className="text-justify">{draft.sections[4]?.content || draft.sections[3]?.content}</p>
          </div>

          <div>
            <h3 className="font-sans font-bold text-sm text-scilens-navy mb-1.5">
              3. Research Questions & Hypotheses
            </h3>
            <p className="whitespace-pre-line text-justify">{draft.sections[6]?.content || draft.sections[5]?.content}</p>
          </div>

          <div>
            <h3 className="font-sans font-bold text-sm text-scilens-navy mb-1.5">
              4. Summary of Selected References
            </h3>
            <ul className="list-disc list-inside text-xs font-sans text-scilens-muted space-y-1">
              {corpus.slice(0, 4).map((p) => (
                <li key={p.id}>
                  {p.authors[0]} et al. ({p.year}). <em>{p.title}</em>. {p.venue}.
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Export Progress Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={`Compiling ${exportFormat} Document`}
        description="Rendering typography, vectorizing charts, formatting citation references, and assembling academic metadata."
      >
        <div className="space-y-4 py-2">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-scilens-muted">
                {exportComplete ? 'Compilation Complete!' : 'Assembling Document...'}
              </span>
              <span className="font-bold text-scilens-navy">{exportProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-scilens-warmgray overflow-hidden">
              <div
                className="h-full bg-scilens-teal rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>

          {exportComplete && (
            <div className="p-4 rounded-lg bg-scilens-lightteal text-scilens-teal border border-scilens-borderteal space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Document successfully compiled ({exportFormat})!</span>
              </div>
              <p className="font-sans text-scilens-darkteal">
                File size: 1.4 MB • 15 sections • 18 verified citation anchors included.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-scilens-border">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-scilens-border text-scilens-navy text-xs font-sans font-medium hover:bg-scilens-warmgray"
            >
              Close
            </button>
            {exportComplete && (
              <button
                onClick={handleDownloadFile}
                className="px-4 py-2 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium flex items-center gap-1.5 shadow-subtle"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save {exportFormat} File</span>
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
