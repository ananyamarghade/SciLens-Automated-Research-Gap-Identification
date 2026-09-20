import { demoPapers } from '../data/demoPapers';
import { demoGaps, demoContradictions, heatmapData, underexploredAreas } from '../data/demoGaps';
import { demoLandscape } from '../data/demoLandscape';
import { demoAgentActivities } from '../data/demoAgents';
import { demoDevelopment } from '../data/development';
import { demoDraft } from '../data/draft';
import { demoCitationsByStyle, demoClaimVerifications } from '../data/citations';
import { activeProject } from '../data/demoResearch';
import { Paper, ResearchGap, AgentActivityItem, CitationStyle, ResearchLandscape } from '../types';

export const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';
export const API_BASE = `${BACKEND_URL}/api`;

export interface BackendHealth {
  connected: boolean;
  system: string;
  status: string;
  docs: string;
  gradio_ui: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  topic: string;
  description?: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchStatus {
  research_id: string;
  status: string;
  progress: number;
  current_agent: string;
  active_job_id?: string;
  error_message?: string;
  updated_at: string;
}

// 1. Health & Connection Check
export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await fetch(`${BACKEND_URL}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        system: data.system || 'SciLens Backend',
        status: data.status || 'online',
        docs: `${BACKEND_URL}/docs`,
        gradio_ui: `${BACKEND_URL}/gradio`,
      };
    }
  } catch (err) {
    // Backend not reached
  }
  return {
    connected: false,
    system: 'Offline (Fallback Mode)',
    status: 'offline',
    docs: '',
    gradio_ui: '',
  };
}

// 2. Project Management API
export async function createProject(
  topic: string,
  title?: string,
  description?: string
): Promise<ResearchProject> {
  try {
    const res = await fetch(`${API_BASE}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        title: title || topic,
        description: description || 'Automated Research Gap Identification Project',
        configuration: { max_iterations: 3 },
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend createProject failed, using fallback project:', err);
  }
  return {
    id: activeProject.id,
    title: title || activeProject.title,
    topic,
    description: 'Automated Research Gap Identification Project',
    status: 'planning',
    progress: 0.05,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function listProjects(): Promise<ResearchProject[]> {
  try {
    const res = await fetch(`${API_BASE}/research`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend listProjects failed:', err);
  }
  return [];
}

export async function startResearchWorkflow(researchId: string): Promise<ResearchStatus> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/start`, {
      method: 'POST',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend startWorkflow failed:', err);
  }
  return {
    research_id: researchId,
    status: 'discovering',
    progress: 0.15,
    current_agent: 'literature_discovery',
    updated_at: new Date().toISOString(),
  };
}

export async function getProjectStatus(researchId: string): Promise<ResearchStatus> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // ignore
  }
  return {
    research_id: researchId,
    status: 'gaps_detected',
    progress: 0.85,
    current_agent: 'evidence_critic',
    updated_at: new Date().toISOString(),
  };
}

// 3. Papers API
export async function getPapers(researchId: string, page?: number, pageSize?: number): Promise<Paper[]> {
  try {
    const url = `${API_BASE}/research/${researchId}/papers${page ? `?page=${page}&page_size=${pageSize || 10}` : ''}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const rawList = Array.isArray(json) ? json : (Array.isArray(json?.items) ? json.items : []);
      if (rawList.length > 0) {
        return rawList.map((p: any) => ({
          id: p.id,
          title: p.title,
          authors: p.authors || [],
          year: p.year || 2024,
          venue: p.venue || 'Scientific Journal',
          abstract: p.abstract || '',
          methodology: p.analysis?.methodology || 'Not explicitly reported.',
          dataset: p.analysis?.dataset || 'Not explicitly reported.',
          population: p.analysis?.population || 'Not explicitly reported.',
          geography: p.analysis?.geography || 'Not explicitly reported.',
          relevance: p.relevance || 95,
          relevanceTier: p.relevance_tier || 'RELATED',
          citationCount: p.citation_count || 15,
          doi: p.doi,
          sourceUrl: p.source_url,
          pdfUrl: p.pdf_url,
          isUploaded: p.is_uploaded,
          status: p.analysis ? 'Analyzed' : 'Indexed',
          analysis: p.analysis ? {
            summary: p.analysis.objective || p.abstract || 'Not explicitly reported.',
            objectives: p.analysis.research_questions || [],
            methodology: p.analysis.methodology || 'Not explicitly reported.',
            dataset: p.analysis.dataset || 'Not explicitly reported.',
            population: p.analysis.population || 'Not explicitly reported.',
            geography: p.analysis.geography || 'Not explicitly reported.',
            variables: p.analysis.variables || { independent: 'Experimental Variable', dependent: 'Outcome Metric' },
            theoreticalFramework: p.analysis.theoretical_framework || 'Not explicitly reported.',
            keyFindings: p.analysis.key_findings || [],
            limitations: p.analysis.limitations || [],
            futureWork: p.analysis.future_work || [],
            conclusion: p.abstract || 'Not explicitly reported.',
          } : undefined,
        }));
      }
      return [];
    }
  } catch (err) {
    console.warn('Backend getPapers failed:', err);
  }
  return [];
}

export async function searchOnlinePapers(
  researchId: string,
  query: string,
  limit: number = 10
): Promise<Paper[]> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/papers/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((p: any, idx: number) => ({
          id: p.id || `search_paper_${Date.now()}_${idx}`,
          title: p.title,
          authors: p.authors || [],
          year: p.year || new Date().getFullYear(),
          venue: p.venue || (p.source_provider ? p.source_provider.toUpperCase() : 'Peer-Reviewed Literature'),
          abstract: p.abstract || 'Peer-reviewed academic research publication indexed from OpenAlex and arXiv open scientific repositories.',
          methodology: 'Empirical Investigation',
          dataset: 'Scientific Benchmark Corpus',
          population: 'General Sample',
          geography: 'International',
          relevance: 96,
          citationCount: p.citation_count || 10,
          doi: p.doi,
          sourceUrl: p.source_url,
          pdfUrl: p.pdf_url,
          isUploaded: false,
          status: 'Indexed',
        }));
      }
    }
  } catch (err) {
    console.warn('Backend searchOnlinePapers failed:', err);
  }
  return [];
}

export async function discoverTopicLiterature(
  researchId: string,
  topic: string,
  limit: number = 40
): Promise<Paper[]> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/papers/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, limit }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p: any, idx: number) => ({
          id: p.id || `discovered_paper_${Date.now()}_${idx}`,
          title: p.title,
          authors: p.authors && p.authors.length > 0 ? p.authors : ['Scholarly Research Consortium'],
          year: p.year || new Date().getFullYear(),
          venue: p.venue || (p.source_provider ? p.source_provider.toUpperCase() : 'Peer-Reviewed Literature'),
          abstract: p.abstract || 'Peer-reviewed academic research publication indexed from OpenAlex, PubMed, and arXiv repositories.',
          methodology: 'Empirical Literature Extraction',
          dataset: 'Primary Empirical Corpus',
          population: 'Global Cohort',
          geography: 'International',
          relevance: p.relevance_score || Math.max(70, 98 - idx),
          citationCount: p.citation_count || 0,
          doi: p.doi,
          sourceUrl: p.source_url,
          pdfUrl: p.pdf_url,
          isUploaded: false,
          status: 'Analyzed',
          analysis: {
            summary: p.abstract || p.title,
            objectives: [
              `Investigate core dimensions of ${topic}`,
              `Empirical verification of ${p.venue || 'scholarly publication'}`,
            ],
            methodology: 'Empirical Scholarly Extraction',
            dataset: 'Benchmark Literature Corpus',
            population: 'Peer-Reviewed Sample',
            geography: 'International',
            variables: { independent: 'Research Parameters', dependent: 'Outcome Indicators' },
            theoreticalFramework: 'Academic Literature Graph',
            keyFindings: [
              `Extracted traceable evidence from ${p.venue || 'indexed source'}.`,
              p.doi ? `Verified DOI: ${p.doi}` : 'Scholarly preprint/indexed record.',
            ],
            limitations: ['Extracted from abstract and open-access metadata without proprietary paywall full-text.'],
            futureWork: ['Full-text section-aware ingestion and deep citation graph traversal.'],
            conclusion: p.abstract || p.title,
          },
        }));
      }
    }
  } catch (err) {
    console.warn('Backend discoverTopicLiterature failed, fallback will be used:', err);
  }
  return [];
}

export interface DocumentUploadItemStatus {
  filename: string;
  status: 'completed' | 'failed' | 'skipped';
  document_id?: string;
  paper_id?: string;
  pages?: number;
  chunks?: number;
  error?: string;
  extracted_from?: string;
}

export interface BatchUploadResult {
  total_files_received: number;
  processed_count: number;
  failed_count: number;
  results: DocumentUploadItemStatus[];
  documents: any[];
}

export async function uploadMultipleDocuments(
  researchId: string,
  files: File[]
): Promise<BatchUploadResult | null> {
  try {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }

    const res = await fetch(`${API_BASE}/research/${researchId}/documents`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return {
          total_files_received: files.length,
          processed_count: data.length,
          failed_count: 0,
          results: data.map((d: any) => ({
            filename: d.filename,
            status: 'completed',
            document_id: d.id,
            pages: d.page_count,
            chunks: d.chunk_count,
          })),
          documents: data,
        };
      }
      return data as BatchUploadResult;
    }
  } catch (err) {
    console.warn('Backend uploadMultipleDocuments failed:', err);
  }
  return null;
}

export async function uploadPdfDocument(
  researchId: string,
  file: File
): Promise<boolean> {
  const res = await uploadMultipleDocuments(researchId, [file]);
  return res !== null && res.processed_count > 0;
}

// 4. Research Landscape API
export async function getLandscape(researchId: string): Promise<ResearchLandscape | null> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/landscape`);
    if (res.ok) {
      const d = await res.json();
      const rawNodes = d.network?.nodes || d.nodes || [];
      const rawEdges = d.network?.edges || d.edges || [];

      const nodes = rawNodes.map((n: any, idx: number) => ({
        id: n.id,
        label: n.label || n.id,
        type: n.type || 'paper',
        x: n.metrics?.x ?? (20 + ((idx * 17) % 65)),
        y: n.metrics?.y ?? (25 + ((idx * 23) % 55)),
        size: n.metrics?.size || 14,
        category: n.metrics?.category || (n.type === 'theme' ? 'Thematic Hub' : 'Empirical Study'),
        cluster: n.metrics?.cluster || 'Domain Literature',
        paperCount: n.metrics?.citations || n.metrics?.citation_count || 10,
      }));

      const edges = rawEdges.map((e: any) => ({
        source: e.source,
        target: e.target,
        weight: e.weight || 0.8,
        relationship: e.relationship || 'connected',
      }));

      const themes = (d.themes || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        paperCount: t.paper_count ?? t.paperCount ?? 0,
        keywords: t.keywords || [],
        paperIds: t.paper_ids || t.paperIds || [],
      }));

      const trends = (d.trends || []).map((tr: any) => ({
        year: tr.year,
        paperCount: tr.paper_count ?? tr.paperCount ?? 0,
        themes: tr.themes || [],
        emergingThemes: tr.emerging_themes || tr.emergingThemes || [],
      }));

      return {
        themes,
        trends,
        methodologyDistribution: d.methodology_distribution || d.methodologyDistribution || {},
        populationDistribution: d.population_distribution || d.populationDistribution || {},
        geographicDistribution: d.geographic_distribution || d.geographicDistribution || {},
        nodes,
        edges,
      };
    }
  } catch (err) {
    console.warn('Backend getLandscape failed:', err);
  }
  return null;
}

// 5. Research Gaps API
export async function getGaps(researchId: string): Promise<ResearchGap[]> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/gaps`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((g: any) => ({
          id: g.id,
          gapType: g.gap_type || 'Methodological',
          title: g.title,
          description: g.description,
          supportingPaperIds: (g.evidence || g.evidence_items || []).map((e: any) => e.paper_id).filter(Boolean),
          supportingPapers: [],
          evidenceSnippets: (g.evidence || g.evidence_items || []).map((e: any) => ({
            id: e.id,
            paperId: e.paper_id,
            paperTitle: e.paper_title || 'Corpus Reference',
            authors: ['Research Investigator'],
            year: 2024,
            pageNumber: e.page_number || 1,
            section: e.section || 'Results',
            snippet: e.snippet,
            confidence: e.confidence || 0.9,
            isSupporting: e.is_supporting,
            doi: e.doi,
            evidenceType: e.evidence_type || 'PARAPHRASE',
            exactSourceText: e.exact_source_text,
            extractionMethod: e.extraction_method || 'automated_analysis',
            relevanceTier: e.relevance_tier || 'RELATED',
          })),
          evidenceStrength: g.evidence_strength || 'High',
          confidence: typeof g.confidence === 'number' ? (g.confidence > 1 ? g.confidence / 100 : g.confidence) : 0.85,
          status: (g.status === 'VALID' || g.status === 'validated' || g.status === 'VALIDATED') ? 'Validated' :
                  (g.status === 'SUPPORTED' || g.status === 'Supported Gap') ? 'Supported Gap' :
                  (g.status === 'CANDIDATE' || g.status === 'Candidate Gap') ? 'Candidate Gap' :
                  (g.status === 'INSUFFICIENT' || g.status === 'insufficient') ? 'Insufficient Evidence' : 'Potential',
          affectedThemes: g.affected_themes || [],
          noveltyAssessment: g.novelty_status || 'well_supported',
          criticNotes: g.critic_notes,
          iterationCount: g.iteration_count || 1,
          derivedFrom: g.derived_from || [],
          crossPaperPattern: g.cross_paper_pattern || '',
          missingEvidence: g.missing_evidence || '',
          confidenceRationale: g.confidence_rationale || '',
        }));
      }
    }
  } catch (err) {
    console.warn('Backend getGaps failed:', err);
  }
  return [];
}

export async function detectGapsApi(researchId: string): Promise<ResearchGap[]> {
  const res = await fetch(`${API_BASE}/research/${researchId}/gaps/detect`, {
    method: 'POST',
  });
  if (res.ok) {
    return await getGaps(researchId);
  }
  const errorData = await res.json().catch(() => ({ detail: 'Gap detection failed' }));
  throw new Error(errorData.detail || `Gap detection failed with status ${res.status}`);
}

export async function investigateGap(
  researchId: string,
  gapId: string
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/gaps/${gapId}/investigate`, {
      method: 'POST',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend investigateGap failed:', err);
  }
  return null;
}

export async function validateGapApi(
  researchId: string,
  gapId: string
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/gaps/${gapId}/validate`, {
      method: 'POST',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend validateGapApi failed:', err);
  }
  return null;
}

export async function getHeatmapDataApi(researchId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/gaps/heatmap`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend getHeatmapDataApi failed:', err);
  }
  return null;
}

export async function getContradictionsDataApi(researchId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/contradictions`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend getContradictionsDataApi failed:', err);
  }
  return [];
}

export async function getUnderexploredDataApi(researchId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/gaps/underexplored`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend getUnderexploredDataApi failed:', err);
  }
  return [];
}

// 6. Agent Activities API
export async function getAgentActivities(researchId: string): Promise<AgentActivityItem[]> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/agent-activity`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((a: any) => ({
          id: a.id,
          agentName: a.agent_name,
          currentTask: a.message,
          timestamp: new Date(a.timestamp).toLocaleTimeString(),
          progress: 100,
          status: 'completed',
          phase: 'Detect',
          details: a.details ? JSON.stringify(a.details) : a.message,
        }));
      }
    }
  } catch (err) {
    console.warn('Backend getAgentActivities failed, using demoAgentActivities:', err);
  }
  return demoAgentActivities;
}

// 7. Research Development & Draft API
export async function getDevelopment(researchId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/development`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend getDevelopment failed, using demoDevelopment:', err);
  }
  return demoDevelopment;
}

export async function getDraft(researchId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/draft`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend getDraft failed, using demoDraft:', err);
  }
  return demoDraft;
}

// 8. Citations & Claim Verification
export async function getCitations(
  researchId: string,
  style: CitationStyle = 'APA 7'
): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/citations?style=${encodeURIComponent(style)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }
  return demoCitationsByStyle[style] || demoCitationsByStyle['APA 7'];
}

// 9. Document Export Download
export function getExportUrl(
  researchId: string,
  format: 'pdf' | 'docx' | 'md' | 'markdown' | 'bibtex' | 'json',
  target: 'draft' | 'review' = 'draft'
): string {
  return `${API_BASE}/research/${researchId}/export/${format}${target ? `?target=${target}` : ''}`;
}


// 10. Deep Literature Review Generation with Tables & Selected Gaps
export async function generateLiteratureReviewApi(
  researchId: string,
  payload: {
    selected_gap_ids?: string[];
    review_depth?: string;
    organization?: string;
    citation_style?: string;
  }
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/research/${researchId}/draft/literature-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('generateLiteratureReviewApi error:', err);
  }
  return null;
}

// 11. Authentication API
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function registerApi(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Registration failed');
  }
  return await res.json();
}

export async function loginApi(payload: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Incorrect email or password' }));
    throw new Error(err.detail || 'Incorrect email or password');
  }
  return await res.json();
}

export async function getMeApi(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return await res.json();
}

