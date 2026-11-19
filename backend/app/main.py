import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.core.config import settings
from app.models.schemas import (
    FullAnalysisResponse, MetadataResult, TechnicalResult,
    AIVisualResult, CaptionComparisonResult, EvidenceItem
)
from app.forensic.metadata_engine import extract_metadata
from app.forensic.technical_engine import analyze_technical_properties
from app.forensic.gemini_engine import analyze_with_gemini
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

# Mount static folders for images and generated reports
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/static/reports", StaticFiles(directory=settings.REPORTS_DIR), name="reports")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "supabase_connected": supabase_service.is_connected(),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/analyze", response_model=FullAnalysisResponse)
async def analyze_media(
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    source_context: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None)
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Save to disk
    investigation_id = str(uuid.uuid4())
    safe_filename = f"{investigation_id[:8]}_{file.filename.replace(' ', '_')}"
    filepath = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Validate file size
    file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
    if file_size_mb > settings.MAX_FILE_SIZE_MB:
        os.remove(filepath)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_MB}MB"
        )

    all_evidence: List[EvidenceItem] = []

    # 1. Layer 1: Metadata Engine
    metadata_res, meta_evidence = extract_metadata(filepath, file.filename)
    all_evidence.extend(meta_evidence)

    # 2. Layer 2: Technical Engine
    technical_res, tech_evidence = analyze_technical_properties(filepath)
    all_evidence.extend(tech_evidence)

    # 3. Layer 3: Gemini Multimodal AI Engine
    ai_res, ai_evidence = await analyze_with_gemini(filepath)
    all_evidence.extend(ai_evidence)

    # 4. Layer 4: Image and Caption Cross-Verification
    caption_res, cap_evidence = await cross_verify_caption_and_image(
        filepath, caption, source_context, ai_res
    )
    all_evidence.extend(cap_evidence)

    # 5. Layer 5: Evidence Scorecard & Assessment Aggregation
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
        image_name=file.filename,
        image_hash=metadata_res.sha256_hash,
        assessment=assessment,
        indicator_score=indicator_score,
        summary=summary,
        metadata=metadata_res,
        technical=technical_res,
        ai_analysis=ai_res,
        caption_comparison=caption_res,
        evidence_scorecard=scorecard,
        limitations=limitations,
        recommendations=recommendations,
        report_download_url=report_url,
        created_at=created_at
    )

    # 6. Generate Forensic PDF Report
    try:
        generate_pdf_report(full_response)
    except Exception as e:
        print(f"[PDF Report] Generation warning: {e}")

    # 7. Persist to Supabase / Local Store
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
        # Regenerate if details exist
        details = await supabase_service.get_investigation_details(investigation_id)
        if details:
            try:
                full_resp = FullAnalysisResponse(**details)
                generate_pdf_report(full_resp)
            except Exception as e:
                raise HTTPException(status_code=404, detail=f"PDF report not found and regeneration failed: {e}")
        else:
            raise HTTPException(status_code=404, detail="PDF report not found on server")

    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=report_filename
    )
