import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  HelpCircle,
  Play,
  RotateCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Server,
  ExternalLink,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { activeProject, sampleTopics } from '../../data/research';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';
import { useBackend } from '../../context/BackendContext';
import { useAuth } from '../../context/AuthContext';
import { SciLensLogo } from '../common/SciLensLogo';

interface TopbarProps {
  onToggleMobileMenu: () => void;
  currentTopic: string;
  onSelectTopic: (topic: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  currentTopic,
  onSelectTopic,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { health, activeProjectId, projectStatus, refreshHealth, backendUrl } = useBackend();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshHealth();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const currentAgent = projectStatus?.current_agent || activeProject.currentAgent;

  return (
    <>
      <header className="h-16 border-b border-scilens-border dark:border-scilens-darkborder bg-white/90 dark:bg-[#0C1528]/90 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-md text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard lg:hidden"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <SciLensLogo
            size="sm"
            showWordmark={false}
            className="lg:hidden shrink-0"
          />

          <div className="hidden sm:flex items-center gap-2 border-r border-scilens-border dark:border-scilens-darkborder pr-4">
            <span className="w-2 h-2 rounded-full bg-scilens-teal dark:bg-scilens-glowteal" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-scilens-muted dark:text-scilens-darkmuted font-medium">
              INVESTIGATION:
            </span>
          </div>

          <button
            onClick={() => setIsTopicModalOpen(true)}
            className="flex items-center gap-2 group text-left max-w-xs md:max-w-md lg:max-w-xl truncate hover:opacity-80 transition-opacity"
          >
            <span className="text-xs md:text-sm font-sans font-medium text-scilens-navy dark:text-white truncate">
              {currentTopic}
            </span>
            <span className="text-[10px] font-mono text-scilens-teal dark:text-scilens-glowteal bg-scilens-lightteal dark:bg-scilens-teal/20 px-1.5 py-0.5 rounded shrink-0 hidden md:inline-block">
              Change
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* User Profile or Sign In Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-scilens-warmgray dark:bg-[#0C1528] text-scilens-navy dark:text-white border border-scilens-border dark:border-scilens-darkborder truncate max-w-[130px]">
                {user.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-xs font-sans text-scilens-muted dark:text-scilens-darkmuted hover:text-rose-600 transition-colors px-1 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="text-xs font-sans font-medium text-scilens-navy dark:text-white hover:text-scilens-teal dark:hover:text-scilens-glowteal transition-colors px-2 py-1 cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Theme Toggle Button in Workspace Topbar */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard transition-colors"
            title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-scilens-navy" />
            )}
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded-full text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard transition-colors"
            title="SciLens Methodology Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title="Select Active Investigation Topic"
        subtitle="Switch or enter a new scientific research domain"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const clean = customTopicInput.trim();
              if (clean) {
                onSelectTopic(clean);
                setCustomTopicInput('');
                setIsTopicModalOpen(false);
              }
            }}
            className="space-y-2"
          >
            <label className="text-xs font-mono font-medium uppercase tracking-wider text-scilens-slate dark:text-scilens-darkmuted flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-scilens-teal dark:text-scilens-glowteal" />
              <span>Search or Enter Any Custom Topic</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                placeholder="e.g., Quantum error correction, CRISPR off-target, Climate tipping points..."
                className="flex-1 px-3 py-2 text-xs font-sans rounded-lg border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#070D1E] text-scilens-navy dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-scilens-teal dark:focus:ring-scilens-glowteal"
              />
              <button
                type="submit"
                disabled={!customTopicInput.trim()}
                className="px-4 py-2 text-xs font-sans font-medium rounded-lg bg-scilens-teal hover:bg-scilens-teal/90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
              >
                Investigate
              </button>
            </div>
          </form>

          <div className="relative py-2 flex items-center">
            <div className="flex-grow border-t border-scilens-border dark:border-scilens-darkborder" />
            <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-wider text-scilens-muted dark:text-scilens-darkmuted">
              Or Select Benchmark Domain
            </span>
            <div className="flex-grow border-t border-scilens-border dark:border-scilens-darkborder" />
          </div>

          <div className="space-y-2">
            {sampleTopics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectTopic(topic);
                  setIsTopicModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-lg border text-xs font-sans transition-all flex items-start justify-between gap-3 ${
                  topic === currentTopic
                    ? 'border-scilens-teal bg-scilens-lightteal/40 dark:bg-scilens-teal/20 text-scilens-navy dark:text-white font-medium'
                    : 'border-scilens-border dark:border-scilens-darkborder hover:bg-scilens-parchment dark:hover:bg-scilens-darkcard text-scilens-slate dark:text-scilens-darkmuted'
                }`}
              >
                <span>{topic}</span>
                {topic === currentTopic && (
                  <CheckCircle2 className="w-4 h-4 text-scilens-teal dark:text-scilens-glowteal shrink-0 mt-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="SciLens Scientific Method & Architecture"
        subtitle="Agentic research gap identification methodology"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs text-scilens-slate dark:text-scilens-darkmuted font-sans leading-relaxed">
          <div className="p-3 bg-scilens-parchment dark:bg-scilens-darkcard rounded-lg border border-scilens-border dark:border-scilens-darkborder">
            <h4 className="font-serif text-sm font-semibold text-scilens-navy dark:text-white mb-1">
              Adversarial Gap Scrutiny
            </h4>
            <p>
              Unlike conventional literature summarizers that passively corroborate assumptions, SciLens actively seeks to <em>disprove</em> candidate gaps by retrieving recent counter-evidence, pre-prints, and cross-methodological replications before assigning a "Validated" verdict.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 border border-scilens-border dark:border-scilens-darkborder rounded-lg">
              <span className="font-mono text-[10px] text-scilens-teal dark:text-scilens-glowteal uppercase font-bold">
                01. Mapping
              </span>
              <p className="mt-1 text-scilens-muted dark:text-scilens-darkmuted">
                Section-aware RAG extraction preserving exact page numbers, methodologies, populations, and declared limitations.
              </p>
            </div>
            <div className="p-3 border border-scilens-border dark:border-scilens-darkborder rounded-lg">
              <span className="font-mono text-[10px] text-scilens-teal dark:text-scilens-glowteal uppercase font-bold">
                02. Detection
              </span>
              <p className="mt-1 text-scilens-muted dark:text-scilens-darkmuted">
                Systematic categorization across 9 gap dimensions (Population, Methodological, Temporal, Technological, Contradictions).
              </p>
            </div>
            <div className="p-3 border border-scilens-border dark:border-scilens-darkborder rounded-lg">
              <span className="font-mono text-[10px] text-scilens-teal dark:text-scilens-glowteal uppercase font-bold">
                03. Investigation
              </span>
              <p className="mt-1 text-scilens-muted dark:text-scilens-darkmuted">
                Cyclic multi-iteration feedback loop querying external databases to challenge candidate gaps against counter-literature.
              </p>
            </div>
            <div className="p-3 border border-scilens-border dark:border-scilens-darkborder rounded-lg">
              <span className="font-mono text-[10px] text-scilens-teal dark:text-scilens-glowteal uppercase font-bold">
                04. Development
              </span>
              <p className="mt-1 text-scilens-muted dark:text-scilens-darkmuted">
                Translation of validated gaps into testable research questions, objectives, hypotheses, and citation-grounded drafts.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Backend & LangGraph Engine Diagnostic Modal */}
      <Modal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        title="SciLens Agentic Backend Engine Status"
        subtitle="FastAPI REST Services, SQLite Corpus & LangGraph Multi-Agent Runtime"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs font-sans">
          {/* Status Header Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              health.connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  health.connected
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-sm font-bold">
                    {health.connected ? 'Backend Server Online' : 'Backend Server Offline'}
                  </h4>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                      health.connected
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {health.status}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5 font-mono">
                  {backendUrl}
                </p>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-lg border border-current hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 font-mono text-[11px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking...' : 'Check Ping'}</span>
            </button>
          </div>

          {/* Diagnostics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
            <div className="p-3.5 rounded-lg bg-scilens-parchment dark:bg-scilens-darkcard border border-scilens-border dark:border-scilens-darkborder space-y-1">
              <span className="text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted">
                ACTIVE RESEARCH ID
              </span>
              <p className="text-xs font-semibold text-scilens-navy dark:text-white truncate">
                {activeProjectId}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-scilens-parchment dark:bg-scilens-darkcard border border-scilens-border dark:border-scilens-darkborder space-y-1">
              <span className="text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted">
                ACTIVE AGENT & WORKFLOW
              </span>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-scilens-navy dark:text-white">
                  {currentAgent}
                </p>
                <span className="text-[10px] text-scilens-teal dark:text-scilens-glowteal font-bold">
                  {projectStatus?.status || 'idle'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-scilens-parchment dark:bg-scilens-darkcard border border-scilens-border dark:border-scilens-darkborder space-y-1">
              <span className="text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted">
                DATABASE ENGINE
              </span>
              <p className="text-xs font-semibold text-scilens-navy dark:text-white">
                SQLite + SQLAlchemy ORM
              </p>
              <p className="text-[10px] text-scilens-muted dark:text-scilens-darkmuted">
                data/scilens.db
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-scilens-parchment dark:bg-scilens-darkcard border border-scilens-border dark:border-scilens-darkborder space-y-1">
              <span className="text-[10px] uppercase text-scilens-muted dark:text-scilens-darkmuted">
                VECTOR SIMILARITY SEARCH
              </span>
              <p className="text-xs font-semibold text-scilens-navy dark:text-white">
                FAISS Dense Index
              </p>
              <p className="text-[10px] text-scilens-muted dark:text-scilens-darkmuted">
                HuggingFace / OpenAI Embeddings
              </p>
            </div>
          </div>

          {/* Quick Links to Backend Swagger Docs & Gradio */}
          <div className="p-3.5 rounded-lg bg-scilens-parchment/60 dark:bg-scilens-darkcard/60 border border-scilens-border dark:border-scilens-darkborder space-y-2">
            <span className="text-[10px] font-mono uppercase text-scilens-muted dark:text-scilens-darkmuted tracking-wider block">
              DEVELOPER INTERFACES
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`${backendUrl}/docs`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-md bg-scilens-navy dark:bg-scilens-teal text-white text-xs font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
              >
                <span>FastAPI Swagger UI (/docs)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={`${backendUrl}/gradio`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-md border border-scilens-border dark:border-scilens-darkborder text-scilens-navy dark:text-white text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Gradio Agent Visualizer (/gradio)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {!health.connected && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>How to start the SciLens backend:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Run <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">uvicorn backend.app.main:app --reload --port 8000</code> in your terminal. SciLens will automatically connect and stream live agents.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
