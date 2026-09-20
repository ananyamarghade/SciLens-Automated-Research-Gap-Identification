import { GapInvestigation } from '../types';
import { demoGaps } from './gaps';
import { demoPapers } from './papers';

export const demoInvestigation: GapInvestigation = {
  gapId: 'gap_longitudinal_revision_autonomy',
  candidateGap: demoGaps[0],
  iterationsCount: 3,
  steps: [
    {
      id: 'step_1',
      title: 'Formulate Candidate Gap Hypothesis',
      agent: 'Gap Detection Agent',
      status: 'completed',
      timestamp: '10:14:02 AM',
      action: 'Extracted limitation fragments from Kasneci et al. (2023) and Baidoo-Anu & Ansah (2023) regarding absence of multi-term longitudinal retention data.',
      result: 'Formulated hypothesis: "Habituation to generative AI writing assistance leads to measurable atrophy of independent revision autonomy and metacognitive monitoring once scaffolding is removed."',
      evidenceFoundCount: 3,
    },
    {
      id: 'step_2',
      title: 'Targeted Literature Counter-Search',
      agent: 'Literature Discovery Agent',
      status: 'completed',
      timestamp: '10:14:38 AM',
      action: 'Executed adversarial queries across OpenAlex, arXiv, and CrossRef to find empirical studies tracking post-AI revision autonomy.',
      result: 'Retrieved 84 candidate publications matching "longitudinal generative AI writing autonomy" and "post-scaffolding essay revision retention". Zero peer-reviewed studies conducted delayed unassisted post-tests (>6 months).',
      evidenceFoundCount: 12,
    },
    {
      id: 'step_3',
      title: 'Retrieve Counter-Evidence & Partial Attempts',
      agent: 'Evidence Critic',
      status: 'completed',
      timestamp: '10:15:15 AM',
      action: 'Critiqued Grassini (2023) and Cotton et al. (2024) for counter-evidence asserting that students develop self-regulating prompt monitoring.',
      result: 'Identified Grassini survey data showing 68% immediate drafting speedup, but verified it lacked longitudinal artifact analysis. Reclassified as contextual divergence.',
      evidenceFoundCount: 4,
    },
    {
      id: 'step_4',
      title: 'Adversarial Disproof Challenge',
      agent: 'Gap Investigator Agent',
      status: 'completed',
      timestamp: '10:15:42 AM',
      action: 'Tested whether reported revision declines can be attributed to generic assignment fatigue rather than AI tool dependency.',
      result: 'Synthesized historical baseline comparison from Graham & Perin (2007) meta-analysis (d=0.82 for explicit strategy instruction). Confirmed current generative workflows lack explicit metacognitive strategy instruction.',
      evidenceFoundCount: 2,
    },
    {
      id: 'step_5',
      title: 'Novelty & Grounding Final Verdict',
      agent: 'Validation Agent',
      status: 'completed',
      timestamp: '10:16:05 AM',
      action: 'Calibrated evidence strength (0.74), confidence bounds, and formulated 12-month longitudinal study parameters.',
      result: 'Gap classified as VALIDATED / SUPPORTED. Ready for empirical research proposal development.',
      evidenceFoundCount: 8,
    },
  ],
  supportingPapers: [demoPapers[1], demoPapers[2], demoPapers[7]],
  contradictingPapers: [demoPapers[8]],
  aiReasoning: {
    challengedBy: [
      'Querying whether 2024–2025 learning science literature already established long-term retention benchmarks.',
      'Testing whether observed revision declines stem from educator grading subjectivity rather than genuine cognitive offloading.',
      'Checking whether automated keystroke logging sufficiently isolates assisted versus unassisted editing actions.',
    ],
    whySurvived:
      'The gap survived because literature retrieval confirmed that published studies remain predominantly cross-sectional surveys or single-assignment demonstrations. No existing peer-reviewed trial tracks student revision autonomy across a 12-month withdrawal timeline with synchronized keystroke and think-aloud instrumentation.',
    whatRemainsUncertain:
      'Whether the rate of cognitive offloading differs significantly between first-language (L1) and second-language (L2/ESL) student writers.',
  },
  finalVerdict: {
    status: 'Validated',
    strength: 'Moderate-to-Strong Convergence (0.74 Resilience Score)',
    noveltyScore: 0.88,
    recommendedAction: 'Formulate randomized controlled trial protocol tracking undergraduate essay composition across 12-month interval with phased AI withdrawal.',
  },
};
