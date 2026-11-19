import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.models.schemas import FullAnalysisResponse
from app.core.config import settings

def generate_pdf_report(analysis: FullAnalysisResponse) -> str:
    """
    Generates a professional cybersecurity-grade Digital Forensic PDF Report
    using ReportLab.
    """
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    report_filename = f"TruthLens_Forensic_Report_{analysis.investigation_id[:8]}.pdf"
    output_path = os.path.join(settings.REPORTS_DIR, report_filename)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    brand_title_style = ParagraphStyle(
        "BrandTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a")
    )
    
    brand_sub_style = ParagraphStyle(
        "BrandSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#0284c7")
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=4
    )

    body_text = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )

    bold_label = ParagraphStyle(
        "BoldLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f172a")
    )

    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Italic"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b")
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("TRUTHLENS FORENSICS", brand_title_style))
    story.append(Paragraph("AI-Powered Multimodal Digital Forensics & Deepfake Detection | PS04", brand_sub_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=12))

    # 2. Case Details Table
    case_data = [
        [Paragraph("<b>Investigation ID:</b>", body_text), Paragraph(analysis.investigation_id, body_text)],
        [Paragraph("<b>Timestamp (UTC):</b>", body_text), Paragraph(analysis.created_at, body_text)],
        [Paragraph("<b>Target File Name:</b>", body_text), Paragraph(analysis.image_name, body_text)],
        [Paragraph("<b>SHA-256 Hash:</b>", body_text), Paragraph(f"<code>{analysis.image_hash}</code>", body_text)],
        [Paragraph("<b>Indicator Risk Score:</b>", body_text), Paragraph(f"<b>{analysis.indicator_score} / 100</b>", bold_label)],
        [Paragraph("<b>Core Assessment:</b>", body_text), Paragraph(f"<b>{analysis.assessment}</b>", bold_label)]
    ]

    case_table = Table(case_data, colWidths=[1.8 * inch, 5.0 * inch])
    case_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(case_table)
    story.append(Spacer(1, 10))

    # 3. Executive Summary
    story.append(Paragraph("Executive Findings Summary", section_heading))
    story.append(Paragraph(analysis.summary, body_text))
    story.append(Spacer(1, 10))

    # 4. Multi-Layer Technical Details
    story.append(Paragraph("Layer 1: File & Metadata Diagnostics", section_heading))
    meta = analysis.metadata
    meta_info = f"Dimensions: {meta.dimensions.get('width')}x{meta.dimensions.get('height')} | Format: {meta.format} | Size: {meta.file_size_human} | Has EXIF: {meta.has_exif}"
    if meta.camera_make or meta.camera_model:
        meta_info += f" | Camera: {meta.camera_make or ''} {meta.camera_model or ''}"
    if meta.software_signature:
        meta_info += f" | Software: {meta.software_signature}"
    story.append(Paragraph(meta_info, body_text))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Layer 2: Image Technical & Compression Diagnostics", section_heading))
    tech = analysis.technical
    tech_info = (
        f"Noise Variance: {tech.noise_variance} | Laplacian Sharpness: {tech.laplacian_variance_blur} | "
        f"ELA Mean Diff: {tech.ela_mean_difference} (Anomaly: {'Flagged' if tech.ela_anomaly_detected else 'None'})<br/>"
        f"Observation: {tech.compression_observation}"
    )
    story.append(Paragraph(tech_info, body_text))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Layer 3: Gemini Multimodal AI Reasoning", section_heading))
    ai = analysis.ai_analysis
    ai_info = (
        f"<b>Scene Analysis:</b> {ai.scene_description}<br/>"
        f"<b>Lighting Physics:</b> {ai.lighting_physics}<br/>"
        f"<b>Structural Geometry:</b> {ai.anatomical_or_structural_consistency}"
    )
    story.append(Paragraph(ai_info, body_text))
    story.append(Spacer(1, 8))

    if analysis.caption_comparison.caption_provided:
        story.append(Paragraph("Layer 4: Caption / Claim Cross-Verification", section_heading))
        cap = analysis.caption_comparison
        cap_info = (
            f"<b>Claim:</b> \"{cap.caption_text}\"<br/>"
            f"<b>Verdict:</b> {cap.consistency_verdict} (Semantic Match: {int(cap.semantic_match_score * 100)}%)<br/>"
            f"<b>Explanation:</b> {cap.explanation}"
        )
        story.append(Paragraph(cap_info, body_text))
        story.append(Spacer(1, 8))

    # 5. Evidence Scorecard Table
    story.append(Paragraph("Evidence Scorecard (Primary Forensic Traceability)", section_heading))
    
    scorecard_data = [
        [
            Paragraph("<b>Layer / Title</b>", bold_label),
            Paragraph("<b>Severity</b>", bold_label),
            Paragraph("<b>Confidence</b>", bold_label),
            Paragraph("<b>Why Flagged / Source</b>", bold_label)
        ]
    ]

    for item in analysis.evidence_scorecard:
        scorecard_data.append([
            Paragraph(f"<b>{item.title}</b><br/><i>{item.layer}</i>", body_text),
            Paragraph(item.severity.upper(), body_text),
            Paragraph(item.confidence, body_text),
            Paragraph(f"{item.why_flagged}<br/><font color='#64748b'>Source: {item.evidence_source}</font>", body_text)
        ])

    sc_table = Table(scorecard_data, colWidths=[2.2 * inch, 1.0 * inch, 1.4 * inch, 2.2 * inch])
    sc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(sc_table)
    story.append(Spacer(1, 14))

    # 6. Limitations & Human Verification Disclaimer
    story.append(Paragraph("Methodology Limitations & Legal Disclaimer", section_heading))
    limitations_text = "<br/>• ".join([""] + analysis.limitations)
    story.append(Paragraph(limitations_text, body_text))
    story.append(Spacer(1, 8))

    disclaimer_text = (
        "<b>LEGAL & JUDICIAL DISCLAIMER:</b> TruthLens is an automated diagnostic and decision-support system. "
        "The Suspicious Indicator Score is a heuristic synthesis of anomaly signals, NOT mathematical proof of fraud. "
        "All outputs require verification by a certified digital forensics analyst before presentation in legal proceedings."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    return output_path
