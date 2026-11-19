import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.models.schemas import (
    FullAnalysisResponse, MetadataResult, TechnicalResult,
    AIVisualResult, CaptionComparisonResult, EvidenceItem,
    VideoDiagnostics, AudioDiagnostics, TextDiagnostics
)
from app.forensic.metadata_engine import extract_metadata
from app.forensic.technical_engine import analyze_technical_properties
from app.forensic.gemini_engine import analyze_with_gemini
from app.forensic.video_engine import analyze_video_forensics
from app.forensic.audio_engine import analyze_audio_forensics
from app.forensic.text_engine import analyze_text_forensics
from app.forensic.cross_verification import cross_verify_caption_and_image
from app.forensic.scorecard_engine import synthesize_evidence_scorecard
from app.forensic.report_engine import generate_pdf_report
from app.services.supabase_service import supabase_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TruthLens - AI-Powered Multimodal Digital Forensics & Deepfake Detection Engine"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folders for media and generated reports
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/static/reports", StaticFiles(directory=settings.REPORTS_DIR), name="reports")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "modalities": ["image", "video", "audio", "text"],
        "supabase_connected": supabase_service.is_connected(),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def detect_modality(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext in [".jpg", ".jpeg", ".png", ".webp", ".tiff"]:
        return "image"
    elif ext in [".mp4", ".mov", ".webm", ".avi", ".mkv"]:
        return "video"
    elif ext in [".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac"]:
        return "audio"
    elif ext in [".txt"]:
        return "text"
    return "image"

@app.post("/api/analyze", response_model=FullAnalysisResponse)
async def analyze_multimodal_media(
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    source_context: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None)
):
    investigation_id = str(uuid.uuid4())
    all_evidence: List[EvidenceItem] = []

    video_diag: Optional[VideoDiagnostics] = None
    audio_diag: Optional[AudioDiagnostics] = None
    text_diag: Optional[TextDiagnostics] = None
    technical_res: TechnicalResult = TechnicalResult()

    # Determine Modality & save file or text payload
    if text_content and (not file or file.filename == ""):
        # Direct text input modality
        modality = "text"
        filename = f"text_statement_{investigation_id[:8]}.txt"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(text_content)
    elif file:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format '{ext}'. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        modality = detect_modality(file.filename)
        filename = f"{investigation_id[:8]}_{file.filename.replace(' ', '_')}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # File size check
        file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
        if file_size_mb > settings.MAX_FILE_SIZE_MB:
            os.remove(filepath)
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_MB}MB"
            )
    else:
        raise HTTPException(status_code=400, detail="Please upload a media file or provide text content.")

    # 1. Base Metadata & SHA-256 Extraction
    metadata_res, meta_evidence = extract_metadata(filepath, file.filename if file else filename)
    all_evidence.extend(meta_evidence)

    # 2. Modality-Specific Diagnostic Execution
    if modality == "video":
        video_diag, ai_res, vid_evidence = await analyze_video_forensics(filepath, filename)
        all_evidence.extend(vid_evidence)
    elif modality == "audio":
        audio_diag, ai_res, aud_evidence = await analyze_audio_forensics(filepath, filename)
        all_evidence.extend(aud_evidence)
    elif modality == "text":
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content_to_check = f.read()
        text_diag, ai_res, txt_evidence = await analyze_text_forensics(content_to_check, filename)
        all_evidence.extend(txt_evidence)
    else:
        # Standard Image
        technical_res, tech_evidence = analyze_technical_properties(filepath)
        all_evidence.extend(tech_evidence)
        ai_res, ai_evidence = await analyze_with_gemini(filepath)
        all_evidence.extend(ai_evidence)

    # 3. Caption / Claim Cross-Verification (if applicable)
    if modality == "image":
        caption_res, cap_evidence = await cross_verify_caption_and_image(
            filepath, caption, source_context, ai_res
        )
        all_evidence.extend(cap_evidence)
    else:
        # Clean response for other modalities
        caption_res = CaptionComparisonResult(
            caption_provided=bool(caption and caption.strip()),
            caption_text=caption,
            source_context=source_context,
            consistency_verdict="Consistent" if caption else "No Caption Provided",
            discrepancy_details=[],
            semantic_match_score=1.0,
            explanation=f"Modality '{modality.upper()}' investigated directly against contextual claim." if caption else "Direct media analysis."
        )

    # 4. Multi-Layer Evidence Scorecard & Final Assessment Aggregation
    assessment, indicator_score, summary, scorecard, limitations, recommendations = synthesize_evidence_scorecard(
        metadata=metadata_res,
        technical=technical_res,
        ai_visual=ai_res,
        caption=caption_res,
        collected_evidence=all_evidence
    )

    created_at = datetime.now(timezone.utc).isoformat()
    report_url = f"/api/reports/{investigation_id}/download"

    full_response = FullAnalysisResponse(
        investigation_id=investigation_id,
        modality=modality,
        image_name=file.filename if file else filename,
        image_hash=metadata_res.sha256_hash,
        assessment=assessment,
        indicator_score=indicator_score,
        summary=summary,
        metadata=metadata_res,
        technical=technical_res,
        ai_analysis=ai_res,
        caption_comparison=caption_res,
        video_diagnostics=video_diag,
        audio_diagnostics=audio_diag,
        text_diagnostics=text_diag,
        evidence_scorecard=scorecard,
        limitations=limitations,
        recommendations=recommendations,
        report_download_url=report_url,
        created_at=created_at
    )

    # 5. Generate Cryptographic PDF Dossier
    try:
        generate_pdf_report(full_response)
    except Exception as e:
        print(f"[PDF Report] Generation notice: {e}")

    # 6. Save to Supabase (with local store fallback)
    await supabase_service.save_investigation(full_response.dict(), user_id=user_id)

    return full_response

@app.get("/api/investigations")
async def list_investigations(user_id: Optional[str] = None):
    records = await supabase_service.list_investigations(user_id=user_id)
    return {"investigations": records}

@app.get("/api/investigations/{investigation_id}")
async def get_investigation(investigation_id: str):
    details = await supabase_service.get_investigation_details(investigation_id)
    if not details:
        raise HTTPException(status_code=404, detail="Investigation record not found")
    return details

@app.delete("/api/investigations/{investigation_id}")
async def delete_investigation(investigation_id: str, user_id: Optional[str] = None):
    success = await supabase_service.delete_investigation(investigation_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Investigation record not found or could not be deleted")
    return {"status": "deleted", "investigation_id": investigation_id}

@app.get("/api/reports/{investigation_id}/download")
async def download_report(investigation_id: str):
    report_filename = f"TruthLens_Forensic_Report_{investigation_id[:8]}.pdf"
    filepath = os.path.join(settings.REPORTS_DIR, report_filename)
    if not os.path.exists(filepath):
        details = await supabase_service.get_investigation_details(investigation_id)
        if details:
            try:
                full_resp = FullAnalysisResponse(**details)
                generate_pdf_report(full_resp)
            except Exception as e:
                raise HTTPException(status_code=404, detail=f"PDF report not found: {e}")
        else:
            raise HTTPException(status_code=404, detail="PDF report not found on server")

    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=report_filename
    )
