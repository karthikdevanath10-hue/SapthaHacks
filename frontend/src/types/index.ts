export interface EvidenceItem {
  id: string;
  title: string;
  layer: 'Metadata Analysis' | 'Technical Forensics' | 'AI Visual Verification' | 'Caption Cross-Verification';
  severity: 'informational' | 'low' | 'medium' | 'suspicious';
  confidence: 'High Confidence' | 'Moderate Confidence' | 'Preliminary Observation';
  explanation: string;
  why_flagged: string;
  limitations: string;
  evidence_source: string;
  score_impact: number;
}

export interface MetadataResult {
  filename: string;
  file_size_bytes: number;
  file_size_human: string;
  dimensions: {
    width: number;
    height: number;
    aspect_ratio: string;
  };
  format: string;
  color_mode: string;
  has_exif: boolean;
  camera_make?: string;
  camera_model?: string;
  software_signature?: string;
  creation_datetime?: string;
  gps_info?: { present: boolean; raw: string };
  sha256_hash: string;
  raw_exif_tags: Record<string, any>;
  observations: string[];
  suspicious_indicators: string[];
}

export interface TechnicalResult {
  noise_variance: number;
  laplacian_variance_blur: number;
  ela_mean_difference: number;
  ela_anomaly_detected: boolean;
  color_channel_balance: {
    red_mean: number;
    green_mean: number;
    blue_mean: number;
  };
  brightness_mean: number;
  contrast_std: number;
  compression_observation: string;
  observations: string[];
  suspicious_indicators: string[];
}

export interface AIVisualResult {
  scene_description: string;
  detected_entities: string[];
  visual_anomalies: string[];
  lighting_physics: string;
  anatomical_or_structural_consistency: string;
  generation_artifacts_observed: string[];
  confidence_rationale: string;
  ai_disclaimer: string;
}

export interface CaptionComparisonResult {
  caption_provided: boolean;
  caption_text?: string;
  source_context?: string;
  consistency_verdict: 'Consistent' | 'Mismatched / Contradictory' | 'Partially Inconsistent' | 'No Caption Provided';
  discrepancy_details: string[];
  semantic_match_score: number;
  explanation: string;
}

export interface FullAnalysisResponse {
  investigation_id: string;
  image_name: string;
  image_hash: string;
  assessment: string;
  indicator_score: number;
  summary: string;
  metadata: MetadataResult;
  technical: TechnicalResult;
  ai_analysis: AIVisualResult;
  caption_comparison: CaptionComparisonResult;
  evidence_scorecard: EvidenceItem[];
  limitations: string[];
  recommendations: string[];
  report_download_url?: string;
  created_at: string;
}

export interface InvestigationSummary {
  id: string;
  image_name: string;
  image_hash: string;
  image_size_bytes: number;
  caption?: string;
  status: string;
  assessment: string;
  indicator_score: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
}
