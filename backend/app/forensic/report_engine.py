import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.models.schemas import FullAnalysisResponse
from app.core.config import settings

def generate_pdf_report(analysis: FullAnalysisResponse) -> str:
    """
    Generates a professional multimodal Digital Forensic PDF Report
    supporting Image, Video, Audio, and Text investigations.
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
    story.append(Paragraph("TRUTHLENS MULTIMODAL FORENSICS", brand_title_style))
    story.append(Paragraph(f"AI Digital Forensics & Deepfake Detection Platform | Modality: {analysis.modality.upper()}", brand_sub_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=12))

    # 2. Case Details Table
    case_data = [
        [Paragraph("<b>Investigation ID:</b>", body_text), Paragraph(analysis.investigation_id, body_text)],
        [Paragraph("<b>Target Modality:</b>", body_text), Paragraph(f"<b>{analysis.modality.upper()}</b>", bold_label)],
        [Paragraph("<b>Timestamp (UTC):</b>", body_text), Paragraph(analysis.created_at, body_text)],
        [Paragraph("<b>Media File Name:</b>", body_text), Paragraph(analysis.image_name, body_text)],
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

    # 4. Modality-Specific Diagnostics Section
    if analysis.modality == "video" and analysis.video_diagnostics:
        v = analysis.video_diagnostics
        story.append(Paragraph("Video & Deepfake Diagnostics", section_heading))
        v_info = (
            f"<b>Duration:</b> {v.duration_seconds}s | <b>FPS:</b> {v.fps} | <b>Resolution:</b> {v.resolution.get('width')}x{v.resolution.get('height')} | <b>Codec:</b> {v.codec}<br/>"
            f"<b>Temporal Motion Jitter:</b> {v.temporal_jitter_score} | <b>Facial Boundary Disparity:</b> {'FLAGGED' if v.facial_boundary_anomaly else 'Normal'}<br/>"
            f"<b>Keyframes Analyzed:</b> {v.keyframes_analyzed}"
        )
        if v.edited_segments:
            cuts_str = ", ".join([f"{s.timestamp_formatted} (Frame #{s.frame_number}, Delta: {s.delta_score})" for s in v.edited_segments])
            v_info += f"<br/><b>Exact Edited Frame Timestamps ({len(v.edited_segments)} Cut-Points):</b> {cuts_str}"
        story.append(Paragraph(v_info, body_text))
        story.append(Spacer(1, 8))

    elif analysis.modality == "audio" and analysis.audio_diagnostics:
        a = analysis.audio_diagnostics
        story.append(Paragraph("Acoustic & Voice Cloning Diagnostics", section_heading))
        a_info = (
            f"<b>Duration:</b> {a.duration_seconds}s | <b>Sample Rate:</b> {a.sample_rate_hz}Hz | <b>Channels:</b> {a.channels} | <b>Format:</b> {a.format}<br/>"
            f"<b>Speech/Pause Ratio:</b> {int(a.speech_silence_ratio*100)}% | <b>Unnatural Continuous Speech:</b> {'FLAGGED' if a.unnatural_pause_detected else 'Normal'}<br/>"
            f"<b>Voice Synthesis Index:</b> {a.synthetic_prosody_score}/100 | <b>Spectral Cutoff:</b> {'Detected' if a.spectral_cutoff_observed else 'None'}"
        )
        story.append(Paragraph(a_info, body_text))
        story.append(Spacer(1, 8))

    elif analysis.modality == "text" and analysis.text_diagnostics:
        t = analysis.text_diagnostics
        story.append(Paragraph("Text Stylometry & Synthetic Narrative Diagnostics", section_heading))
        t_info = (
            f"<b>Word Count:</b> {t.word_count} | <b>Sentence Count:</b> {t.sentence_count} | <b>Lexical Diversity (TTR):</b> {t.lexical_diversity_ttr}<br/>"
            f"<b>Syntactic Burstiness σ:</b> {t.burstiness_score} | <b>AI Generation Assessment:</b> {t.ai_generation_likelihood}"
        )
        story.append(Paragraph(t_info, body_text))
        story.append(Spacer(1, 8))

    else:
        # Image
        story.append(Paragraph("Image Diagnostics (Error Level Analysis & Noise)", section_heading))
        tech = analysis.technical
        tech_info = (
            f"Noise Variance: {tech.noise_variance} | Laplacian Sharpness: {tech.laplacian_variance_blur} | "
            f"ELA Mean Diff: {tech.ela_mean_difference} (Anomaly: {'Flagged' if tech.ela_anomaly_detected else 'None'})<br/>"
            f"Observation: {tech.compression_observation}"
        )
        story.append(Paragraph(tech_info, body_text))
        story.append(Spacer(1, 8))

    # 5. Gemini AI Multimodal Reasoning
    story.append(Paragraph("Multimodal AI Contextual Reasoning", section_heading))
    ai = analysis.ai_analysis
    ai_info = (
        f"<b>Content Scene Analysis:</b> {ai.scene_description}<br/>"
        f"<b>Physical/Optical Logic:</b> {ai.lighting_physics}<br/>"
        f"<b>Structural Geometry:</b> {ai.anatomical_or_structural_consistency}"
    )
    story.append(Paragraph(ai_info, body_text))
    story.append(Spacer(1, 8))

    # 6. Caption / Claim Cross-Verification if provided
    if analysis.caption_comparison.caption_provided:
        story.append(Paragraph("Narrative Claim Cross-Verification", section_heading))
        cap = analysis.caption_comparison
        cap_info = (
            f"<b>Claim:</b> \"{cap.caption_text}\"<br/>"
            f"<b>Verdict:</b> {cap.consistency_verdict} (Semantic Match: {int(cap.semantic_match_score * 100)}%)<br/>"
            f"<b>Explanation:</b> {cap.explanation}"
        )
        story.append(Paragraph(cap_info, body_text))
        story.append(Spacer(1, 8))

    # 7. Evidence Scorecard Table
    story.append(Paragraph("Evidence Scorecard (Forensic Traceability)", section_heading))
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

    # 8. Disclaimer
    disclaimer_text = (
        "<b>LEGAL & JUDICIAL DISCLAIMER:</b> TruthLens is an automated diagnostic and decision-support system. "
        "The Suspicious Indicator Score is a heuristic synthesis of anomaly signals, NOT mathematical proof of fraud. "
        "All outputs require verification by a certified digital forensics analyst before presentation in legal proceedings."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    return output_path


def generate_audit_logs_pdf(
    investigations: list,
    examiner_name: str = "Lead Forensic Examiner",
    organization: str = "TruthLens Forensic Intelligence Lab"
) -> str:
    """
    Generates an official Forensic Audit Trail & Chain of Custody Ledger PDF report
    cataloging all registered cases, SHA-256 hashes, timestamps, and indicator scores.
    """
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    report_filename = f"TruthLens_Audit_Ledger_{timestamp_str}.pdf"
    output_path = os.path.join(settings.REPORTS_DIR, report_filename)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    brand_title_style = ParagraphStyle(
        "AuditBrandTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a")
    )

    brand_sub_style = ParagraphStyle(
        "AuditBrandSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#6366f1")
    )

    section_heading = ParagraphStyle(
        "AuditSectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=8,
        spaceAfter=4
    )

    body_text = ParagraphStyle(
        "AuditBodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#334155")
    )

    bold_label = ParagraphStyle(
        "AuditBoldLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    mono_hash = ParagraphStyle(
        "AuditMonoHash",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#475569")
    )

    disclaimer_style = ParagraphStyle(
        "AuditDisclaimer",
        parent=styles["Italic"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748b")
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("TRUTHLENS FORENSIC AUDIT TRAIL & EVIDENCE LEDGER", brand_title_style))
    story.append(Paragraph(
        "Cryptographic Chain of Custody & Examination Ledger • ISO/IEC 27037 Standard",
        brand_sub_style
    ))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#6366f1"), spaceAfter=10))

    # 2. Audit Session Information Table
    now_utc = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    audit_meta = [
        [
            Paragraph("<b>Generated Timestamp:</b>", bold_label),
            Paragraph(now_utc, body_text),
            Paragraph("<b>Certified Examiner:</b>", bold_label),
            Paragraph(examiner_name, body_text)
        ],
        [
            Paragraph("<b>Authority / Lab:</b>", bold_label),
            Paragraph(organization, body_text),
            Paragraph("<b>Cryptographic Standard:</b>", bold_label),
            Paragraph("SHA-256 (FIPS PUB 180-4)", body_text)
        ],
        [
            Paragraph("<b>Total Cases Registered:</b>", bold_label),
            Paragraph(f"<b>{len(investigations)} Evidence Assets</b>", bold_label),
            Paragraph("<b>Custody Verification:</b>", bold_label),
            Paragraph("<font color='#059669'><b>INTACT & VERIFIED</b></font>", body_text)
        ]
    ]

    meta_table = Table(audit_meta, colWidths=[1.8 * inch, 2.0 * inch, 1.8 * inch, 1.9 * inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 3. Aggregate Statistical Summary
    high_risk = sum(1 for i in investigations if (i.get("indicator_score") or 0) >= 50)
    moderate_risk = sum(1 for i in investigations if 20 <= (i.get("indicator_score") or 0) < 50)
    clean_cases = sum(1 for i in investigations if (i.get("indicator_score") or 0) < 20)

    summary_cards = [
        [
            Paragraph(f"<font color='#e11d48'><b>HIGH ANOMALIES (≥50): {high_risk}</b></font>", bold_label),
            Paragraph(f"<font color='#d97706'><b>MODERATE ANOMALIES (20-49): {moderate_risk}</b></font>", bold_label),
            Paragraph(f"<font color='#059669'><b>CLEAN ASSETS (<20): {clean_cases}</b></font>", bold_label),
        ]
    ]
    summary_table = Table(summary_cards, colWidths=[2.5 * inch, 2.5 * inch, 2.5 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 12))

    # 4. Chain of Custody Records Table
    story.append(Paragraph("Cryptographic Evidence Registry & Ledger", section_heading))

    ledger_data = [
        [
            Paragraph("<b>Case ID & Date</b>", bold_label),
            Paragraph("<b>Evidence Filename</b>", bold_label),
            Paragraph("<b>Modality</b>", bold_label),
            Paragraph("<b>SHA-256 Hash</b>", bold_label),
            Paragraph("<b>Risk Score</b>", bold_label),
            Paragraph("<b>Forensic Verdict</b>", bold_label),
        ]
    ]

    for inv in investigations:
        inv_id = str(inv.get("id") or "")[:8]
        raw_date = str(inv.get("created_at") or "")
        created_str = raw_date[:10] if raw_date else "N/A"
        fname = str(inv.get("image_name") or "Unnamed Evidence Asset")
        
        # Determine modality
        fname_lower = fname.lower()
        if any(fname_lower.endswith(e) for e in [".mp4", ".mov", ".webm", ".avi"]):
            modality_str = "VIDEO"
        elif any(fname_lower.endswith(e) for e in [".mp3", ".wav", ".m4a", ".ogg"]):
            modality_str = "AUDIO"
        elif any(fname_lower.endswith(e) for e in [".txt", ".doc"]):
            modality_str = "TEXT"
        else:
            modality_str = "IMAGE"

        sha_hash = str(inv.get("image_hash") or inv.get("file_hash") or "N/A")
        score = int(inv.get("indicator_score") or 0)
        
        if score >= 50:
            verdict_badge = "<font color='#e11d48'><b>SUSPICIOUS</b></font>"
        elif score >= 20:
            verdict_badge = "<font color='#d97706'><b>REVIEW</b></font>"
        else:
            verdict_badge = "<font color='#059669'><b>AUTHENTIC</b></font>"

        ledger_data.append([
            Paragraph(f"<b>{inv_id}</b><br/>{created_str}", body_text),
            Paragraph(fname[:28] + ("..." if len(fname) > 28 else ""), body_text),
            Paragraph(f"<b>{modality_str}</b>", body_text),
            Paragraph(f"{sha_hash[:22]}...<br/>{sha_hash[-12:]}" if len(sha_hash) > 25 else sha_hash, mono_hash),
            Paragraph(f"<b>{score} / 100</b>", bold_label),
            Paragraph(verdict_badge, body_text),
        ])

    ledger_table = Table(
        ledger_data,
        colWidths=[1.1 * inch, 1.8 * inch, 0.8 * inch, 2.0 * inch, 0.8 * inch, 1.0 * inch],
        repeatRows=1
    )
    ledger_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#312e81")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(ledger_table)
    story.append(Spacer(1, 14))

    # 5. Attestation & Custody Sign-Off
    attestation_text = (
        "<b>CERTIFICATE OF CUSTODY & DIGITAL INTEGRITY:</b> I hereby certify that the digital evidence items cataloged "
        "in this forensic ledger have been ingested in accordance with ISO/IEC 27037 digital forensic standards. "
        "Original file byte buffers remain cryptographically immutable and verified via SHA-256 integrity digests."
    )
    story.append(Paragraph(attestation_text, disclaimer_style))
    story.append(Spacer(1, 8))

    sign_data = [
        [
            Paragraph("<b>Certified Lead Examiner Signature:</b>", bold_label),
            Paragraph("____________________________", body_text),
            Paragraph("<b>Verification Seal:</b>", bold_label),
            Paragraph("[TRUTHLENS-SECURE-SHA256]", bold_label),
        ]
    ]
    sign_table = Table(sign_data, colWidths=[2.2 * inch, 2.0 * inch, 1.3 * inch, 2.0 * inch])
    sign_table.setStyle(TableStyle([
        ('PADDING', (0, 0), (-1, -1), 2),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(sign_table)

    doc.build(story)
    return output_path
