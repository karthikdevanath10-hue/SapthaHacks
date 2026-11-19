from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class QualityGateResult(BaseModel):
    status: str = "PASS"  # "PASS", "MARGINAL", "INSUFFICIENT"
    quality_score: int = 100  # 0 to 100
    resolution_check: str = "Adequate"
    signal_to_noise_check: str = "Acceptable"
    duration_or_length_check: str = "Optimal"
    observations: List[str] = []
    limitations: List[str] = []

class EvidenceItem(BaseModel):
    id: str
    title: str
    layer: str  # "Metadata Analysis", "Technical Forensics", "AI Visual Verification", "Audio Acoustic Forensics", "Temporal Video Forensics", "Text Stylometry", "Caption Cross-Verification"
    severity: str  # "informational", "low", "medium", "suspicious"
    confidence: str  # "High Confidence", "Moderate Confidence", "Preliminary Observation"
    explanation: str
    why_flagged: str
    limitations: str
    evidence_source: str
    score_impact: int = 0

class MetadataResult(BaseModel):
    filename: str
    file_size_bytes: int
    file_size_human: str
    dimensions: Dict[str, Any]
    format: str
    color_mode: str
    has_exif: bool
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    software_signature: Optional[str] = None
    creation_datetime: Optional[str] = None
    gps_info: Optional[Dict[str, Any]] = None
    sha256_hash: str
    raw_exif_tags: Dict[str, Any] = {}
    observations: List[str] = []
    suspicious_indicators: List[str] = []

class TechnicalResult(BaseModel):
    noise_variance: float = 0.0
    laplacian_variance_blur: float = 0.0
    ela_mean_difference: float = 0.0
    ela_anomaly_detected: bool = False
    color_channel_balance: Dict[str, float] = {}
    brightness_mean: float = 0.0
    contrast_std: float = 0.0
    compression_observation: str = "Standard compression profile."
    observations: List[str] = []
    suspicious_indicators: List[str] = []

class VideoDiagnostics(BaseModel):
    duration_seconds: float
    fps: float
    frame_count: int
    resolution: Dict[str, int]
    codec: str
    temporal_jitter_score: float
    facial_boundary_anomaly: bool
    keyframes_analyzed: int
    deepfake_visual_cues: List[str] = []
    observations: List[str] = []
    suspicious_indicators: List[str] = []

class AudioDiagnostics(BaseModel):
    duration_seconds: float
    sample_rate_hz: int
    channels: int
    bitrate_kbps: Optional[int] = None
    format: str
    speech_silence_ratio: float
    unnatural_pause_detected: bool
    synthetic_prosody_score: float  # Uncalibrated model report, or 0 when not assessed
    synthetic_score_status: str = "not_assessed"  # "model_reported" | "not_assessed"
    spectral_cutoff_observed: bool
    observations: List[str] = []
    suspicious_indicators: List[str] = []

class TextDiagnostics(BaseModel):
    word_count: int
    sentence_count: int
    lexical_diversity_ttr: float  # Type-Token Ratio
    burstiness_score: float
    ai_generation_likelihood: str  # "Low Likelihood", "Moderate Likelihood", "High Synthetic Probability"
    stylometric_markers: List[str] = []
    factuality_flags: List[str] = []
    observations: List[str] = []
    suspicious_indicators: List[str] = []

class AIVisualResult(BaseModel):
    scene_description: str
    detected_entities: List[str] = []
    visual_anomalies: List[str] = []
    lighting_physics: str
    anatomical_or_structural_consistency: str
    generation_artifacts_observed: List[str] = []
    confidence_rationale: str
    ai_disclaimer: str = "AI observations provide contextual reasoning and are not definitive mathematical proof of forgery."

class CaptionComparisonResult(BaseModel):
    caption_provided: bool
    caption_text: Optional[str] = None
    source_context: Optional[str] = None
    consistency_verdict: str  # "Consistent", "Mismatched / Contradictory", "Partially Inconsistent", "No Caption Provided"
    discrepancy_details: List[str] = []
    semantic_match_score: float = 1.0  # 0.0 to 1.0
    explanation: str

class WebPresenceItem(BaseModel):
    platform: str  # "Instagram", "Twitter / X", "Reddit", "TikTok", "YouTube", "News / Web", "Fact Check Registry"
    title: str
    url: Optional[str] = None
    snippet: str
    first_seen_date: Optional[str] = None
    match_confidence: str = "High"  # "High", "Moderate", "Contextual"

class WebPresenceResult(BaseModel):
    mcp_server_connected: bool = True
    found_online: bool = False
    platforms_detected: List[str] = []
    matches: List[WebPresenceItem] = []
    provenance_verdict: str  # "Identified on Public Web & Socials (Repurposed Content)", "No Prior Web Matches Found (Novel / Potential AI Generation)", etc.
    summary: str
    search_query_used: str
    timestamp: str
    tools_invoked: List[str] = ["search_web_presence", "reverse_media_lookup"]

class FindingExplanation(BaseModel):
    evidence_id: str
    observed: str
    supporting_evidence: str
    produced_by: str
    location: str
    uncertainty: str
    alternatives: str
    next_step: str
    severity: str = "informational"
    score_impact: int = 0


class CorrelationRecord(BaseModel):
    id: str
    comparison_type: str
    relation: str  # matching | contradictory | inconclusive | missing | unsupported
    source: str
    rationale: str
    evidence_refs: List[str] = []
    limitations: str = ""


class AnalyzerRun(BaseModel):
    evidence_id: str
    analyzer_name: str
    model_name: str
    model_version: str
    status: str
    findings_count: int = 0
    score_type: str
    score_value: Optional[float] = None
    confidence_note: str
    limitations: List[str] = []
    duration_ms: int = 0
    errors: List[str] = []


class InvestigationRecord(BaseModel):
    id: str
    user_id: Optional[str] = None
    modality: str = "image"
    image_name: str
    image_storage_path: Optional[str] = None
    image_hash: str
    image_size_bytes: int
    caption: Optional[str] = None
    source_context: Optional[str] = None
    status: str = "completed"
    assessment: str
    indicator_score: int
    created_at: str

class FullAnalysisResponse(BaseModel):
    investigation_id: str
    modality: str = "image"  # "image", "video", "audio", "text"
    image_name: str
    image_hash: str
    assessment: str
    indicator_score: int
    summary: str
    metadata: MetadataResult
    technical: TechnicalResult
    ai_analysis: AIVisualResult
    caption_comparison: CaptionComparisonResult
    web_presence: Optional[WebPresenceResult] = None
    video_diagnostics: Optional[VideoDiagnostics] = None
    audio_diagnostics: Optional[AudioDiagnostics] = None
    text_diagnostics: Optional[TextDiagnostics] = None
    quality_gate: Optional[QualityGateResult] = None
    evidence_scorecard: List[EvidenceItem]
    limitations: List[str]
    recommendations: List[str]
    report_download_url: Optional[str] = None
    created_at: str
    duplicate_warning: Optional[str] = None
    explanations: List[FindingExplanation] = []
    correlations: List[CorrelationRecord] = []
    analyzer_runs: List[AnalyzerRun] = []
    processing_notes: List[str] = []
