import React from 'react';
import {
  Compass,
  BookOpen,
  FileText,
  Map,
  Split,
  SearchCheck,
  Activity,
  Lightbulb,
  FileEdit,
  CheckCircle2,
  Download,
  ShieldAlert,
  MessageSquareText,
  Home,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useInvestigation } from '../../context/InvestigationContext';
import { SciLensLogo } from '../common/SciLensLogo';

export type WorkspaceView =
  | 'overview'
  | 'literature'
  | 'paper_analysis'
  | 'landscape'
  | 'gaps'
  | 'gap_investigator'
  | 'agent_activity'
  | 'development'
  | 'draft_builder'
  | 'references'
  | 'export'
  | 'challenge'
  | 'ask';

interface SidebarProps {
  currentView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  onGoHome: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: WorkspaceView;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onGoHome,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { corpus, gaps, topic } = useInvestigation();

  const sections: NavSection[] = [
    {
      title: 'RESEARCH',
      items: [
        { id: 'overview', label: 'Overview', icon: Compass },
        { id: 'literature', label: 'Literature', icon: BookOpen, badge: corpus.length > 0 ? String(corpus.length) : undefined },
        { id: 'paper_analysis', label: 'Paper Analysis', icon: FileText },
        { id: 'landscape', label: 'Landscape', icon: Map },
        { id: 'gaps', label: 'Gap Analysis', icon: Split, badge: gaps.length > 0 ? String(gaps.length) : undefined },
        { id: 'gap_investigator', label: 'Gap Investigator', icon: SearchCheck },
        { id: 'agent_activity', label: 'Agent Activity', icon: Activity },
      ],
    },
    {
      title: 'DEVELOP',
      items: [
        { id: 'development', label: 'Research Development', icon: Lightbulb },
        { id: 'draft_builder', label: 'Draft Builder', icon: FileEdit },
      ],
    },
    {
      title: 'VERIFY',
      items: [
        { id: 'references', label: 'References & Verification', icon: CheckCircle2 },
      ],
    },
    {
      title: 'OUTPUT',
      items: [
        { id: 'export', label: 'Export', icon: Download },
      ],
    },
    {
      title: 'ADDITIONAL',
      items: [
        { id: 'challenge', label: 'Challenge My Idea', icon: ShieldAlert },
        { id: 'ask', label: 'Ask SciLens', icon: MessageSquareText },
      ],
    },
  ];

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-scilens-navy/50 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={clsx(
          'fixed lg:static top-0 left-0 bottom-0 z-40 w-64 bg-scilens-ivory dark:bg-[#070D1E] border-r border-scilens-border dark:border-scilens-darkborder flex flex-col transition-all duration-300 lg:translate-x-0',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 border-b border-scilens-border dark:border-scilens-darkborder bg-scilens-ivory dark:bg-[#070D1E]">
          <div className="flex items-center justify-between">
            <button
              onClick={onGoHome}
              className="text-left group transition-opacity hover:opacity-90 block"
            >
              <SciLensLogo size="md" showSubtitle />
            </button>
          </div>

          <button
            onClick={onGoHome}
            className="mt-4 w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white hover:bg-scilens-warmgray/60 dark:hover:bg-scilens-darkcard rounded border border-scilens-border/60 dark:border-scilens-darkborder transition-colors"
          >
            <span className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-scilens-teal dark:text-scilens-glowteal" />
              Home
            </span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 hide-scrollbar">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-2 text-[10px] font-mono font-medium tracking-wider uppercase text-scilens-lightmuted dark:text-scilens-darklightmuted">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectView(item.id);
                        onCloseMobile();
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-sans transition-all text-left group',
                        isActive
                          ? 'bg-scilens-warmgray dark:bg-scilens-darkcard text-scilens-navy dark:text-white font-medium shadow-subtle border-l-2 border-scilens-teal dark:border-scilens-glowteal rounded-l-none'
                          : 'text-scilens-muted dark:text-scilens-darkmuted hover:text-scilens-navy dark:hover:text-white hover:bg-scilens-warmgray/50 dark:hover:bg-scilens-darkcard/50'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={clsx(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive
                              ? 'text-scilens-teal dark:text-scilens-glowteal'
                              : 'text-scilens-muted dark:text-scilens-darkmuted group-hover:text-scilens-navy dark:group-hover:text-white'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={clsx(
                            'text-[10px] font-mono px-1.5 py-0.2 rounded',
                            isActive
                              ? 'bg-scilens-teal dark:bg-scilens-glowteal text-white dark:text-scilens-navy font-bold'
                              : 'bg-scilens-warmgray dark:bg-scilens-darkborder text-scilens-muted dark:text-scilens-darkmuted'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-scilens-border dark:border-scilens-darkborder bg-scilens-ivory/80 dark:bg-[#070D1E]/80 text-[11px] font-sans text-scilens-muted dark:text-scilens-darkmuted">
          <div className="flex items-center justify-between mb-1">
            <span className="text-scilens-lightmuted dark:text-scilens-darklightmuted font-mono uppercase text-[9px]">
              INVESTIGATION
            </span>
            <span className="inline-flex items-center gap-1 text-scilens-teal dark:text-scilens-glowteal font-medium text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-scilens-teal dark:bg-scilens-glowteal animate-pulse" />
              Active
            </span>
          </div>
          <p className="truncate text-scilens-navy dark:text-white font-medium text-xs" title={topic}>
            {topic}
          </p>
        </div>
      </aside>
    </>
  );
};
