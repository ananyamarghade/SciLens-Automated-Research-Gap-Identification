import { AgentActivityItem } from '../types';
import { generateTopicResearchData } from './demoResearchGenerator';

const canonicalData = generateTopicResearchData('How artificial intelligence changes modern education and writing');

export const demoAgentActivities: AgentActivityItem[] = canonicalData.agentActivities;
