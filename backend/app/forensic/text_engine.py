import re
import numpy as np
from typing import Tuple, List, Dict, Any
from app.models.schemas import TextDiagnostics, AIVisualResult, EvidenceItem
from app.core.config import settings
from app.forensic.gemini_client import gemini_json

def analyze_text_stylometry(text: str) -> Tuple[Dict[str, Any], List[str]]:
    observations = []
    
    # Clean text
    clean_text = text.strip()
    words = re.findall(r'\b[a-zA-Z0-9_\'-]+\b', clean_text)
    sentences = [s.strip() for s in re.split(r'[.!?]+', clean_text) if s.strip()]
    
    word_count = len(words)
    sentence_count = max(len(sentences), 1)
    
    # 1. Lexical Diversity (Type-Token Ratio)
    unique_words = set(w.lower() for w in words)
    ttr = round(len(unique_words) / max(word_count, 1), 3)

    # 2. Burstiness / Sentence length variance
    sent_lengths = [len(re.findall(r'\b\w+\b', s)) for s in sentences]
    mean_length = float(np.mean(sent_lengths)) if sent_lengths else 0.0
    burstiness = float(np.std(sent_lengths)) if len(sent_lengths) > 1 else 0.0
    
    observations.append(f"Analyzed {word_count} words across {sentence_count} sentences (TTR: {ttr}).")
    observations.append(f"Sentence length mean: {mean_length:.1f} words, Burstiness σ: {burstiness:.2f}.")

    # LLM repetition pattern heuristic
    llm_transition_words = [
        "furthermore", "moreover", "in conclusion", "it is worth noting",
        "delve", "testament", "tapestry", "multifaceted", "paramount", "in summary"
    ]
    detected_markers = [m for m in llm_transition_words if m in clean_text.lower()]
    
    meta = {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "ttr": ttr,
        "burstiness": round(burstiness, 2),
        "mean_sent_length": round(mean_length, 1),
        "markers": detected_markers
    }

    return meta, observations

async def analyze_text_with_gemini(text: str, meta: Dict[str, Any]) -> Tuple[str, List[str], List[str], str, int]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return (
            "Not assessed",
            [],
            [],
            "AI-generated-text classifier was not run because GEMINI_API_KEY is unset. Stylometry below is a statistical description, not a synthetic-text probability.",
            0,
        )

    prompt = f"""
You are TruthLens Senior Disinformation Analyst and AI-Generated Text Forensics Specialist.
Examine this text passage for:
1. Probability of synthetic AI generation (LLM markers, robotic cadence, repetitive syntactic framing).
2. Misleading claims, ungrounded factual assertions, or manipulative disinformation tactics.
3. Logical inconsistencies or hallucination signatures.

TEXT PASSAGE:
\"\"\"{text[:4000]}\"\"\"

Return STRICTLY valid JSON:
{{
  "ai_generation_likelihood": "Low Likelihood" | "Moderate Likelihood" | "High Synthetic Probability",
  "stylometric_markers": ["marker 1", "marker 2"],
  "factuality_flags": ["flag 1", "flag 2"],
  "content_summary": "Objective breakdown of the text claims and narrative style",
  "severity": "informational" | "low" | "medium" | "suspicious",
  "score_impact": 0 to 30
}}
"""

    parsed, error, _model = await gemini_json([{"text": prompt}])
    if parsed:
        ai_lik = parsed.get("ai_generation_likelihood", "Not assessed")
        markers = parsed.get("stylometric_markers", []) or []
        flags = parsed.get("factuality_flags", []) or []
        summary = parsed.get("content_summary", "Text narrative evaluated by the language model.")
        impact = int(parsed.get("score_impact", 0) or 0)
        return ai_lik, markers, flags, summary, impact

    return (
        "Not assessed",
        [],
        [],
        f"AI-generated-text classifier did not return a usable result ({error}). No likelihood was assigned.",
        0,
    )

async def analyze_text_forensics(text_content: str, filename: str = "submitted_text.txt") -> Tuple[TextDiagnostics, AIVisualResult, List[EvidenceItem]]:
    evidence_items: List[EvidenceItem] = []
    suspicious_indicators: List[str] = []

    # 1. Stylometry
    meta, sty_obs = analyze_text_stylometry(text_content)

    # 2. Gemini Linguistic & Factuality Analysis
    ai_lik, markers, flags, summary, ai_impact = await analyze_text_with_gemini(text_content, meta)

    all_obs = sty_obs + ([f"Content Assessment: {summary}"] if summary else [])

    # Stylometric heuristic check (very low burstiness + low TTR is hallmark of LLM uniform generation)
    if meta["burstiness"] < 3.0 and meta["word_count"] > 80:
        suspicious_indicators.append(f"Extremely uniform sentence rhythm (Burstiness σ: {meta['burstiness']}).")
        evidence_items.append(EvidenceItem(
            id="TXT-BURST-01",
            title="Low Syntactic Burstiness (Uniform Sentence Lengths)",
            layer="Text Stylometry",
            severity="medium",
            confidence="Moderate Confidence",
            explanation=f"Text displays an abnormally low sentence length variation (σ = {meta['burstiness']:.2f}).",
            why_flagged="Human writing naturally mixes short clauses with long elaborations; language models optimize for predictable token lengths resulting in flat sentence cadence.",
            limitations="Formal academic writing or technical manuals can also exhibit deliberate sentence uniformity.",
            evidence_source="Linguistic Burstiness & Sentence Length Distribution",
            score_impact=14
        ))

    if ai_lik == "High Synthetic Probability":
        suspicious_indicators.append(f"AI text generation signatures identified: {ai_lik}")
        for m in markers[:3]:
            suspicious_indicators.append(f"Stylometric token marker: '{m}'")
        evidence_items.append(EvidenceItem(
            id="TXT-AI-01",
            title="Synthetic Large Language Model (LLM) Text Signatures",
            layer="Text Stylometry",
            severity="suspicious",
            confidence="Moderate Confidence",
            explanation="Linguistic reasoning identified characteristic neural language generation markers and formulaic transition framing.",
            why_flagged="Phrasing patterns strongly align with autoregressive language models (e.g. ChatGPT, Claude) rather than idiosyncratic human prose.",
            limitations="Humans frequently adopt corporate or templated idioms that mimic language model outputs.",
            evidence_source=f"Gemini Linguistic Stylometry ({settings.GEMINI_MODEL})",
            score_impact=max(ai_impact, 20)
        ))

    if flags:
        for f in flags:
            suspicious_indicators.append(f"Claim anomaly: {f}")
        evidence_items.append(EvidenceItem(
            id="TXT-CLAIM-01",
            title="Unsubstantiated or Manipulative Narrative Claims",
            layer="Text Stylometry",
            severity="medium",
            confidence="Moderate Confidence",
            explanation="; ".join(flags),
            why_flagged="Statements contain exaggerated framing, ungrounded causal leaps, or known disinformation tropes.",
            limitations="Factual verification requires independent primary source corroboration.",
            evidence_source=f"Gemini Factuality & Claim Decomposition ({settings.GEMINI_MODEL})",
            score_impact=16
        ))

    if not evidence_items:
        if ai_lik == "Not assessed":
            evidence_items.append(EvidenceItem(
                id="TXT-UNAVAILABLE-01",
                title="AI-Text Classifier Not Run",
                layer="Text Stylometry",
                severity="informational",
                confidence="Preliminary Observation",
                explanation=summary or "No synthetic-text classifier result is available.",
                why_flagged="A likelihood label was not produced. Statistical stylometry was recorded without converting it into a fake-or-real verdict.",
                limitations="Burstiness and type-token ratio describe writing style. They are not a validated detector of AI-generated text.",
                evidence_source="TruthLens text pipeline",
                score_impact=0
            ))
        else:
            evidence_items.append(EvidenceItem(
                id="TXT-PASS-01",
                title="No High-Likelihood Synthetic-Text Label Returned",
                layer="Text Stylometry",
                severity="informational",
                confidence="Moderate Confidence",
                explanation=f"The classifier label was '{ai_lik}'. Sentence burstiness is {meta['burstiness']} and type-token ratio is {meta['ttr']}.",
                why_flagged="The model did not return a high synthetic-text label. That is not proof the text was written by a person.",
                limitations="People edit model output, and models miss human-edited synthetic text.",
                evidence_source=f"Gemini linguistic review ({settings.GEMINI_MODEL})",
                score_impact=0
            ))

    text_diag = TextDiagnostics(
        word_count=meta["word_count"],
        sentence_count=meta["sentence_count"],
        lexical_diversity_ttr=meta["ttr"],
        burstiness_score=meta["burstiness"],
        ai_generation_likelihood=ai_lik,
        stylometric_markers=markers,
        factuality_flags=flags,
        observations=all_obs,
        suspicious_indicators=suspicious_indicators
    )

    ai_visual = AIVisualResult(
        scene_description=summary,
        detected_entities=["Text Narrative", "Core Claims"],
        visual_anomalies=flags,
        lighting_physics="Semantic and logical continuity across text clauses evaluated.",
        anatomical_or_structural_consistency="Syntactic grammar, sentence structure, and cohesion assessed.",
        generation_artifacts_observed=markers,
        confidence_rationale="Evaluated across lexical entropy and syntactic burstiness metrics.",
        ai_disclaimer="Text analysis evaluates stylometric markers and claims for synthetic and misleading patterns."
    )

    return text_diag, ai_visual, evidence_items
