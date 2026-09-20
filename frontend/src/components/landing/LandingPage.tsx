import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll } from 'framer-motion';
import {
  ArrowRight,
  Plus,
  Search,
  Moon,
  Sun,
  FileText,
  Layers,
  Split,
  SearchCheck,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { HeroGlobeContainer } from './HeroGlobeContainer';
import { useTheme } from '../../context/ThemeContext';
import { useBackend } from '../../context/BackendContext';
import { useInvestigation } from '../../context/InvestigationContext';
import { useAuth } from '../../context/AuthContext';
import { SciLensLogo } from '../common/SciLensLogo';

interface LandingPageProps {
  onEnterWorkspace: (topic?: string, initialView?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace }) => {
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const [topicInput, setTopicInput] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { health, isStartingWorkflow } = useBackend();
  const { topic } = useInvestigation();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();

  // Scroll tracking for the hero section
  useEffect(() => {
    const handleScroll = () => {
      const el = heroContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollHeight = el.offsetHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const currentScroll = Math.max(0, -rect.top);
      const progress = Math.min(1, Math.max(0, currentScroll / scrollHeight));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }
    const target = topicInput.trim() || topic || 'How artificial intelligence changes modern education and writing';
    onEnterWorkspace(target, 'overview');
  };

  return (
    <div className="bg-scilens-ivory dark:bg-[#070D1E] text-scilens-navy dark:text-[#E2E8F0] min-h-screen transition-colors duration-300">
      {/* 1. TOP NAVBAR */}
      <nav className="fixed top-0 inset-x-0 h-20 border-b border-scilens-border/70 dark:border-scilens-darkborder/80 bg-scilens-ivory/90 dark:bg-[#070D1E]/90 backdrop-blur-md z-50 px-6 md:px-12 flex items-center justify-between transition-colors">
        {/* Left: SciLens Official Logo */}
        <SciLensLogo
          size="lg"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        {/* Right: Nav links, Theme Toggle, Sign In, Open Workspace */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-7 text-xs font-sans font-medium text-scilens-muted dark:text-scilens-darkmuted">
            <a href="#how-it-works" className="hover:text-scilens-navy dark:hover:text-white transition-colors">
              Research
            </a>
            <a href="#how-it-works" className="hover:text-scilens-navy dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#how-it-works" className="hover:text-scilens-navy dark:hover:text-white transition-colors">
              About
            </a>
          </div>

          {/* Auth Button or User Badge */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-scilens-warmgray dark:bg-[#0C1528] text-scilens-navy dark:text-white border border-scilens-border dark:border-scilens-darkborder truncate max-w-[140px]">
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
              type="button"
              onClick={() => openAuthModal('signin')}
              className="text-xs font-sans font-medium text-scilens-navy dark:text-white hover:text-scilens-teal dark:hover:text-scilens-glowteal transition-colors px-2 py-1 cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Dark / Light Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full border border-scilens-border dark:border-scilens-darkborder text-scilens-navy dark:text-white hover:bg-scilens-warmgray dark:hover:bg-scilens-darkcard transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-scilens-navy" />
            )}
          </button>

          {/* Open Workspace Button */}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('signin');
                return;
              }
              onEnterWorkspace(topicInput.trim() || topic);
            }}
            className="px-4.5 py-2.5 rounded-full border border-scilens-teal/80 dark:border-scilens-glowteal text-scilens-teal dark:text-scilens-glowteal hover:bg-scilens-teal hover:text-white dark:hover:bg-scilens-glowteal dark:hover:text-scilens-navy text-xs font-sans font-medium transition-all shadow-subtle flex items-center gap-1.5 group cursor-pointer"
          >
            <span>Open workspace</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION: TWO-COLUMN COMPOSITION (Sticky Scroll Viewport) */}
      <div ref={heroContainerRef} className="relative h-[220vh] w-full">
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-8">
          <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* LEFT COLUMN: Editorial Typography, Search & Inputs */}
            <div className="lg:col-span-5 space-y-7 z-20">
              {/* Eyebrow */}
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-block text-[11px] font-mono tracking-[0.26em] uppercase text-scilens-teal dark:text-scilens-glowteal font-semibold"
              >
                AGENTIC RESEARCH INTELLIGENCE
              </motion.span>

              {/* Headline */}
              <div className="space-y-0.5 overflow-hidden">
                <motion.h1
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal uppercase tracking-tight text-scilens-navy dark:text-white leading-[1.06]"
                >
                  See beyond
                </motion.h1>
                <motion.h1
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                  className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal italic tracking-tight text-scilens-teal dark:text-scilens-glowteal leading-[1.06]"
                >
                  the literature.
                </motion.h1>
              </div>

              {/* Supporting Text */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-xs sm:text-sm text-scilens-muted dark:text-scilens-darkmuted font-sans font-normal leading-relaxed max-w-md"
              >
                Map the field. Find what’s missing.
                <br />
                Test whether the gap survives.
              </motion.p>

              {/* Search & Investigation Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65 }}
                className="pt-2 space-y-3"
              >
                <span className="block text-[10px] font-mono tracking-wider uppercase text-scilens-lightmuted dark:text-scilens-darklightmuted font-semibold">
                  WHAT ARE YOU INVESTIGATING?
                </span>

                <form onSubmit={handleStart} className="space-y-3 max-w-md">
                  {/* Unified Search Input Bar (Matching Image!) */}
                  <div className="flex items-center rounded-xl border border-scilens-border dark:border-scilens-darkborder bg-white dark:bg-[#0C1528] shadow-subtle p-1.5 focus-within:border-scilens-teal dark:focus-within:border-scilens-glowteal transition-all">
                    <Search className="w-4 h-4 text-scilens-muted dark:text-scilens-darkmuted ml-2.5 shrink-0" />
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="e.g. How artificial intelligence changes modern education and writing, Climate modeling..."
                      className="w-full px-3 py-2 text-xs sm:text-sm font-sans bg-transparent text-scilens-navy dark:text-white placeholder:text-scilens-lightmuted focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-lg bg-scilens-navy hover:bg-scilens-slate dark:bg-scilens-teal dark:hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-all shadow-subtle flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>Begin Investigation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Secondary Link: + Add research papers */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          openAuthModal('signin');
                          return;
                        }
                        onEnterWorkspace(topicInput.trim() || topic, 'literature');
                      }}
                      className="text-xs font-sans text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-scilens-teal dark:text-scilens-glowteal" />
                      <span>Add research papers</span>
                    </button>
                  </div>
                </form>

                {/* Subtle Scroll Hint */}
                <div className="pt-2 text-[10px] font-mono text-scilens-lightmuted dark:text-scilens-darklightmuted flex items-center gap-2">
                  <span>↓ Scroll down to examine research artifacts</span>
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Large Rotating Earth + Orbiting Cards + Floating Words */}
            <div className="lg:col-span-7 h-full flex items-center justify-center relative">
              <HeroGlobeContainer
                scrollProgress={scrollProgress}
                onSelectGap={() => onEnterWorkspace(topicInput.trim() || topic, 'gap_investigator')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION AFTER HERO: "FROM LITERATURE TO DISCOVERY" (Matching Specification!) */}
      <section id="how-it-works" className="py-32 border-t border-scilens-border/80 dark:border-scilens-darkborder bg-scilens-parchment/60 dark:bg-[#0A1226]/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-16 space-y-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-scilens-teal dark:text-scilens-glowteal font-semibold block">
              FROM LITERATURE TO DISCOVERY.
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-scilens-navy dark:text-white">
              How SciLens Investigates
            </h2>
            <p className="text-sm text-scilens-muted dark:text-scilens-darkmuted max-w-xl font-light leading-relaxed">
              Scientific intelligence moves from passive summarization into active empirical discovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 01 */}
            <div className="bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl p-8 shadow-subtle flex flex-col justify-between hover:border-scilens-teal/60 dark:hover:border-scilens-glowteal/60 transition-all">
              <div>
                <span className="font-serif text-3xl md:text-4xl font-light text-scilens-teal dark:text-scilens-glowteal mb-4 block">
                  01
                </span>
                <h3 className="font-serif text-xl font-semibold text-scilens-navy dark:text-white mb-2">
                  SEE THE FIELD
                </h3>
                <p className="text-xs md:text-sm text-scilens-muted dark:text-scilens-darkmuted font-light leading-relaxed">
                  Understand what has already been studied. Ingest hundreds of full-text papers across OpenAlex, arXiv, and CrossRef, building unified semantic landscapes.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-scilens-border/60 dark:border-scilens-darkborder text-[11px] font-mono text-scilens-teal dark:text-scilens-glowteal flex items-center gap-1">
                <span>Semantic Cartography</span>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl p-8 shadow-subtle flex flex-col justify-between hover:border-scilens-teal/60 dark:hover:border-scilens-glowteal/60 transition-all">
              <div>
                <span className="font-serif text-3xl md:text-4xl font-light text-scilens-teal dark:text-scilens-glowteal mb-4 block">
                  02
                </span>
                <h3 className="font-serif text-xl font-semibold text-scilens-navy dark:text-white mb-2">
                  LOOK CLOSER
                </h3>
                <p className="text-xs md:text-sm text-scilens-muted dark:text-scilens-darkmuted font-light leading-relaxed">
                  Examine methods, populations, datasets, findings, and declared limitations. Every chunk retains traceable page numbers and section boundaries.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-scilens-border/60 dark:border-scilens-darkborder text-[11px] font-mono text-scilens-teal dark:text-scilens-glowteal flex items-center gap-1">
                <span>Section-Aware RAG</span>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-white dark:bg-[#0C1528] border border-scilens-border dark:border-scilens-darkborder rounded-xl p-8 shadow-subtle flex flex-col justify-between hover:border-scilens-teal/60 dark:hover:border-scilens-glowteal/60 transition-all">
              <div>
                <span className="font-serif text-3xl md:text-4xl font-light text-scilens-teal dark:text-scilens-glowteal mb-4 block">
                  03
                </span>
                <h3 className="font-serif text-xl font-semibold text-scilens-navy dark:text-white mb-2">
                  FIND WHAT'S MISSING
                </h3>
                <p className="text-xs md:text-sm text-scilens-muted dark:text-scilens-darkmuted font-light leading-relaxed">
                  Detect patterns, contradictions, and underexplored areas. The Evidence Critic actively tries to disprove the candidate gap before validating it.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-scilens-border/60 dark:border-scilens-darkborder text-[11px] font-mono text-scilens-teal dark:text-scilens-glowteal flex items-center gap-1">
                <span>Adversarial Scrutiny Loop</span>
              </div>
            </div>
          </div>

          {/* 4. READY TO COMMENCE INQUIRY CTA BANNER */}
          <div className="mt-16 p-8 md:p-10 bg-scilens-navy dark:bg-[#0C1528] text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-layer border border-white/10">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-scilens-lightteal dark:text-scilens-glowteal block font-semibold">
                READY TO COMMENCE INQUIRY
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-medium">
                Enter the Research Intelligence Workspace
              </h3>
              <p className="text-xs sm:text-sm text-scilens-subtle dark:text-scilens-darkmuted font-light max-w-xl">
                Explore the complete multi-agent pipeline: literature synthesis, gap investigation, hypothesis development, citation generation, and export.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEnterWorkspace(topicInput.trim() || topic, 'overview')}
              className="px-6 py-3.5 rounded-lg bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-all shadow-subtle shrink-0 flex items-center gap-2 group cursor-pointer"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-6 border-t border-scilens-border dark:border-scilens-darkborder bg-scilens-ivory dark:bg-[#070D1E] text-xs font-mono text-scilens-muted dark:text-scilens-darkmuted px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>© {new Date().getFullYear()} SciLens. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 text-[11px]">
          <a href="#how-it-works" className="hover:text-scilens-navy dark:hover:text-white transition-colors">
            Research Pipeline
          </a>
          <span>•</span>
          <a href="#how-it-works" className="hover:text-scilens-navy dark:hover:text-white transition-colors">
            Documentation
          </a>
        </div>
      </footer>
    </div>
  );
};
