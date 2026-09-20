import React, { useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { LandscapeNode } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import { WorkspaceView } from '../layout/Sidebar';
import {
  Compass,
  Layers,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Globe,
  Database,
  BarChart3,
  Network,
} from 'lucide-react';
import { clsx } from 'clsx';

interface LandscapeViewProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const LandscapeView: React.FC<LandscapeViewProps> = ({ onNavigate }) => {
  const { topic, landscape, corpus } = useInvestigation();
  const themes = landscape?.themes || [];
  const nodes = landscape?.nodes || [];
  const edges = landscape?.edges || [];
  const methodologyDist = landscape?.methodologyDistribution || (landscape as any)?.methodology_distribution || {};
  const geographicDist = landscape?.geographicDistribution || (landscape as any)?.geographic_distribution || {};

  const [selectedNode, setSelectedNode] = useState<LandscapeNode | null>(nodes[0] || null);
  const [hoveredNode, setHoveredNode] = useState<LandscapeNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'dense' | 'voids'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const clusterColors = ['#0D9488', '#0284C7', '#4F46E5', '#D97706', '#9333EA', '#10B981'];

  const sampleCorpusConnections = (corpus || []).slice(0, 2);

  // SVG dimensions for unclipped, proportionate projection
  const SVG_WIDTH = 860;
  const SVG_HEIGHT = 480;

  const getNodeX = (nx: number) => 60 + (nx / 100) * (SVG_WIDTH - 120);
  const getNodeY = (ny: number) => 45 + (ny / 100) * (SVG_HEIGHT - 90);

  // Filter logic
  const isNodeDimmed = (node: LandscapeNode) => {
    if (activeFilter === 'dense') {
      return node.type !== 'theme' && !node.category.toLowerCase().includes('synthesis');
    }
    if (activeFilter === 'voids') {
      return node.type !== 'cluster' && !node.label.toLowerCase().includes('gap');
    }
    return false;
  };

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      <PageHeader
        label="KNOWLEDGE ARCHITECTURE"
        title="Research"
        italicWord="Landscape"
        description={`Interactive semantic knowledge graph revealing dense literature clusters, methodological convergence, and underexplored voids for "${topic}".`}
        actions={
          <button
            onClick={() => onNavigate('gaps')}
            className="px-4 py-2 rounded-xl bg-scilens-teal hover:bg-scilens-darkteal text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-sm shadow-scilens-teal/20"
          >
            <span>Inspect Identified Gaps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      />

      {/* Main Graph & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive SVG Semantic Graph (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-500/20 text-scilens-teal dark:text-scilens-glowteal flex items-center justify-center">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-scilens-navy dark:text-white">
                  Semantic Literature Topology
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  {nodes.length} mapped entities across {themes.length} thematic clusters
                </p>
              </div>
            </div>

            {/* Filter buttons & Zoom Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-xl border border-slate-200/80 dark:border-slate-800 p-0.5 text-xs font-sans bg-slate-50 dark:bg-[#070D1E]">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-all font-medium',
                    activeFilter === 'all'
                      ? 'bg-white dark:bg-[#0C1528] text-scilens-teal dark:text-scilens-glowteal shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-scilens-navy dark:hover:text-white'
                  )}
                >
                  All Entities
                </button>
                <button
                  onClick={() => setActiveFilter('dense')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-all font-medium',
                    activeFilter === 'dense'
                      ? 'bg-white dark:bg-[#0C1528] text-scilens-teal dark:text-scilens-glowteal shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-scilens-navy dark:hover:text-white'
                  )}
                >
                  Dense Hubs
                </button>
                <button
                  onClick={() => setActiveFilter('voids')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg transition-all font-medium',
                    activeFilter === 'voids'
                      ? 'bg-white dark:bg-[#0C1528] text-scilens-teal dark:text-scilens-glowteal shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-scilens-navy dark:hover:text-white'
                  )}
                >
                  Research Voids
                </button>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center rounded-xl border border-slate-200/80 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-[#070D1E] text-slate-500">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.45))}
                  title="Zoom In"
                  className="p-1.5 rounded-lg hover:text-scilens-navy dark:hover:text-white hover:bg-white dark:hover:bg-[#0C1528] transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg hover:text-scilens-navy dark:hover:text-white hover:bg-white dark:hover:bg-[#0C1528] transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  title="Reset View"
                  className="p-1.5 rounded-lg hover:text-scilens-navy dark:hover:text-white hover:bg-white dark:hover:bg-[#0C1528] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* SVG Semantic Graph Canvas */}
          <div className="relative h-[480px] w-full rounded-2xl bg-gradient-to-b from-slate-50/70 to-slate-100/50 dark:from-[#070D1E] dark:to-[#050A17] border border-slate-200/70 dark:border-slate-800 overflow-hidden select-none">
            <svg
              className="w-full h-full transition-transform duration-300 ease-out"
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
            >
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="graphGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path
                    d="M 30 0 L 0 0 0 30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    className="text-slate-300/40 dark:text-slate-800/60"
                  />
                </pattern>

                {/* Soft glow filter for active elements */}
                <filter id="tealGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="voidGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#graphGrid)" />

              {/* Thematic Cluster Background Halos */}
              <g className="cluster-halos opacity-25 dark:opacity-20 pointer-events-none">
                <circle cx={SVG_WIDTH * 0.48} cy={SVG_HEIGHT * 0.35} r={140} fill="#0D9488" filter="blur(40px)" />
                <circle cx={SVG_WIDTH * 0.28} cy={SVG_HEIGHT * 0.55} r={120} fill="#0284C7" filter="blur(40px)" />
                <circle cx={SVG_WIDTH * 0.78} cy={SVG_HEIGHT * 0.72} r={110} fill="#F43F5E" filter="blur(40px)" />
              </g>

              {/* Connecting Edges */}
              {edges.map((edge, idx) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const x1 = getNodeX(sourceNode.x);
                const y1 = getNodeY(sourceNode.y);
                const x2 = getNodeX(targetNode.x);
                const y2 = getNodeY(targetNode.y);

                const isConnectedToSelected =
                  (selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target)) ||
                  (hoveredNode && (hoveredNode.id === edge.source || hoveredNode.id === edge.target));

                const isDimmed = isNodeDimmed(sourceNode) || isNodeDimmed(targetNode);

                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isConnectedToSelected ? '#0D9488' : 'currentColor'}
                    strokeWidth={isConnectedToSelected ? '2.5' : '1.2'}
                    strokeDasharray={edge.weight < 0.75 ? '4 3' : undefined}
                    className={clsx(
                      'transition-all duration-200',
                      isConnectedToSelected
                        ? 'opacity-100 text-scilens-teal dark:text-scilens-glowteal'
                        : isDimmed
                        ? 'opacity-15 text-slate-300 dark:text-slate-800'
                        : 'opacity-40 text-slate-400 dark:text-slate-700'
                    )}
                  />
                );
              })}

              {/* Render Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const isTheme = node.type === 'theme';
                const isVoid = node.type === 'cluster' || node.label.toLowerCase().includes('gap');
                const isDimmed = isNodeDimmed(node);

                const cx = getNodeX(node.x);
                const cy = getNodeY(node.y);

                const radius = isTheme ? 18 : isVoid ? 16 : 12;

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={clsx(
                      'cursor-pointer transition-all duration-200',
                      isDimmed && 'opacity-25'
                    )}
                  >
                    {/* Selected / Hover Halo */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 10}
                        fill="none"
                        stroke={isVoid ? '#F43F5E' : '#0D9488'}
                        strokeWidth="2"
                        strokeDasharray={isVoid ? '4 2' : undefined}
                        className={clsx(
                          'opacity-80 transition-all',
                          isVoid ? 'animate-pulse' : ''
                        )}
                        filter={isVoid ? 'url(#voidGlow)' : 'url(#tealGlow)'}
                      />
                    )}

                    {/* Outer Theme / Void Ring */}
                    {isTheme && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 5}
                        fill="none"
                        stroke="#0D9488"
                        strokeWidth="1.5"
                        className="opacity-40 animate-pulse"
                      />
                    )}

                    {/* Node Core Circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={
                        isVoid
                          ? '#F43F5E'
                          : isTheme
                          ? '#0D9488'
                          : '#0284C7'
                      }
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      className={clsx(
                        'shadow-lg transition-transform duration-150',
                        isSelected ? 'scale-110 drop-shadow-md' : 'hover:scale-105'
                      )}
                    />

                    {/* Inner Icon / Dot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius * 0.4}
                      fill="#FFFFFF"
                      className="opacity-90 pointer-events-none"
                    />

                    {/* Clean Label Pill */}
                    <g className="pointer-events-none">
                      <rect
                        x={cx - 55}
                        y={cy + radius + 4}
                        width={110}
                        height={18}
                        rx={5}
                        fill="currentColor"
                        className="text-white/90 dark:text-[#0C1528]/95 stroke stroke-slate-200/80 dark:stroke-slate-800"
                        strokeWidth="0.8"
                      />
                      <text
                        x={cx}
                        y={cy + radius + 16}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="600"
                        fontFamily="ui-sans-serif, system-ui, sans-serif"
                        className="fill-slate-800 dark:fill-slate-100"
                      >
                        {node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Floating Quick Legend */}
            <div className="absolute bottom-3.5 left-3.5 p-2.5 rounded-xl bg-white/95 dark:bg-[#0C1528]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-[11px] font-sans space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-scilens-teal border border-white dark:border-slate-800 shadow-xs" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">Thematic Cluster Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-white dark:border-slate-800" />
                <span className="text-slate-500 dark:text-slate-400">Grounded Literature Node</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-slate-800 animate-pulse" />
                <span className="text-rose-600 dark:text-rose-400 font-medium">Identified Research Void</span>
              </div>
            </div>

            {/* Hover Tooltip Overlay (when hovering a node) */}
            {hoveredNode && (
              <div
                className="absolute pointer-events-none p-3 rounded-xl bg-white/95 dark:bg-[#0C1528]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg text-xs space-y-1 z-20 max-w-[240px] animate-fade-in"
                style={{
                  left: Math.min(Math.max(getNodeX(hoveredNode.x) - 100, 20), SVG_WIDTH - 250),
                  top: Math.max(getNodeY(hoveredNode.y) - 95, 20),
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase font-semibold text-scilens-teal dark:text-scilens-glowteal">
                    {hoveredNode.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {hoveredNode.cluster}
                  </span>
                </div>
                <p className="font-sans font-semibold text-scilens-navy dark:text-white leading-tight">
                  {hoveredNode.label}
                </p>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                  Click to inspect literature connections
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Entity Details Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
              SELECTED ENTITY
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-scilens-teal dark:text-scilens-glowteal border border-teal-500/20 font-semibold">
              {selectedNode ? selectedNode.category : 'Theme'}
            </span>
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif text-lg font-bold text-scilens-navy dark:text-white">
                  {selectedNode.label}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                  Scientific domain: <strong className="text-slate-700 dark:text-slate-200">{selectedNode.cluster}</strong>
                </p>
              </div>

              {/* Metrics Box */}
              <div className="p-4 bg-slate-50/80 dark:bg-[#070D1E] rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Cluster Centrality:</span>
                  <span className="font-mono font-bold text-scilens-navy dark:text-white">0.84 / 1.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Literature Saturation:</span>
                  <span className="font-mono font-bold text-scilens-teal dark:text-scilens-glowteal">High (78%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Cross-Correlations:</span>
                  <span className="font-mono font-bold text-scilens-navy dark:text-white">
                    {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length || 4} links
                  </span>
                </div>
              </div>

              {/* Grounded Corpus Connections */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-medium">
                  Grounded Corpus Connections
                </span>
                <div className="space-y-2">
                  {sampleCorpusConnections.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs space-y-1 shadow-xs hover:border-scilens-teal transition-colors"
                    >
                      <p className="font-medium text-scilens-navy dark:text-white font-serif line-clamp-1">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {p.authors && p.authors.length > 0 ? p.authors[0] : 'Indexed Paper'} ({p.year}) • {p.venue}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigate('gaps')}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#070D1E] dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-sans font-semibold text-scilens-navy dark:text-white transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>View Gaps in this Domain</span>
                <ArrowRight className="w-3.5 h-3.5 text-scilens-teal group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Click any node on the knowledge graph to view details.</p>
          )}
        </div>
      </div>

      {/* Thematic Clusters & Distribution Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thematic Research Clusters */}
        <div className="p-6 bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <SectionLabel text="THEMATIC RESEARCH CLUSTERS" />
          <div className="space-y-3">
            {themes.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3">
                Synthesizing thematic clusters from indexed papers...
              </p>
            ) : (
              themes.map((theme) => (
                <div
                  key={theme.id}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-bold text-scilens-navy dark:text-white">
                      {theme.name}
                    </h4>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0C1528] border border-slate-200 dark:border-slate-800 text-scilens-teal dark:text-scilens-glowteal font-semibold">
                      {theme.paperCount} papers
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                    {theme.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(theme.keywords || []).map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-[#0C1528] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Presentation-Ready Methodology & Geographic Distribution Charts */}
        <div className="p-6 bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          {/* Methodology Distribution */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel text="METHODOLOGY DISTRIBUTION" />
              <span className="text-[11px] font-mono text-slate-400">Total: {corpus.length} papers</span>
            </div>

            <div className="space-y-3.5 mt-2">
              {(() => {
                const entries = Object.entries(methodologyDist);
                if (entries.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                      Synthesizing methodology distributions from indexed corpus...
                    </p>
                  );
                }
                return entries.map(([method, count]) => {
                  const numCount = typeof count === 'number' ? count : 1;
                  const total = corpus.length || 1;
                  const percent = Math.round((numCount / total) * 100);
                  return (
                    <div key={method} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-scilens-navy dark:text-white font-medium truncate max-w-[260px]">
                          {method}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            {numCount} {numCount === 1 ? 'paper' : 'papers'}
                          </span>
                          <span className="font-mono text-xs font-bold text-scilens-teal dark:text-scilens-glowteal w-9 text-right">
                            {percent}%
                          </span>
                        </div>
                      </div>
                      {/* Modern pill bar with smooth track */}
                      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800/90 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-teal-600 via-teal-500 to-teal-400 rounded-full transition-all duration-500 ease-out shadow-xs"
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Geographic Cohort Distribution */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <SectionLabel text="GEOGRAPHIC COHORT DISTRIBUTION" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-sans">
              Dominant cohorts reflect geographical concentration across primary research centers.
            </p>

            <div className="space-y-3.5">
              {(() => {
                const entries = Object.entries(geographicDist);
                if (entries.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                      Synthesizing geographic distributions from indexed corpus...
                    </p>
                  );
                }
                return entries.map(([geo, count]) => {
                  const numCount = typeof count === 'number' ? count : 1;
                  const total = corpus.length || 1;
                  const percent = Math.round((numCount / total) * 100);
                  const isUnderrepresented = percent < 15;

                  return (
                    <div key={geo} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-scilens-navy dark:text-white font-medium">{geo}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            {numCount} {numCount === 1 ? 'paper' : 'papers'}
                          </span>
                          <span
                            className={clsx(
                              'font-mono text-xs font-bold w-9 text-right',
                              isUnderrepresented ? 'text-amber-600 dark:text-amber-400' : 'text-scilens-navy dark:text-teal-400'
                            )}
                          >
                            {percent}%
                          </span>
                        </div>
                      </div>
                      {/* Modern pill bar with smooth track */}
                      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800/90 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all duration-500 ease-out shadow-xs',
                            isUnderrepresented
                              ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                              : 'bg-gradient-to-r from-scilens-navy via-slate-700 to-teal-500 dark:from-teal-600 dark:to-cyan-400'
                          )}
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
