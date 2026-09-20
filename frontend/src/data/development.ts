import { ResearchDevelopment } from '../types';
import { generateTopicResearchData } from './demoResearchGenerator';

const canonicalData = generateTopicResearchData('How artificial intelligence changes modern education and writing');

export const demoDevelopment: ResearchDevelopment = {
  researchQuestions: canonicalData.development.researchQuestions.map(q => ({
    id: q.id,
    question: q.question,
    rationale: q.rationale,
    isPrimary: true,
  })),
  objectives: canonicalData.development.studyObjectives.map(o => ({
    id: o.id,
    objective: o.objective,
    targetOutcome: o.targetMetric,
  })),
  hypotheses: canonicalData.development.hypotheses.map(h => ({
    id: h.id,
    statement: h.statement,
    rationale: h.falsificationCondition,
    variables: {
      independent: h.independentVars[0] || 'AI Scaffolding Exposure',
      dependent: h.dependentVars[0] || 'Unassisted Revision Depth',
    },
    testability: 'High',
  })),
  variables: {
    independent: ['AI Scaffolding Exposure', 'Duration of Assistance', 'Model Prompting Granularity'],
    dependent: ['Unassisted Revision Depth', 'Metacognitive Monitoring Accuracy', 'Syntactic and Rhetorical Quality'],
    control: ['Baseline Writing Proficiency', 'Typing Speed', 'Prior Academic Standing'],
    moderating: ['Native Language Status (L1 vs L2/ESL)', 'Self-Regulated Learning Aptitude'],
  },
  suggestedMethodology: {
    approach: 'Mixed-Methods Longitudinal Randomized Controlled Trial (RCT)',
    design: 'Multi-cohort pre-test / intervention / withdrawal post-test design over 12 academic months',
    rationale: 'Longitudinal tracking with synchronized keystroke logging isolates genuine cognitive offloading from transitory novelty effects.',
    dataCollection: 'Synchronized input keystroke logging, think-aloud verbal protocols, and blind expert rubric scoring.',
    analysisPlan: 'Linear mixed-effects modeling (LMM) evaluating rate of revision change across time points and withdrawal phases.',
    threatsToValidity: ['Participant attrition across academic terms', 'Unmonitored external LLM access during independent writing sessions'],
  },
  expectedOutcomes: [
    'Empirical quantification of revision autonomy decay post-AI withdrawal',
    'Cognitive taxonomy distinguishing constructive scaffolding from passive dependency',
    'Validated authentic assessment framework resistant to generative text inflation',
  ],
  potentialContribution: 'First controlled 12-month empirical baseline establishing pedagogical boundaries for generative writing tools in higher education.',
};
