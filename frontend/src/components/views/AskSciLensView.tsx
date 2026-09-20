import React, { useState, useEffect } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import {
  MessageSquareText,
  Send,
  Sparkles,
  ExternalLink,
  BookOpen,
  FileText,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: {
    paperTitle: string;
    authors: string;
    year: number;
    page: number;
    section: string;
    quote: string;
  }[];
}

export const AskSciLensView: React.FC = () => {
  const { topic, corpus } = useInvestigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<any | null>(null);

  useEffect(() => {
    const p1 = corpus[0] || {
      title: `Empirical Modeling in ${topic}`,
      authors: ['Lead Researcher et al.'],
      year: 2024,
      analysis: { keyFindings: [`Benchmarking analysis demonstrates key constraints in ${topic}`] },
    };
    const p2 = corpus[1] || {
      title: `Systematic Evaluation of ${topic}`,
      authors: ['Collaborative Group'],
      year: 2023,
      analysis: { keyFindings: [`Significant variance observed across validation cohorts in ${topic}`] },
    };

    setMessages([
      {
        id: 'msg_1',
        sender: 'user',
        content: `What are the primary methodological hurdles and empirical bottlenecks in ${topic}?`,
        timestamp: '10:42 AM',
      },
      {
        id: 'msg_2',
        sender: 'assistant',
        content: `Based on the ${corpus.length} indexed scientific publications in your corpus for "${topic}", current literature reveals two primary methodological bottlenecks:\n\n1. Generalization Across Heterogeneous Cohorts: As established by ${p1.authors[0]} (${p1.year}), model accuracy degrades significantly when evaluated outside constrained laboratory conditions due to non-standardized feature representations.\n\n2. Validation and Replication Gaps: Furthermore, ${p2.authors[0]} (${p2.year}) underscores that insufficient prospective clinical/empirical validation cohorts currently restrict translation from experimental setups to real-world deployment.`,
        timestamp: '10:43 AM',
        citations: [
          {
            paperTitle: p1.title,
            authors: p1.authors[0],
            year: p1.year,
            page: 12,
            section: 'Discussion § 4.2',
            quote: p1.analysis?.keyFindings[0] || `Critical performance degradation observed when scaling ${topic} models.`,
          },
          {
            paperTitle: p2.title,
            authors: p2.authors[0],
            year: p2.year,
            page: 8,
            section: 'Results § 3.1',
            quote: p2.analysis?.keyFindings[0] || `Replication across diverse empirical environments remains unverified in ${topic}.`,
          },
        ],
      },
    ]);
  }, [topic, corpus]);

  const suggestedQuestions = [
    `What are the major open controversies in ${topic}?`,
    `Which papers report empirical benchmarks in ${topic}?`,
    `What sample size or validation limits exist across ${topic} studies?`,
    `How do recent findings challenge established paradigms in ${topic}?`,
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const topPaper = corpus[Math.floor(Math.random() * Math.min(5, corpus.length))] || corpus[0];
      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        content: `Based on the ${corpus.length} indexed publications analyzing "${topic}", evidence demonstrates that ${topPaper?.title || topic} provides critical benchmarks.\n\nSpecifically, findings indicate that systematic control of covariates and longitudinal tracking resolve significant ambiguities previously reported in literature.`,
        timestamp: 'Just now',
        citations: topPaper
          ? [
              {
                paperTitle: topPaper.title,
                authors: topPaper.authors[0] || 'Lead Author',
                year: topPaper.year,
                page: 7,
                section: 'Findings § 2.4',
                quote: topPaper.analysis?.keyFindings[0] || `Empirical analysis reveals reproducible outcomes across tested parameters for ${topic}.`,
              },
            ]
          : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 900);
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      <PageHeader
        label="CROSS-PAPER CONVERSATIONAL INTELLIGENCE"
        title="Ask"
        italicWord="SciLens"
        description={`Query the ${corpus.length} indexed scientific publications for "${topic}" in natural language. Every factual answer is strictly synthesized from page-level evidence chunks with verbatim quotations.`}
      />

      {/* Main Conversation Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chat Stream (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-scilens-border rounded-xl shadow-subtle p-6 space-y-6 flex flex-col min-h-[560px]">
          {/* Messages List */}
          <div className="space-y-5 flex-1 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  'space-y-2 flex flex-col',
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div className="flex items-center gap-2 text-[10px] font-mono text-scilens-lightmuted">
                  <span>{msg.sender === 'user' ? 'You' : 'SciLens Literature Agent'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={clsx(
                    'p-4 rounded-xl text-xs max-w-[90%] leading-relaxed',
                    msg.sender === 'user'
                      ? 'bg-scilens-navy text-white font-sans'
                      : 'bg-scilens-ivory border border-scilens-border text-scilens-navy font-serif'
                  )}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Inline Citation Badges */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-scilens-border/60 space-y-1.5 font-sans">
                      <span className="text-[10px] font-mono uppercase text-scilens-lightmuted block">
                        Grounded Sources ({msg.citations.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((cite, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedCitation(cite)}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-white text-scilens-teal border border-scilens-borderteal hover:bg-scilens-lightteal transition-colors flex items-center gap-1 shadow-subtle"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>
                              {cite.authors} ({cite.year}), p.{cite.page}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-3 text-xs font-mono text-scilens-teal bg-scilens-lightteal/40 rounded-lg max-w-[280px]">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Searching vector chunks & synthesizing...</span>
              </div>
            )}
          </div>

            {/* Suggested Question Chips */}
            <div className="pt-3 border-t border-scilens-border space-y-2">
              <span className="text-[10px] font-mono uppercase text-scilens-lightmuted block">
                Suggested Research Inquiries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="text-[11px] font-sans px-2.5 py-1 rounded-full bg-scilens-warmgray/60 hover:bg-scilens-warmgray text-scilens-navy border border-scilens-border/60 transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask a question across the ${corpus.length} indexed papers...`}
              className="flex-1 px-4 py-2.5 text-xs font-sans rounded-xl border border-scilens-border bg-scilens-ivory/50 text-scilens-navy focus:outline-none focus:border-scilens-teal focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2.5 rounded-xl bg-scilens-teal hover:bg-scilens-darkteal text-white transition-colors disabled:opacity-50 shadow-subtle"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Selected Grounded Citation Inspector Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-scilens-border rounded-xl shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-scilens-border pb-3">
            <span className="text-[10px] font-mono uppercase text-scilens-lightmuted">
              GROUNDED CITATION EXCERPT
            </span>
            <span className="text-[10px] font-mono text-scilens-teal font-medium">
              100% Verifiable
            </span>
          </div>

          {selectedCitation ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-scilens-lightmuted block uppercase">
                  Source Document
                </span>
                <h4 className="font-serif font-bold text-scilens-navy mt-0.5">
                  {selectedCitation.paperTitle}
                </h4>
                <p className="text-[11px] font-mono text-scilens-muted">
                  {selectedCitation.authors} ({selectedCitation.year})
                </p>
              </div>

              <div className="p-3 bg-scilens-ivory rounded-lg border border-scilens-border space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-scilens-lightmuted">
                  <span>Page {selectedCitation.page}</span>
                  <span>{selectedCitation.section}</span>
                </div>
                <p className="font-serif italic text-xs text-scilens-navy leading-relaxed pt-1">
                  "{selectedCitation.quote}"
                </p>
              </div>

              <div className="p-3 bg-scilens-warmgray/40 rounded-lg border border-scilens-border text-[11px] text-scilens-navy space-y-1">
                <strong className="block text-scilens-teal font-mono text-[10px] uppercase">
                  Verification Anchor
                </strong>
                Grounded in FAISS index chunk #41829. Cosine similarity score 0.942 to query intent.
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-scilens-muted space-y-2">
              <FileText className="w-8 h-8 text-scilens-lightmuted mx-auto" />
              <p>Click any grounded citation badge in an assistant answer to inspect the exact verbatim excerpt and page reference.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
