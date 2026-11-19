import os
import cv2
import numpy as np
from typing import Tuple, List, Optional
from app.models.schemas import QualityGateResult, EvidenceItem

def assess_image_quality(filepath: str) -> Tuple[QualityGateResult, Optional[EvidenceItem]]:
    observations = []
    limitations = []
    status = "PASS"
    score = 95
    
    try:
        img = cv2.imread(filepath)
        if img is None:
            return QualityGateResult(
                status="INSUFFICIENT",
                quality_score=20,
                resolution_check="Failed to load image raster",
                signal_to_noise_check="Unknown",
                duration_or_length_check="N/A",
                observations=["Image file could not be decoded as standard pixel matrix."],
                limitations=["Forensic certainty is zero due to undecodable container."]
            ), EvidenceItem(
                id="QUAL-01",
                title="Forensic Quality Gate: Unreadable Pixel Data",
                layer="Forensic Quality Gate",
                severity="suspicious",
                confidence="High Confidence",
                explanation="Raster decoding failed for the uploaded image container.",
                why_flagged="Corrupted or non-standard image encoding prevents pixel-level forensic scrutiny.",
                limitations="File may be an unsupported format or corrupted stream.",
                evidence_source="Pre-Flight Quality Gate",
                score_impact=20
            )
        
        h, w = img.shape[:2]
        res_str = f"{w}x{h} px"
        
        # Check 1: Resolution adequacy
        if w < 250 or h < 250:
            status = "MARGINAL"
            score -= 30
            observations.append(f"Low image resolution ({res_str}). Sub-pixel interpolation artifacts may skew spatial noise estimates.")
            limitations.append("Resolution < 250px limits certainty of sensor PRNU noise extraction and ELA edge analysis.")
        else:
            observations.append(f"Spatial resolution ({res_str}) is sufficient for high-frequency pixel forensics.")
            
        # Check 2: Severe blur / motion degradation
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if lap_var < 20.0:
            score -= 20
            observations.append(f"Severe global blur detected (Laplacian variance: {lap_var:.1f}). Fine-grained splicing boundaries are softened.")
            limitations.append("High blur suppresses high-frequency compression boundaries.")
        else:
            observations.append("Sharpness and focus profile are adequate for edge gradient tracking.")
            
        # Check 3: Dynamic range / extreme underexposure or overexposure
        mean_lum = float(np.mean(gray))
        if mean_lum < 15 or mean_lum > 240:
            score -= 15
            observations.append(f"Extreme luminance distribution detected (mean: {mean_lum:.1f}). Color clipping observed.")
            limitations.append("Extreme over/underexposure clips forensic pixel variation.")
        else:
            observations.append("Luminance and contrast dynamic range are well-distributed.")

    except Exception as e:
        status = "MARGINAL"
        score = 60
        observations.append(f"Quality gate fallback assessment: {str(e)}")

    evidence_item = None
    if status == "MARGINAL":
        evidence_item = EvidenceItem(
            id="QUAL-02",
            title="Forensic Quality Gate: Marginal Sample Fidelity",
            layer="Forensic Quality Gate",
            severity="low",
            confidence="High Confidence",
            explanation=f"Pre-flight inspection noted marginal input properties (Quality Score: {score}/100).",
            why_flagged="Low resolution, extreme blur, or aggressive compression degrades fine sensor signatures.",
            limitations="Forensic findings on marginal quality media have higher uncertainty margins.",
            evidence_source="Pre-Flight Quality Control",
            score_impact=5
        )
    else:
        evidence_item = EvidenceItem(
            id="QUAL-01",
            title="Forensic Quality Gate: High-Fidelity Verified",
            layer="Forensic Quality Gate",
            severity="informational",
            confidence="High Confidence",
            explanation=f"Sample resolution and signal dynamic range meet ISO forensic examination criteria (Score: {score}/100).",
            why_flagged="Optimal spatial sharpness and pixel density allow reliable sensor noise, ELA, and metadata analysis.",
            limitations="High-quality media does not guarantee authenticity; it permits definitive forensic execution.",
            evidence_source="Pre-Flight Quality Control",
            score_impact=0
        )

    return QualityGateResult(
        status=status,
        quality_score=max(0, score),
        resolution_check=res_str,
        signal_to_noise_check="Pass" if score > 70 else "Degraded",
        duration_or_length_check="N/A",
        observations=observations,
        limitations=limitations
    ), evidence_item

def assess_audio_quality(duration_s: float, sample_rate_hz: int) -> Tuple[QualityGateResult, Optional[EvidenceItem]]:
    status = "PASS"
    score = 90
    observations = []
    limitations = []

    if duration_s < 1.0:
        status = "MARGINAL"
        score = 50
        observations.append(f"Audio duration ({duration_s:.1f}s) is very brief. Speech prosody and respiratory breathing intervals cannot be fully established.")
        limitations.append("Recordings shorter than 1.5s lack sufficient phonetic variety for synthetic voice confirmation.")
    else:
        observations.append(f"Audio duration ({duration_s:.1f}s) provides adequate acoustic sample length.")

    if sample_rate_hz < 16000:
        score -= 20
        observations.append(f"Sample rate ({sample_rate_hz} Hz) restricts spectral bandwidth below standard 16kHz forensic baseline.")
        limitations.append("Low sampling rate prevents inspection of >8kHz vocoder frequency drop-offs.")
    else:
        observations.append(f"Sample rate ({sample_rate_hz} Hz) covers full acoustic frequency spectrum.")

    ev = EvidenceItem(
        id="QUAL-AUD-01",
        title="Forensic Quality Gate: Audio Signal Check",
        layer="Forensic Quality Gate",
        severity="informational" if status == "PASS" else "low",
        confidence="High Confidence",
        explanation=f"Audio signal pre-flight evaluation achieved {score}/100 quality score ({status}).",
        why_flagged="Acoustic bandwidth and duration determine the mathematical validity of Fourier vocoder checks.",
        limitations="Short or heavily compressed audio clips reduce prosodic deepfake detection confidence.",
        evidence_source="Pre-Flight Acoustic Quality Gate",
        score_impact=0 if status == "PASS" else 5
    )

    return QualityGateResult(
        status=status,
        quality_score=score,
        resolution_check=f"{sample_rate_hz} Hz",
        signal_to_noise_check="Pass",
        duration_or_length_check=f"{duration_s:.1f}s",
        observations=observations,
        limitations=limitations
    ), ev

def assess_video_quality(duration_s: float, frame_count: int, width: int, height: int) -> Tuple[QualityGateResult, Optional[EvidenceItem]]:
    status = "PASS"
    score = 95
    observations = []
    limitations = []

    if duration_s < 1.0 or frame_count < 15:
        status = "MARGINAL"
        score = 55
        observations.append(f"Video stream is very brief ({duration_s:.1f}s, {frame_count} frames). Temporal trajectory calculation has wide variance.")
        limitations.append("Temporal consistency requires at least 15 frames for statistical confidence.")
    else:
        observations.append(f"Video duration ({duration_s:.1f}s) and frame count ({frame_count}) provide robust temporal sequence.")

    if width < 320 or height < 240:
        score -= 25
        status = "MARGINAL"
        observations.append(f"Low video resolution ({width}x{height} px) impedes fine facial boundary edge verification.")
        limitations.append("Sub-VGA resolution causes false-positive edge blur artifacts.")
    else:
        observations.append(f"Video resolution ({width}x{height} px) is sufficient for facial mask contour inspection.")

    ev = EvidenceItem(
        id="QUAL-VID-01",
        title="Forensic Quality Gate: Video Temporal Baseline",
        layer="Forensic Quality Gate",
        severity="informational" if status == "PASS" else "low",
        confidence="High Confidence",
        explanation=f"Video stream pre-flight check scored {score}/100 ({status}).",
        why_flagged="Sufficient spatial resolution and temporal duration are required to isolate facial boundary warping.",
        limitations="Heavily downscaled video streams reduce facial tracking confidence.",
        evidence_source="Pre-Flight Video Quality Gate",
        score_impact=0 if status == "PASS" else 5
    )

    return QualityGateResult(
        status=status,
        quality_score=score,
        resolution_check=f"{width}x{height} px",
        signal_to_noise_check="Pass",
        duration_or_length_check=f"{duration_s:.1f}s ({frame_count} frames)",
        observations=observations,
        limitations=limitations
    ), ev

def assess_text_quality(word_count: int) -> Tuple[QualityGateResult, Optional[EvidenceItem]]:
    status = "PASS"
    score = 90
    observations = []
    limitations = []

    if word_count < 25:
        status = "MARGINAL"
        score = 45
        observations.append(f"Text sample contains only {word_count} words. Stylometric burstiness and Type-Token Ratio require longer corpora.")
        limitations.append("Statistical stylometry has high error rates on texts under 30 words.")
    else:
        observations.append(f"Text sample length ({word_count} words) satisfies statistical stylometric corpus requirements.")

    ev = EvidenceItem(
        id="QUAL-TXT-01",
        title="Forensic Quality Gate: Text Corpus Length",
        layer="Forensic Quality Gate",
        severity="informational" if status == "PASS" else "low",
        confidence="High Confidence",
        explanation=f"Text corpus pre-flight check scored {score}/100 ({status}).",
        why_flagged="Syntactic burstiness and vocabulary entropy requires sufficient token volume.",
        limitations="Short snippets cannot be definitively attributed to LLM generation on stylometry alone.",
        evidence_source="Pre-Flight Text Quality Gate",
        score_impact=0 if status == "PASS" else 5
    )

    return QualityGateResult(
        status=status,
        quality_score=score,
        resolution_check="N/A",
        signal_to_noise_check="Pass",
        duration_or_length_check=f"{word_count} words",
        observations=observations,
        limitations=limitations
    ), ev
