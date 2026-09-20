import { ResearchGap, ContradictionItem } from '../types';
import { generateTopicResearchData } from './demoResearchGenerator';

const canonicalData = generateTopicResearchData('How artificial intelligence changes modern education and writing');

export const demoGaps: ResearchGap[] = canonicalData.gaps;
export const demoContradictions: ContradictionItem[] = canonicalData.contradictions;
export const heatmapData = canonicalData.heatmapData;
export const underexploredAreas = canonicalData.underexploredAreas;
