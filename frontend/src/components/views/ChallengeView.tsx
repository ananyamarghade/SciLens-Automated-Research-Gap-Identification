import React, { useState, useEffect } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { PageHeader } from '../common/PageHeader';
import { SectionLabel } from '../common/SectionLabel';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

export const ChallengeView: React.FC = () => {
  const { challengeIdea, topic } = useInvestigation();
  const [ideaInput, setIdeaInput] = useState(challengeIdea.researchIdea);
  const [targetCohort, setTargetCohort] = useState(`Target Empirical Context: ${topic}`);
  const [isChallenging, setIsChallenging] = useState(false);
  const [critiqueReport, setCritiqueReport] = useState(challengeIdea);

  useEffect(() => {
    setIdeaInput(challengeIdea.researchIdea);
    setTargetCohort(`Target Empirical Context: ${topic}`);
    setCritiqueReport(challengeIdea);
  }, [challengeIdea, topic]);

  const handleRunChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChallenging(true);
    setTimeout(() => {
      setIsChallenging(false);
      setCritiqueReport({ ...challengeIdea, researchIdea: ideaInput });
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-7xl pb-12">
      <PageHeader
        label="ADVERSARIAL STRESS-TEST ENGINE"
        title="Challenge"
        italicWord="My Idea"
        description="Stress-test any preliminary hypothesis, grant specific aim, or research design against indexed literature before peer review submission."
      />

      {/* Idea Input Card */}
      <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4">
        <form onSubmit={handleRunChallenge} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-scilens-muted mb-1.5 font-semibold">
              Research Hypothesis or Project Premise
            </label>
            <textarea
              rows={3}
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              className="w-full p-3.5 text-xs font-serif text-scilens-navy rounded-lg border border-scilens-border bg-scilens-ivory/50 focus:outline-none focus:border-scilens-teal focus:bg-white resize-none leading-relaxed"
              placeholder="State your hypothesis or methodology..."
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex-1 max-w-md">
              <label className="block text-[11px] font-mono text-scilens-lightmuted mb-1 uppercase">
                Target Demographic / Context (Optional)
              </label>
              <input
                type="text"
                value={targetCohort}
                onChange={(e) => setTargetCohort(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-sans rounded-lg border border-scilens-border bg-white text-scilens-navy focus:outline-none focus:border-scilens-teal"
              />
            </div>

            <button
              type="submit"
              disabled={isChallenging}
              className="px-4 py-2.5 rounded-lg bg-scilens-navy hover:bg-scilens-darknavy text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 shadow-subtle shrink-0 mt-auto"
            >
              <ShieldAlert className={clsx('w-3.5 h-3.5 text-scilens-lightteal', isChallenging && 'animate-spin')} />
              <span>{isChallenging ? 'Deliberating Adversarial Attack...' : 'Execute Stress-Test'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Critique Report Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel text="CRITIQUE DELIBERATION REPORT" />
            <h3 className="font-serif text-lg font-bold text-scilens-navy mt-1">
              Adversarial Vulnerability & Counter-Evidence Assessment
            </h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            3 High-Risk Assumptions Flagged
          </span>
        </div>

        {/* 1. Core Assumptions & Risk Levels */}
        <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4">
          <h4 className="font-serif text-base font-bold text-scilens-navy">
            1. Core Implicit Assumptions & Risk Ratings
          </h4>

          <div className="space-y-3">
            {critiqueReport.coreAssumptions.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-scilens-ivory border border-scilens-border space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-bold text-scilens-navy">
                    Assumption #{idx + 1}
                  </span>
                  <span
                    className={clsx(
                      'text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase',
                      item.riskLevel === 'High'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    )}
                  >
                    {item.riskLevel} Risk Vulnerability
                  </span>
                </div>
                <p className="text-xs font-sans text-scilens-navy leading-relaxed">
                  "{item.assumption}"
                </p>
                <p className="text-xs font-sans text-scilens-muted leading-relaxed pl-3 border-l-2 border-amber-400">
                  <strong className="text-scilens-navy font-medium">Critic Citation Note:</strong> {item.notes}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Potential Weaknesses & Missing Evidence (Two-Column Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weaknesses */}
          <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-serif text-base font-bold text-scilens-navy">
                Methodological Vulnerabilities
              </h4>
            </div>
            <ul className="space-y-2 text-xs font-sans text-scilens-navy list-disc list-inside">
              {critiqueReport.potentialWeaknesses.map((w, idx) => (
                <li key={idx} className="leading-relaxed">
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Missing Evidence */}
          <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-scilens-teal" />
              <h4 className="font-serif text-base font-bold text-scilens-navy">
                Missing Literature & Evidence
              </h4>
            </div>
            <ul className="space-y-2 text-xs font-sans text-scilens-navy list-disc list-inside">
              {critiqueReport.missingEvidence.map((m, idx) => (
                <li key={idx} className="leading-relaxed">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Alternative Explanations */}
        <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-3">
          <h4 className="font-serif text-base font-bold text-scilens-navy">
            Alternative Scientific Explanations to Account For
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {critiqueReport.alternativeExplanations.map((alt, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-scilens-ivory rounded-lg border border-scilens-border text-xs text-scilens-navy leading-relaxed"
              >
                <strong className="text-scilens-teal block mb-0.5">Alternative Hypothesis {idx + 1}:</strong>
                {alt}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Relevant Adversarial Literature */}
        <div className="p-6 bg-white border border-scilens-border rounded-xl shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-scilens-navy" />
            <h4 className="font-serif text-base font-bold text-scilens-navy">
              Published Counter-Precedents You Must Cite
            </h4>
          </div>

          <div className="space-y-3">
            {critiqueReport.relevantLiterature.map((lit, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-scilens-ivory border border-scilens-border space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-scilens-navy">{lit.title}</span>
                  <span className="font-mono text-[10px] text-scilens-lightmuted uppercase">
                    {lit.relevance}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-scilens-muted">{lit.authors}</p>
                <p className="text-xs text-scilens-navy font-sans leading-relaxed pt-1">
                  <strong>Empirical Counter-Finding:</strong> {lit.finding}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Critical Questions Before Submission */}
        <div className="p-6 bg-scilens-navy text-white rounded-xl shadow-xl space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-scilens-lightteal block">
            DEFENSE PREPARATION CHECKLIST
          </span>
          <h4 className="font-serif text-lg font-bold text-white">
            Critical Questions Peer Reviewers Will Ask
          </h4>
          <div className="space-y-2 pt-2">
            {critiqueReport.criticalQuestionsToInvestigate.map((q, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs font-serif italic text-scilens-ivory/90 leading-relaxed"
              >
                "{q}"
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
