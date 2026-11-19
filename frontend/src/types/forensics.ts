export type VerdictStatus = 
  | 'NO_SIGNIFICANT_INDICATORS'
  | 'REQUIRES_FURTHER_INVESTIGATION'
  | 'MULTIPLE_INDICATORS_DETECTED'
  | 'INSUFFICIENT_EVIDENCE';

export interface PillarScorecard {
  id: string;
  pillarNumber: string;
  title: string;
  severity: 'WARNING' | 'CRITICAL' | 'MOD-HIGH' | 'CLEAN';
  description: string;
  confidence: number | string;
  limitations: string;
}

export interface GroundTruthAudit {
  claimedLocation: string;
  detectedLocation: string;
  isLocationMismatch: boolean;
  claimedDateSeason: string;
  detectedSolarElevation: string;
  isChronologicalConflict: boolean;
  meteorologicalCheck: string;
}

export interface ForensicCase {
  id: string;
  filename: string;
  fileSize: string;
  resolution: string;
  sha256: string;
  leadExaminer: string;
  timestamp: string;
  verdict: VerdictStatus;
  primaryVector: string;
  secondaryVector: string;
  executiveSynthesis: string;
  scorecards: PillarScorecard[];
  groundTruth: GroundTruthAudit;
  plainEnglishBrief: string[];
  recommendedProtocol: Array<{ title: string; action: string; priority: 'MANDATORY' | 'HIGH' | 'RECOMMENDED' }>;
}
