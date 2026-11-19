from typing import List, Dict, Any, Tuple
from app.models.schemas import (
    EvidenceItem, MetadataResult, TechnicalResult, AIVisualResult, CaptionComparisonResult
)

ASSESSMENT_CATEGORIES = [
    "No significant suspicious indicators detected",
    "Some indicators require further investigation",
    "Multiple suspicious indicators detected",
    "Insufficient evidence for assessment"
]

def synthesize_evidence_scorecard(
    metadata: MetadataResult,
    technical: TechnicalResult,
    ai_visual: AIVisualResult,
    caption: CaptionComparisonResult,
    collected_evidence: List[EvidenceItem]
) -> Tuple[str, int, str, List[EvidenceItem], List[str], List[str]]:
    """
    Synthesizes all multi-layer evidence into the Evidence Scorecard,
    calculating an aggregated Suspicious Indicator Score (0-100) and
    selecting the appropriate final forensic assessment category.
    """
    
    # Calculate Indicator Score (Weighted summation of evidence impact, bounded 0-100)
    raw_impact = sum(item.score_impact for item in collected_evidence)
    indicator_score = min(max(raw_impact, 0), 100)

    # Determine Assessment Category
    suspicious_count = sum(1 for item in collected_evidence if item.severity in ["suspicious", "high"])
    medium_count = sum(1 for item in collected_evidence if item.severity == "medium")
    
    if indicator_score >= 50 or suspicious_count >= 2:
        assessment = "Multiple suspicious indicators detected"
        summary = (
            f"Multi-layer analysis revealed multiple corroborating anomalies (Indicator Score: {indicator_score}/100) "
            "across metadata signatures, spatial noise consistency, or multimodal visual coherence. "
            "Formal human forensic review is strongly advised before authenticating this media."
        )
    elif indicator_score >= 20 or medium_count >= 1 or suspicious_count == 1:
        assessment = "Some indicators require further investigation"
        summary = (
            f"Analysis recorded localized or contextual flags (Indicator Score: {indicator_score}/100). "
            "While indicators suggest editing, resaving, or descriptive discrepancy, they do not conclusively "
            "determine whether the image is synthetic or authentic."
        )
    elif metadata.color_mode not in {"Audio Track", "UTF-8 Text Stream"} and metadata.dimensions.get("width", 0) == 0:
        assessment = "Insufficient evidence for assessment"
        summary = "File structure was corrupted or truncated, preventing comprehensive multi-layer extraction."
    else:
        assessment = "No significant suspicious indicators detected"
        summary = (
            f"Standard forensic inspection detected no prominent synthetic artifacts or severe compression anomalies "
            f"(Indicator Score: {indicator_score}/100). NOTE: Clean signals do not constitute definitive proof of physical authenticity."
        )

    # Limitations explicitly documented
    limitations = [
        "Indicator score represents a cumulative heuristic index of flagged anomalies, NOT a mathematical probability of synthetic origin.",
        "Absence of suspicious metadata or noise anomalies can occur in pristine AI generations or unedited camera captures alike.",
        "Social media platforms commonly transcode and strip original camera EXIF parameters, creating benign metadata absence.",
        "Generative AI models rapidly evolve, with diffusion and autoregressive architectures minimizing visible visual glitches.",
        "Final attribution requires chain-of-custody verification and human analyst corroboration."
    ]

    # Recommendations
    recommendations = [
        "Verify original provenance or raw source file (C2PA/CR credentials if present).",
        "Cross-reference original photographer or verified news wire publication if claiming news event status.",
        "Perform reverse image search (e.g. Google Lens, TinEye) to trace first known publication timestamp."
    ]

    return assessment, indicator_score, summary, collected_evidence, limitations, recommendations
