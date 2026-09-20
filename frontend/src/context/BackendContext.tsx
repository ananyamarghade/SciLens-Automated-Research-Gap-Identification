import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  checkBackendHealth,
  createProject,
  listProjects,
  startResearchWorkflow,
  getProjectStatus,
  BackendHealth,
  ResearchStatus,
  BACKEND_URL,
} from '../services/api';
import { activeProject } from '../data/demoResearch';

interface BackendContextType {
  health: BackendHealth;
  activeProjectId: string;
  activeTopic: string;
  projectStatus: ResearchStatus | null;
  isStartingWorkflow: boolean;
  backendUrl: string;
  startWorkflow: (topic: string) => Promise<string>;
  refreshHealth: () => Promise<void>;
  setActiveProjectId: (id: string) => void;
  setActiveTopic: (topic: string) => void;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [health, setHealth] = useState<BackendHealth>({
    connected: false,
    system: 'Connecting...',
    status: 'checking',
    docs: '',
    gradio_ui: '',
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(activeProject.id);
  const [activeTopic, setActiveTopic] = useState<string>(activeProject.topic);
  const [projectStatus, setProjectStatus] = useState<ResearchStatus | null>(null);
  const [isStartingWorkflow, setIsStartingWorkflow] = useState<boolean>(false);

  const refreshHealth = useCallback(async () => {
    const h = await checkBackendHealth();
    setHealth(h);
  }, []);

  // Check health on mount and periodically
  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 12000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  // Sync latest active project from backend when connected
  useEffect(() => {
    if (!health.connected) return;
    const syncLatestProject = async () => {
      try {
        const projects = await listProjects();
        if (projects && projects.length > 0) {
          if (!activeProjectId || activeProjectId.startsWith('proj_')) {
            const selected = projects[0];
            setActiveProjectId(selected.id);
            setActiveTopic(selected.topic);
          }
        }
      } catch (err) {
        console.warn('Could not sync latest project:', err);
      }
    };
    syncLatestProject();
  }, [health.connected]);

  // Poll active project status if workflow is running
  useEffect(() => {
    if (!health.connected || !activeProjectId || activeProjectId.startsWith('proj_')) {
      return;
    }

    const poll = async () => {
      const status = await getProjectStatus(activeProjectId);
      setProjectStatus(status);
    };

    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [health.connected, activeProjectId]);

  const startWorkflow = async (topic: string): Promise<string> => {
    setIsStartingWorkflow(true);
    setActiveTopic(topic);
    try {
      if (health.connected) {
        const project = await createProject(
          topic,
          `Investigation: ${topic.slice(0, 50)}`,
          `Automated research gap identification for topic: ${topic}`
        );
        setActiveProjectId(project.id);
        const status = await startResearchWorkflow(project.id);
        setProjectStatus(status);
        setIsStartingWorkflow(false);
        return project.id;
      }
    } catch (err) {
      console.warn('Failed to start live workflow, continuing in fallback mode:', err);
    }
    setIsStartingWorkflow(false);
    return activeProject.id;
  };

  return (
    <BackendContext.Provider
      value={{
        health,
        activeProjectId,
        activeTopic,
        projectStatus,
        isStartingWorkflow,
        backendUrl: BACKEND_URL,
        startWorkflow,
        refreshHealth,
        setActiveProjectId,
        setActiveTopic,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = (): BackendContextType => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};
