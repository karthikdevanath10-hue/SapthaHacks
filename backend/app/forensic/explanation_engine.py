"""Turn existing evidence items into investigator-facing explanations.

This module does not add findings, scores, or locations that the analyzers
did not already record.
"""

from typing import List

from app.models.schemas import EvidenceItem, FindingExplanation

_NEXT_STEPS = {
    "Metadata Analysis": "Compare the original publisher file and any available C2PA or camera original.",
    "Technical Forensics": "Repeat error-level and noise checks on a less compressed copy of the same file.",
    "AI Visual Verification": "Have a reviewer inspect the cited visual region. This is a vision-model observation, not a calibrated fake probability.",
    "Temporal Video Forensics": "Review the sampled timestamps and the original capture if a higher-bitrate copy exists.",
    "Audio Acoustic Forensics": "Listen to the cited segment and compare it with a known recording of the speaker.",
    "Text Stylometry": "Compare the passage with a known writing sample. Stylometry is not proof of authorship.",
    "Caption Cross-Verification": "Check whether the claim and the media were published together or reused out of context.",
}


def explain_findings(items: List[EvidenceItem]) -> List[FindingExplanation]:
    explanations: List[FindingExplanation] = []
    for item in items:
        explanations.append(
            FindingExplanation(
                evidence_id=item.id,
                observed=item.explanation,
                supporting_evidence=item.why_flagged,
                produced_by=item.evidence_source,
                location=item.layer,
                uncertainty=item.confidence,
                alternatives=item.limitations,
                next_step=_NEXT_STEPS.get(
                    item.layer,
                    "Review the cited source and do not treat the indicator score as a probability that the evidence is fake.",
                ),
                severity=item.severity,
                score_impact=item.score_impact,
            )
        )
    return explanations
