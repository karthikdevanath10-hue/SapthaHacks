import os
import json
import base64
import httpx
from typing import Tuple, List, Optional
from app.models.schemas import CaptionComparisonResult, EvidenceItem, AIVisualResult
from app.core.config import settings

CAPTION_CROSS_VERIFICATION_PROMPT = """
You are a Digital Forensics Fact-Checking Specialist.
Your task is to compare a user-provided CAPTION or CLAIM against the actual visual reality depicted in the image.

CAPTION TO VERIFY:
"{caption}"

ADDITIONAL CONTEXT (if any):
"{source_context}"

RULES:
1. Examine if the caption makes claims that contradict the image (e.g. caption says "massive explosion in winter", but image shows a peaceful summer park).
2. Distinguish between:
   - "Consistent": Caption faithfully describes what is seen.
   - "Partially Inconsistent": Minor discrepancies or exaggerated claims.
   - "Mismatched / Contradictory": The image directly contradicts the caption claims (Out-of-context media).
3. A caption mismatch means the media is being MISUSED out of context. It does NOT automatically mean the photograph itself is an AI fake.
4. Output STRICTLY valid JSON:
{
  "consistency_verdict": "Consistent" | "Partially Inconsistent" | "Mismatched / Contradictory",
  "discrepancy_details": ["discrepancy 1", "discrepancy 2"],
  "semantic_match_score": 0.0 to 1.0,
  "explanation": "Clear explanation of how the caption aligns with or contradicts the image.",
  "why_it_matters": "Why this mismatch is significant for forensic disinformation analysis",
  "severity": "informational" | "low" | "medium" | "suspicious",
  "score_impact": 0 to 25
}
"""

async def cross_verify_caption_and_image(
    filepath: str,
    caption: Optional[str],
    source_context: Optional[str],
    ai_visual: AIVisualResult
) -> Tuple[CaptionComparisonResult, List[EvidenceItem]]:
    evidence_items: List[EvidenceItem] = []

    if not caption or not caption.strip():
        caption_result = CaptionComparisonResult(
            caption_provided=False,
            caption_text=None,
            source_context=source_context,
            consistency_verdict="No Caption Provided",
            discrepancy_details=[],
            semantic_match_score=1.0,
            explanation="No contextual claim or caption was submitted for cross-verification. Analysis proceeded on visual/technical properties alone."
        )
        return caption_result, evidence_items

    caption_clean = caption.strip()
    api_key = settings.GEMINI_API_KEY

    if not api_key:
        return _fallback_cross_verification(caption_clean, source_context, ai_visual)

    try:
        with open(filepath, "rb") as f:
            image_bytes = f.read()
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        
        ext = os.path.splitext(filepath)[1].lower()
        mime_type = "image/jpeg"
        if ext in [".png"]:
            mime_type = "image/png"
        elif ext in [".webp"]:
            mime_type = "image/webp"

        prompt_text = (
            CAPTION_CROSS_VERIFICATION_PROMPT
            .replace("{caption}", caption_clean)
            .replace("{source_context}", source_context or "Not specified")
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt_text},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_image
                            }
                        },
                        {"text": "Analyze image and caption correspondence. Return strictly valid JSON."}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)

        if response.status_code == 200:
            res_json = response.json()
            candidates = res_json.get("candidates", [])
            if candidates:
                raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                parsed = json.loads(raw_text.strip("```json").strip("```").strip())
                
                verdict = parsed.get("consistency_verdict", "Consistent")
                discrepancies = parsed.get("discrepancy_details", [])
                match_score = float(parsed.get("semantic_match_score", 1.0))
                explanation = parsed.get("explanation", "Caption examined against visual evidence.")
                why_matters = parsed.get("why_it_matters", "Cross-checking claims prevents misattribution.")
                severity = parsed.get("severity", "informational")
                score_impact = int(parsed.get("score_impact", 0))

                if verdict in ["Mismatched / Contradictory", "Partially Inconsistent"]:
                    evidence_items.append(EvidenceItem(
                        id="CAP-MISMATCH-01",
                        title=f"Context-Image Discordance ({verdict})",
                        layer="Caption Cross-Verification",
                        severity=severity,
                        confidence="High Confidence",
                        explanation=explanation,
                        why_flagged=f"Claim discrepancy identified: {why_matters}",
                        limitations="A narrative or context mismatch indicates misattribution or false framing, not that the image pixels were synthesized.",
                        evidence_source=f"Gemini Cross-Modal Text-Vision Verification ({settings.GEMINI_MODEL})",
                        score_impact=score_impact
                    ))
                else:
                    evidence_items.append(EvidenceItem(
                        id="CAP-MATCH-01",
                        title="Caption-Image Semantic Consistency",
                        layer="Caption Cross-Verification",
                        severity="informational",
                        confidence="High Confidence",
                        explanation=explanation,
                        why_flagged="Submitted caption faithfully reflects the visible scene and entities.",
                        limitations="A consistent caption can still accompany a fully synthetic or repurposed image.",
                        evidence_source=f"Gemini Cross-Modal Text-Vision Verification ({settings.GEMINI_MODEL})",
                        score_impact=0
                    ))

                return CaptionComparisonResult(
                    caption_provided=True,
                    caption_text=caption_clean,
                    source_context=source_context,
                    consistency_verdict=verdict,
                    discrepancy_details=discrepancies,
                    semantic_match_score=match_score,
                    explanation=explanation
                ), evidence_items

    except Exception as e:
        print("[CrossVerification] Warning:", e)

    return _fallback_cross_verification(caption_clean, source_context, ai_visual)

async def cross_verify_generic_modality_claim(
    modality: str,
    caption: Optional[str],
    source_context: Optional[str],
    ai_visual: AIVisualResult
) -> Tuple[CaptionComparisonResult, List[EvidenceItem]]:
    evidence_items: List[EvidenceItem] = []
    if not caption or not caption.strip():
        return CaptionComparisonResult(
            caption_provided=False,
            caption_text=None,
            source_context=source_context,
            consistency_verdict="No Caption Provided",
            discrepancy_details=[],
            semantic_match_score=1.0,
            explanation=f"No external claim or caption was submitted for cross-verification of this {modality} recording."
        ), evidence_items

    caption_clean = caption.strip()
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return _fallback_cross_verification(caption_clean, source_context, ai_visual)

    prompt = f"""
You are a Digital Forensics Fact-Checking Specialist.
Evaluate whether the following contextual claim matches the investigated {modality.upper()} media content.

CLAIM / CAPTION TO VERIFY:
"{caption_clean}"

INVESTIGATED MEDIA CONTENT / TRANSCRIPT / SCENE SUMMARY:
"{ai_visual.scene_description}"

DETECTED ENTITIES / CUES:
{json.dumps(ai_visual.detected_entities)}

RULES:
1. Determine if the claim contradicts or misrepresents what is actually present in the media.
2. Distinguish:
   - "Consistent": Content matches the claim.
   - "Partially Inconsistent": Exaggerated or minor mismatches.
   - "Mismatched / Contradictory": Media contradicts the claim (Misattribution / Cheapfake).
3. Output STRICTLY valid JSON:
{{
  "consistency_verdict": "Consistent" | "Partially Inconsistent" | "Mismatched / Contradictory",
  "discrepancy_details": ["discrepancy 1"],
  "semantic_match_score": 0.0 to 1.0,
  "explanation": "Clear explanation of agreement or contradiction.",
  "why_it_matters": "Forensic significance of mismatch",
  "severity": "informational" | "low" | "medium" | "suspicious",
  "score_impact": 0 to 25
}}
"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(url, json=payload)
        if response.status_code == 200:
            parsed = json.loads(response.json()["candidates"][0]["content"]["parts"][0]["text"].strip())
            verdict = parsed.get("consistency_verdict", "Consistent")
            discrepancies = parsed.get("discrepancy_details", [])
            match_score = float(parsed.get("semantic_match_score", 1.0))
            explanation = parsed.get("explanation", "Claim evaluated against media description.")
            severity = parsed.get("severity", "informational")
            score_impact = int(parsed.get("score_impact", 0))

            if verdict in ["Mismatched / Contradictory", "Partially Inconsistent"]:
                evidence_items.append(EvidenceItem(
                    id=f"CAP-{modality.upper()[:3]}-01",
                    title=f"Context Misattribution ({modality.capitalize()} vs Claim Mismatch)",
                    layer="Cross-Modal Verification",
                    severity=severity,
                    confidence="High Confidence",
                    explanation=explanation,
                    why_flagged=f"Claim asserts elements absent or contradicted in the {modality} stream.",
                    limitations=f"Misattribution indicates misleading context, not necessarily synthetic {modality} generation.",
                    evidence_source=f"Gemini Cross-Modal Semantic Intelligence ({settings.GEMINI_MODEL})",
                    score_impact=score_impact
                ))
            else:
                evidence_items.append(EvidenceItem(
                    id=f"CAP-{modality.upper()[:3]}-01",
                    title=f"Claim Aligned with {modality.capitalize()} Context",
                    layer="Cross-Modal Verification",
                    severity="informational",
                    confidence="High Confidence",
                    explanation=explanation,
                    why_flagged=f"Claim matches verified {modality} entities and actions.",
                    limitations="Consistent description does not preclude synthetic origin.",
                    evidence_source=f"Gemini Cross-Modal Semantic Intelligence ({settings.GEMINI_MODEL})",
                    score_impact=0
                ))

            return CaptionComparisonResult(
                caption_provided=True,
                caption_text=caption_clean,
                source_context=source_context,
                consistency_verdict=verdict,
                discrepancy_details=discrepancies,
                semantic_match_score=match_score,
                explanation=explanation
            ), evidence_items
    except Exception as e:
        print(f"[GenericCrossVerification] Exception: {e}")

    return _fallback_cross_verification(caption_clean, source_context, ai_visual)

def _fallback_cross_verification(
    caption: str,
    source_context: Optional[str],
    ai_visual: AIVisualResult
) -> Tuple[CaptionComparisonResult, List[EvidenceItem]]:
    evidence_items: List[EvidenceItem] = []
    
    # Offline keyword overlap heuristic
    caption_words = set(w.lower() for w in caption.split() if len(w) > 3)
    scene_words = set(w.lower() for w in (ai_visual.scene_description + " " + " ".join(ai_visual.detected_entities)).split())
    
    overlap = caption_words.intersection(scene_words)
    match_score = min(len(overlap) / max(len(caption_words), 1), 1.0)

    verdict = "Consistent" if match_score > 0.15 else "Partially Inconsistent"
    explanation = (
        f"Submitted claim '{caption[:60]}...' registered partial semantic alignment ({int(match_score*100)}%) with visual entities. "
        "For full semantic contradiction parsing, enable live Gemini API key."
    )

    evidence_items.append(EvidenceItem(
        id="CAP-LOCAL-01",
        title="Caption Context Correlation (Offline Evaluator)",
        layer="Caption Cross-Verification",
        severity="informational",
        confidence="Preliminary Observation",
        explanation=explanation,
        why_flagged="Local keyword entity alignment performed.",
        limitations="Keyword matching cannot detect nuanced semantic contradictions or sarcasm.",
        evidence_source="TruthLens Local Cross-Verification Engine",
        score_impact=0
    ))

    return CaptionComparisonResult(
        caption_provided=True,
        caption_text=caption,
        source_context=source_context,
        consistency_verdict=verdict,
        discrepancy_details=[],
        semantic_match_score=round(match_score, 2),
        explanation=explanation
    ), evidence_items
