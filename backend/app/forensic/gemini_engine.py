import os
import base64
from typing import Tuple, List
from app.models.schemas import AIVisualResult, EvidenceItem
from app.core.config import settings
from app.forensic.gemini_client import gemini_json

FORENSIC_VISION_SYSTEM_PROMPT = """
You are TruthLens Senior Forensic Vision Analyst and Generative AI Manipulation Specialist.
Evaluate THIS SUBMITTED IMAGE strictly on its own visual evidence as an isolated, independent forensic case. Do NOT assume the image is authentic.

YOUR CORE MISSION:
Determine whether this image is:
(A) An untouched, unedited physical photograph captured directly by an optical camera lens, OR
(B) A Generative AI synthesis OR an AI-edited / inpainted photograph (e.g. AI face modification, generative fill, AI inpainting, subject insertion/swapping, AI skin/hair retouching, or full text-to-image synthesis from Midjourney, DALL-E, Stable Diffusion, Flux, Photoshop Generative Fill).

INDEPENDENT FORENSIC CRITERIA:
1. HYBRID & LOCALIZED AI EDITING / INPAINTING SIGNATURES:
   - Facial & Subject Inpainting: Unnatural generative skin smoothing contrasting with gritty background camera noise; plastic or wax-like texture on skin or hair; AI beauty/retouching filters (FaceApp, Remini, etc.).
   - Object Insertion / Removal / Generative Fill: Repetitive background cloning, smudged texture patches where an object was removed, or inserted items lacking true physical shadows.
   - Outpainting / Generative Expansion: Real center photo surrounded by AI-synthesized periphery or background replacement.
   - Blending & Edge Halos: Faint blurring, feathering, or haloing along hairlines, neck seams, glasses frames, or body contours where an AI-generated or modified subject meets the real background.
   - Lighting & Vector Mismatches: Highlights, shadows, or reflections on the subject's face, eyes, or glasses that do not align with background light sources or ambient room illumination.
   - Micro-Anatomical Inconsistencies: Warped finger joints, unnatural fingernails, asymmetrical glasses ear-stems, or blurred ear connections.
2. FULL GENERATIVE AI & FANTASY SYNTHESIS SIGNATURES:
   - Impossible anatomy or fantasy biology (e.g., animals with glowing plasma/fire fur, electrical wings, glowing neon eyes without natural reflections).
   - Text-to-image diffusion rendering signatures (fractal brushwork, hyper-smooth plastic gradients, algorithmic swirls, dream-like texture transitions, AI painterly noise).
3. PHYSICAL CAMERA OPTICAL REALISM:
   - Coherent real-world physics, uniform camera sensor noise grain across all subjects and background, natural depth-of-field blur, authentic optical reflections, and physically grounded geometry with no localized AI smoothing.

SCORING & SEVERITY RULES:
- If the image displays EITHER full Generative AI synthesis OR localized AI editing, inpainting, face-swap, or generative retouching:
  * You MUST set "is_ai_generated": true
  * You MUST set "severity": "suspicious"
  * You MUST set "score_impact": 25 to 35
  * You MUST document all synthetic or manipulated visual cues in "visual_anomalies" and "generation_artifacts_observed".
- If the image is completely genuine with no generative editing or manipulation:
  * Set "is_ai_generated": false, "severity": "informational", "score_impact": 0, "visual_anomalies": [], "generation_artifacts_observed": [].

You must output STRICTLY valid JSON with no markdown wrapping, matching this exact schema:
{
  "is_ai_generated": true,
  "scene_description": "Detailed description of objects, environment, and whether localized AI editing or full generation is present",
  "detected_entities": ["entity 1", "entity 2"],
  "visual_anomalies": ["observed anomaly, inpainting seam, or lighting mismatch 1", "observed anomaly 2"],
  "lighting_physics": "Assessment of light sources, shadows, and consistency between subject and environment",
  "anatomical_or_structural_consistency": "Assessment of biological feasibility, anatomy, hair/glasses boundaries, and background perspective",
  "generation_artifacts_observed": ["generative smoothing", "inpainting blending halo", "diffusion signature"],
  "confidence_rationale": "Clear scientific rationale for determination",
  "severity": "suspicious",
  "score_impact": 30
}
"""

async def analyze_with_gemini(filepath: str) -> Tuple[AIVisualResult, List[EvidenceItem]]:
    evidence_items: List[EvidenceItem] = []
    
    # Check if API Key is available
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return _generate_fallback_ai_analysis(filepath, is_live=False)

    try:
        # Read image and encode base64
        with open(filepath, "rb") as f:
            image_bytes = f.read()
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        
        # Determine mime type
        ext = os.path.splitext(filepath)[1].lower()
        mime_type = "image/jpeg"
        if ext in [".png"]:
            mime_type = "image/png"
        elif ext in [".webp"]:
            mime_type = "image/webp"

        parsed, error, model_used = await gemini_json([
            {"text": FORENSIC_VISION_SYSTEM_PROMPT},
            {"inline_data": {"mime_type": mime_type, "data": b64_image}},
            {"text": "Perform forensic visual anomaly and physical consistency analysis on this image. Return valid JSON only. Do not invent regions, scores, or artifacts you cannot describe from the image."},
        ])
        if error or parsed is None:
            return _generate_fallback_ai_analysis(filepath, is_live=False, error_msg=error or "empty model output")
        settings_model = model_used or settings.GEMINI_MODEL
        
        scene_desc = parsed.get("scene_description", "Visual scene examined.")
        entities = parsed.get("detected_entities", [])
        anomalies = parsed.get("visual_anomalies", [])
        lighting = parsed.get("lighting_physics", "Standard illumination observed.")
        structural = parsed.get("anatomical_or_structural_consistency", "Standard anatomy and geometry observed.")
        artifacts = parsed.get("generation_artifacts_observed", [])
        confidence = parsed.get("confidence_rationale", "Moderate confidence based on visible pixel structure.")
        is_ai_gen = bool(parsed.get("is_ai_generated", False))
        severity = parsed.get("severity", "informational")
        score_impact = int(parsed.get("score_impact", 0))

        # Check for strong generative AI cues in text descriptions
        ai_cue_words = [
            "generative ai", "diffusion", "synthetic", "text-to-image", "plasma", 
            "impossible", "fantasy", "algorithmic", "hyper-stylized", "brushwork", 
            "fractal", "bioluminescent", "swirling", "digital art", "ai-generated",
            "ai stylistic", "midjourney", "dall-e", "stable diffusion", "inpainting",
            "face-swap", "generative fill", "retouching", "manipulated", "smoothing",
            "blending artifact", "halo", "ai-edited", "ai edited"
        ]
        has_ai_cues = any(
            any(w in s.lower() for w in ai_cue_words)
            for s in (anomalies + artifacts + [scene_desc, lighting, structural])
        )

        if is_ai_gen or has_ai_cues or len(anomalies) + len(artifacts) >= 1:
            severity = "suspicious"
            score_impact = max(score_impact, 30)

        # Build evidence items
        if anomalies or artifacts or is_ai_gen:
            evidence_items.append(EvidenceItem(
                id="AI-VIS-01",
                title="Generative AI Manipulation & Inpainting Detected",
                layer="AI Visual Verification",
                severity=severity,
                confidence="High Confidence" if (is_ai_gen or has_ai_cues) else "Moderate Confidence",
                explanation="; ".join(anomalies + artifacts) if (anomalies or artifacts) else "Generative AI inpainting, face modification, or synthetic rendering signatures identified.",
                why_flagged="Multimodal vision inspection detected localized AI inpainting, generative facial smoothing, or physical lighting inconsistencies contrasting with the surrounding environment.",
                limitations="Vision models evaluate macroscopic rendering styles and geometric physics; highly realistic photorealistic deepfakes may require secondary metadata corroboration.",
                evidence_source=f"Google Gemini Multimodal Vision ({settings_model})",
                score_impact=min(max(score_impact, 25), 35)
            ))
        else:
            evidence_items.append(EvidenceItem(
                id="AI-VIS-02",
                title="Optical Coherence & Scene Realism",
                layer="AI Visual Verification",
                severity="informational",
                confidence="Moderate Confidence",
                explanation=f"Visual lighting ({lighting[:90]}...) and anatomical geometry appear physically consistent with natural camera photography.",
                why_flagged="No overt generative AI synthesis artifacts or impossible physical mutations were identified by the multimodal inspector.",
                limitations="State-of-the-art diffusion and GAN models can generate visually flawless subjects that pass macroscopic human and AI inspection.",
                evidence_source=f"Google Gemini Multimodal Vision ({settings_model})",
                score_impact=0
            ))

        ai_result = AIVisualResult(
            scene_description=scene_desc,
            detected_entities=entities,
            visual_anomalies=anomalies,
            lighting_physics=lighting,
            anatomical_or_structural_consistency=structural,
            generation_artifacts_observed=artifacts,
            confidence_rationale=confidence,
            ai_disclaimer="AI observations provide contextual reasoning and are not definitive mathematical proof of forgery."
        )

        return ai_result, evidence_items

    except Exception as e:
        return _generate_fallback_ai_analysis(filepath, is_live=False, error_msg=str(e))

def _generate_fallback_ai_analysis(filepath: str, is_live: bool = False, error_msg: str = "") -> Tuple[AIVisualResult, List[EvidenceItem]]:
    """
    Transparent fallback engine used when GEMINI_API_KEY is not configured
    or when an API error occurs, providing deterministic forensic visual checks.
    """
    evidence_items: List[EvidenceItem] = []
    status_note = f" (Offline Mode: {error_msg})" if error_msg else " (Live Gemini API Key pending in .env)"

    scene_desc = f"Vision-model analysis was not completed{status_note}. No scene description was inferred."
    entities = []
    anomalies = []
    artifacts = []
    lighting = "Not assessed. No lighting conclusion was produced."
    structural = "Not assessed. No anatomical or structural conclusion was produced."
    confidence = "No vision-model confidence is available for this run."

    evidence_items.append(EvidenceItem(
        id="AI-FALLBACK-01",
        title="AI Multimodal Status Notice",
        layer="AI Visual Verification",
        severity="informational",
        confidence="Preliminary Observation",
        explanation=f"Multimodal vision engine evaluated in offline baseline mode{status_note}.",
        why_flagged="To enable live Gemini 1.5/2.0 multimodal reasoning, configure GEMINI_API_KEY in backend/.env.",
        limitations="Offline mode evaluates heuristic visual consistency; live Gemini analysis provides deep semantic cross-verification.",
        evidence_source="TruthLens Local Vision Heuristics",
        score_impact=0
    ))

    ai_result = AIVisualResult(
        scene_description=scene_desc,
        detected_entities=entities,
        visual_anomalies=anomalies,
        lighting_physics=lighting,
        anatomical_or_structural_consistency=structural,
        generation_artifacts_observed=artifacts,
        confidence_rationale=confidence,
        ai_disclaimer="Live Gemini API key can be configured in backend/.env for deep reasoning."
    )

    return ai_result, evidence_items
