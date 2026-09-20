import { CitationStyle, FormattedCitation, ClaimVerificationItem } from '../types';
import { generateTopicResearchData } from './demoResearchGenerator';

const canonicalData = generateTopicResearchData('How artificial intelligence changes modern education and writing');

export const demoCitationsByStyle: Record<CitationStyle, FormattedCitation[]> = canonicalData.citationsByStyle;
export const demoClaimVerifications: ClaimVerificationItem[] = canonicalData.claimVerifications;
