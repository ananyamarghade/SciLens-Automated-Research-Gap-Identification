import React, { useState, useEffect } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { AgentActivityItem } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import { WorkspaceView } from '../layout/Sidebar';
import { useBackend } from '../../context/BackendContext';
import { getAgentActivities } from '../../services/api';
import {
  Activity,
  Cpu,
  CheckCircle2,
  Clock,
  RotateCw,
  Terminal,
  Layers,
  ArrowRight,
  Database,
  Search,
  FileCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AgentActivityViewProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const AgentActivityView: React.FC<AgentActivityViewProps> = ({ onNavigate }) => {
  const { activeProjectId, health, projectStatus } = useBackend();
  const { topic, agentActivities, evidenceFlowSteps } = useInvestigation();
  const [activities, setActivities] = useState<AgentActivityItem[]>(agentActivities);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  useEffect(() => {
    setActivities(agentActivities);
  }, [agentActivities]);

  // Poll live backend activities if connected
  useEffect(() => {
    if (!health.connected || !isLiveStreaming || !activeProjectId || activeProjectId.startsWith('proj_')) {
      return;
    }

    const fetchLive = async () => {
      const live = await getAgentActivities(activeProjectId);
      if (live && live.length > 0) {
        setActivities(live);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, [health.connected, isLiveStreaming, activeProjectId]);

  const filteredActivities = activities.filter((act) => {
    return selectedPhase === 'all' || act.phase.toLowerCase() === selectedPhase.toLowerCase();
  });

  const activeAgentName = (projectStatus?.current_agent || 'evidence_critic').toLowerCase();

  const agentsList = [
    {
      id: 'planner',
      name: 'Planner Agent',
      role: 'Decomposes query into corpus search queries & manages state',
      status: activeAgentName.includes('planner') ? 'Active Cycle' : 'Completed',
      color: '#1B6B75',
    },
    {
      id: 'literature_discovery',
      name: 'Literature Discovery',
      role: 'Fetches arXiv, OpenAlex, Semantic Scholar & dedupes',
      status: activeAgentName.includes('discover') || activeAgentName.includes('literature') ? 'Active Cycle' : 'Completed',
      color: '#2B8A96',
    },
    {
      id: 'retrieval',
      name: 'Retrieval Agent',
      role: 'FAISS vector chunking & hybrid dense-sparse retrieval',
      status: activeAgentName.includes('retrieval') ? 'Active Cycle' : 'Completed',
      color: '#1B6B75',
    },
    {
      id: 'paper_analysis',
      name: 'Paper Analysis',
      role: 'Extracts methodology, sample size, limitations, variables',
      status: activeAgentName.includes('analysis') ? 'Active Cycle' : 'Completed',
      color: '#4A5568',
    },
    {
      id: 'gap_detection',
      name: 'Gap Detection',
      role: 'Identifies 9 gap archetypes and semantic blindspots',
      status: activeAgentName.includes('detection') || activeAgentName.includes('gap') ? 'Active Cycle' : 'Completed',
      color: '#C05621',
    },
    {
      id: 'evidence_critic',
      name: 'Evidence Critic',
      role: 'Adversarial challenger seeking counter-evidence to disprove gaps',
      status: activeAgentName.includes('critic') ? 'Active Cycle' : 'Completed',
      color: '#C05621',
    },
    {
      id: 'gap_investigator',
      name: 'Gap Investigator',
      role: 'Directs secondary retrieval iterations to defend or discard gaps',
      status: activeAgentName.includes('investigator') ? 'Active Cycle' : 'Completed',
      color: '#1B6B75',
    },
    {
      id: 'validation',
      name: 'Validation Agent',
      role: 'Synthesizes grounded citations, confidence scores & RQs',
      status: activeAgentName.includes('validation') ? 'Active Cycle' : 'Completed',
      color: '#2B8A96',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl pb-12">
      <PageHeader
        label="LANGGRAPH MULTI-AGENT ORCHESTRATION"
        title="Agent"
        italicWord="Activity"
        description="Autonomous LangGraph cyclic execution trace: continuous agent coordination, paper retrieval, adversarial disproof loops, and grounded validation."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={clsx(
                'px-3.5 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 border',
                isLiveStreaming
                  ? 'bg-scilens-lightteal text-scilens-teal border-scilens-borderteal'
                  : 'bg-white text-scilens-muted border-scilens-border'
              )}
            >
              <span
                className={clsx(
                  'w-2 h-2 rounded-full',
                  isLiveStreaming ? 'bg-scilens-teal animate-ping' : 'bg-scilens-muted'
                )}
              />
              <span>{isLiveStreaming ? 'Live Stream Active' : 'Stream Paused'}</span>
            </button>
          </div>
        }
      />

      {/* 5-Phase Evidence Flow Pipeline */}
      <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-scilens-border pb-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-scilens-lightmuted block">
              PIPELINE ARCHITECTURE
            </span>
            <h3 className="font-serif text-lg font-bold text-scilens-navy">
              5-Phase Evidence Flow
            </h3>
          </div>
          <span className="text-[11px] font-mono text-scilens-teal font-medium">
            100% Traceable Citations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {evidenceFlowSteps.map((step, idx: number) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-scilens-border bg-scilens-ivory/60 space-y-1.5 relative group hover:border-scilens-teal transition-all"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-scilens-lightmuted">
                <span>{step.phase || `Step ${idx + 1}`}</span>
                <span className="text-scilens-teal font-semibold uppercase">
                  {step.status}
                </span>
              </div>
              <h4 className="font-serif text-sm font-bold text-scilens-navy">
                {step.agent}
              </h4>
              <p className="text-xs font-mono text-scilens-teal font-medium">
                {step.action}
              </p>
              <p className="text-[11px] font-sans text-scilens-muted leading-tight">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Agents Fleet Grid */}
      <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4">
        <SectionLabel text="LANGGRAPH AGENT FLEET" />
        <h3 className="font-serif text-lg font-bold text-scilens-navy">
          Autonomous Specialized Agents
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {agentsList.map((agent, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-scilens-ivory border border-scilens-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-bold text-scilens-navy">
                  {agent.name}
                </span>
                <span
                  className={clsx(
                    'text-[10px] font-mono px-2 py-0.5 rounded font-medium',
                    agent.status === 'Active Cycle'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-scilens-lightteal text-scilens-teal border border-scilens-borderteal'
                  )}
                >
                  {agent.status}
                </span>
              </div>
              <p className="text-[11px] font-sans text-scilens-muted leading-relaxed">
                {agent.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Operational Event Log Console */}
      <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-scilens-border pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-scilens-navy" />
            <h3 className="font-serif text-base font-bold text-scilens-navy">
              Chronological Agent Execution Stream
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-scilens-muted">Filter Phase:</span>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="px-2.5 py-1 text-xs font-sans rounded border border-scilens-border bg-white text-scilens-navy"
            >
              <option value="all">All Phases</option>
              <option value="discover">Discover</option>
              <option value="map">Map</option>
              <option value="detect">Detect</option>
              <option value="challenge">Challenge</option>
              <option value="validate">Validate</option>
            </select>
          </div>
        </div>

        {/* Console Event Rows */}
        <div className="space-y-3 font-mono text-xs">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-lg border border-scilens-border bg-scilens-ivory/50 space-y-1.5 hover:bg-scilens-ivory transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-scilens-navy text-white font-medium">
                    {act.agentName}
                  </span>
                  <span className="text-scilens-navy font-semibold font-sans">
                    {act.currentTask}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-scilens-lightmuted">
                  <span>{act.timestamp}</span>
                  <span className="px-1.5 py-0.2 rounded bg-scilens-warmgray text-scilens-muted uppercase">
                    Phase: {act.phase}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-scilens-muted font-sans leading-relaxed">
                {act.details}
              </p>

              <div className="flex items-center gap-3 pt-1 text-[10px] text-scilens-lightmuted border-t border-scilens-border/40">
                {act.papersRetrieved && <span>Papers: {act.papersRetrieved}</span>}
                {act.iterations && <span>Loop Iteration: {act.iterations}</span>}
                <span className="text-scilens-teal">Status: {act.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
