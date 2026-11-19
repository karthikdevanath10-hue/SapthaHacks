export type MediaModality = 'image' | 'video' | 'audio' | 'text';

export interface EvidenceItem {
  id: string;
  title: string;
  layer: string;
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
    red_mean?: number;
    green_mean?: number;
    blue_mean?: number;
  };
  brightness_mean: number;
  contrast_std: number;
  compression_observation: string;
  observations: string[];
  suspicious_indicators: string[];
}

export interface EditedFrameSegment {
  timestamp_seconds: number;
  timestamp_formatted: string;
  frame_number: number;
  confidence: string;
  anomaly_type: string;
  delta_score: number;
  explanation: string;
}

export interface VideoDiagnostics {
  duration_seconds: number;
  fps: number;
  frame_count: number;
  resolution: { width: number; height: number };
  codec: string;
  temporal_jitter_score: number;
  facial_boundary_anomaly: boolean;
  keyframes_analyzed: number;
  edited_frame_timestamps?: number[];
  edited_segments?: EditedFrameSegment[];
  deepfake_visual_cues: string[];
  observations: string[];
  suspicious_indicators: string[];
}

export interface AudioDiagnostics {
  duration_seconds: number;
  sample_rate_hz: number;
  channels: number;
  bitrate_kbps?: number;
  format: string;
  speech_silence_ratio: number;
  unnatural_pause_detected: boolean;
  synthetic_prosody_score: number;
  spectral_cutoff_observed: boolean;
  observations: string[];
  suspicious_indicators: string[];
}

export interface TextDiagnostics {
  word_count: number;
  sentence_count: number;
  lexical_diversity_ttr: number;
  burstiness_score: number;
  ai_generation_likelihood: string;
  stylometric_markers: string[];
  factuality_flags: string[];
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
  consistency_verdict: string;
  discrepancy_details: string[];
  semantic_match_score: number;
  explanation: string;
}

export interface QualityGateResult {
  status: 'PASS' | 'MARGINAL' | 'INSUFFICIENT';
  quality_score: number;
  resolution_check: string;
  signal_to_noise_check: string;
  duration_or_length_check: string;
  observations: string[];
  limitations: string[];
}

export interface FullAnalysisResponse {
  investigation_id: string;
  modality: MediaModality;
  image_name: string;
  image_hash: string;
  media_preview?: string | null;
  assessment: string;
  indicator_score: number;
  summary: string;
  metadata: MetadataResult;
  technical: TechnicalResult;
  ai_analysis: AIVisualResult;
  caption_comparison: CaptionComparisonResult;
  video_diagnostics?: VideoDiagnostics;
  audio_diagnostics?: AudioDiagnostics;
  text_diagnostics?: TextDiagnostics;
  quality_gate?: QualityGateResult;
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
