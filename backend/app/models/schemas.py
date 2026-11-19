from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

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
    synthetic_prosody_score: float  # 0.0 to 100.0
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
    video_diagnostics: Optional[VideoDiagnostics] = None
    audio_diagnostics: Optional[AudioDiagnostics] = None
    text_diagnostics: Optional[TextDiagnostics] = None
    evidence_scorecard: List[EvidenceItem]
    limitations: List[str]
    recommendations: List[str]
    report_download_url: Optional[str] = None
    created_at: str
