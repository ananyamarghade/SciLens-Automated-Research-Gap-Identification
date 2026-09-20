import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { BackendProvider } from './context/BackendContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InvestigationProvider, useInvestigation } from './context/InvestigationContext';
import { LandingPage } from './components/landing/LandingPage';
import { Sidebar, WorkspaceView } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { AuthModal } from './components/auth/AuthModal';

// Workspace Views
import { OverviewView } from './components/views/OverviewView';
import { LiteratureView } from './components/views/LiteratureView';
import { PaperAnalysisView } from './components/views/PaperAnalysisView';
import { LandscapeView } from './components/views/LandscapeView';
import { GapAnalysisView } from './components/views/GapAnalysisView';
import { GapInvestigatorView } from './components/views/GapInvestigatorView';
import { AgentActivityView } from './components/views/AgentActivityView';
import { ResearchDevelopmentView } from './components/views/ResearchDevelopmentView';
import { DraftBuilderView } from './components/views/DraftBuilderView';
import { ReferencesView } from './components/views/ReferencesView';
import { ExportView } from './components/views/ExportView';
import { ChallengeView } from './components/views/ChallengeView';
import { AskSciLensView } from './components/views/AskSciLensView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function AppContent() {
  const {
    topic,
    changeTopic,
    selectedPaperId,
    setSelectedPaperId,
    selectedGapId,
    setSelectedGapId,
  } = useInvestigation();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [currentMode, setCurrentMode] = useState<'landing' | 'workspace'>('landing');
  const [currentView, setCurrentView] = useState<WorkspaceView>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isAuthenticated && currentMode === 'workspace') {
      setCurrentMode('landing');
    }
  }, [isAuthenticated, currentMode]);

  const handleEnterWorkspace = (newTopic?: string, initialView?: string) => {
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }

    const cleanTopic = newTopic?.trim();
    const targetView: WorkspaceView = (initialView && ['overview', 'literature', 'paper_analysis', 'landscape', 'gaps', 'gap_investigator', 'agent_activity', 'development', 'draft_builder', 'references', 'export', 'challenge', 'ask'].includes(initialView))
      ? (initialView as WorkspaceView)
      : 'overview';

    setCurrentView(targetView);
    setCurrentMode('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (cleanTopic && cleanTopic !== topic) {
      changeTopic(cleanTopic);
    }
  };

  const handleGoHome = () => {
    setCurrentMode('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPaper = (paperId: string) => {
    setSelectedPaperId(paperId);
  };

  const handleSelectGap = (gapId: string) => {
    setSelectedGapId(gapId);
  };

  if (currentMode === 'landing') {
    return <LandingPage onEnterWorkspace={handleEnterWorkspace} />;
  }

  return (
    <div className="min-h-screen bg-scilens-ivory dark:bg-[#070D1E] text-scilens-navy dark:text-[#E2E8F0] flex transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoHome={handleGoHome}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar
          currentTopic={topic}
          onSelectTopic={(t) => {
            changeTopic(t);
          }}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto">
          <ErrorBoundary
            fallbackTitle="Something went wrong while analyzing this investigation."
            onReset={() => setCurrentView('overview')}
          >
            {currentView === 'overview' && (
              <OverviewView onNavigate={setCurrentView} />
            )}

            {currentView === 'literature' && (
              <LiteratureView
                onNavigate={setCurrentView}
                onSelectPaper={handleSelectPaper}
              />
            )}

            {currentView === 'paper_analysis' && (
              <PaperAnalysisView
                paperId={selectedPaperId}
                onNavigate={setCurrentView}
                onSelectGap={handleSelectGap}
              />
            )}

            {currentView === 'landscape' && (
              <LandscapeView onNavigate={setCurrentView} />
            )}

            {currentView === 'gaps' && (
              <GapAnalysisView
                onNavigate={setCurrentView}
                onSelectGap={handleSelectGap}
              />
            )}

            {currentView === 'gap_investigator' && (
              <GapInvestigatorView
                gapId={selectedGapId}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'agent_activity' && (
              <AgentActivityView onNavigate={setCurrentView} />
            )}

            {currentView === 'development' && (
              <ResearchDevelopmentView onNavigate={setCurrentView} />
            )}

            {currentView === 'draft_builder' && (
              <DraftBuilderView onNavigate={setCurrentView} />
            )}

            {currentView === 'references' && (
              <ReferencesView onNavigate={setCurrentView} />
            )}

            {currentView === 'export' && <ExportView />}

            {currentView === 'challenge' && <ChallengeView />}

            {currentView === 'ask' && <AskSciLensView />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BackendProvider>
        <AuthProvider>
          <InvestigationProvider>
            <AppContent />
            <AuthModal />
          </InvestigationProvider>
        </AuthProvider>
      </BackendProvider>
    </ThemeProvider>
  );
}

export default App;
