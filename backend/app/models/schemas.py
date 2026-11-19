from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class EvidenceItem(BaseModel):
    id: str
    title: str
    layer: str  # "Metadata Analysis", "Technical Forensics", "AI Visual Verification", "Caption Cross-Verification"
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
    noise_variance: float
    laplacian_variance_blur: float
    ela_mean_difference: float
    ela_anomaly_detected: bool
    color_channel_balance: Dict[str, float]
    brightness_mean: float
    contrast_std: float
    compression_observation: str
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
    image_name: str
    image_hash: str
    assessment: str
    indicator_score: int
    summary: str
    metadata: MetadataResult
    technical: TechnicalResult
    ai_analysis: AIVisualResult
    caption_comparison: CaptionComparisonResult
    evidence_scorecard: List[EvidenceItem]
    limitations: List[str]
    recommendations: List[str]
    report_download_url: Optional[str] = None
    created_at: str
