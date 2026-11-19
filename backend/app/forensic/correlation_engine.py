"""Record why a cross-modal comparison was or was not made.

Low lexical overlap is never treated as proof of manipulation.
"""

import re
from typing import List, Optional

from app.models.schemas import CaptionComparisonResult, CorrelationRecord


def _tokens(text: str) -> set:
    return set(re.findall(r"[a-z0-9']{3,}", text.lower()))


def correlate_evidence(
    modality: str,
    caption: CaptionComparisonResult,
    text_body: Optional[str] = None,
    model_name: Optional[str] = None,
) -> List[CorrelationRecord]:
    records: List[CorrelationRecord] = []
    claim = (caption.caption_text or "").strip()
    source_model = model_name or "not run"

    if not claim:
        records.append(
            CorrelationRecord(
                id="CORR-CLAIM-MISSING",
                comparison_type=f"{modality}_versus_description",
                relation="missing",
                source="TruthLens correlation policy",
                rationale="No caption or claim was submitted, so no description comparison was generated.",
                evidence_refs=[],
            )
        )
    else:
        verdict = caption.consistency_verdict
        if verdict == "Mismatched / Contradictory":
            relation = "contradictory"
        elif verdict == "Consistent":
            relation = "matching"
        elif verdict in {"Partially Inconsistent", "No Caption Provided"}:
            relation = "inconclusive" if verdict != "No Caption Provided" else "missing"
        else:
            relation = "inconclusive"
        records.append(
            CorrelationRecord(
                id="CORR-CLAIM-01",
                comparison_type=f"{modality}_versus_description",
                relation=relation,
                source=f"Claim comparison ({source_model})",
                rationale=caption.explanation
                or "The claim comparison did not produce an explanation.",
                evidence_refs=["caption_comparison"],
                limitations=(
                    "A mismatch means the claim may not describe this evidence. "
                    "It is not, by itself, proof that the file was synthesized."
                ),
            )
        )

    if modality == "text" and text_body and claim:
        left = _tokens(text_body)
        right = _tokens(claim)
        if not left or not right:
            relation = "inconclusive"
            rationale = "There was not enough overlapping vocabulary to compare the text with the claim."
        else:
            overlap = len(left & right) / max(len(right), 1)
            relation = "inconclusive"
            rationale = (
                f"Lexical overlap with the claim is {overlap:.2f}. "
                "Overlap is a vocabulary check only. It does not establish contradiction or authenticity."
            )
        records.append(
            CorrelationRecord(
                id="CORR-TEXT-01",
                comparison_type="text_versus_text",
                relation=relation,
                source="Lexical overlap (not a semantic entailment model)",
                rationale=rationale,
                evidence_refs=["text_body", "caption"],
                limitations="Shared or missing words are not evidence of manipulation.",
            )
        )

    unsupported = []
    if modality == "video":
        unsupported.append(
            ("video_versus_transcript", "No speech-to-text transcript was produced for this video.")
        )
        unsupported.append(
            ("video_versus_audio", "The video soundtrack was not separated into its own evidence item.")
        )
    elif modality == "audio":
        unsupported.append(
            ("audio_versus_transcript", "No speech-to-text transcript was produced for this recording.")
        )
    elif modality == "image":
        unsupported.append(
            ("image_versus_video", "This investigation contains a single image, so no image-to-video comparison exists.")
        )

    for index, (comparison_type, rationale) in enumerate(unsupported, start=1):
        records.append(
            CorrelationRecord(
                id=f"CORR-UNSUP-{index}",
                comparison_type=comparison_type,
                relation="unsupported",
                source="TruthLens correlation policy",
                rationale=rationale,
                evidence_refs=[],
                limitations="Unsupported means the comparison was not run. It is not a finding about the evidence.",
            )
        )

    return records
