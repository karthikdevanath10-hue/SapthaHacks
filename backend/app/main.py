import logging
import os
import time
import uuid
import shutil
import asyncio
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.core.config import settings
from app.core.security import (
    enforce_rate_limit,
    is_uuid,
    safe_original_name,
    storage_filename,
    validate_file_contents,
)
from app.models.schemas import (
    FullAnalysisResponse, AnalyzerRun, EvidenceItem,
    VideoDiagnostics, AudioDiagnostics, TextDiagnostics,
    QualityGateResult, TechnicalResult, MetadataResult,
    AIVisualResult, CaptionComparisonResult, WebPresenceResult
)
from app.mcp import mcp_client, mcp_server
from app.forensic.quality_gate import (
    assess_image_quality, assess_audio_quality,
    assess_video_quality, assess_text_quality
)
from app.forensic.metadata_engine import extract_metadata
from app.forensic.technical_engine import analyze_technical_properties
from app.forensic.gemini_engine import analyze_with_gemini
from app.forensic.video_engine import analyze_video_forensics
from app.forensic.audio_engine import analyze_audio_forensics
from app.forensic.text_engine import analyze_text_forensics
from app.forensic.cross_verification import (
    cross_verify_caption_and_image,
    cross_verify_generic_modality_claim
)
from app.forensic.scorecard_engine import synthesize_evidence_scorecard
from app.forensic.report_engine import generate_pdf_report
from app.forensic.explanation_engine import explain_findings
from app.forensic.correlation_engine import correlate_evidence
from app.services.supabase_service import supabase_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("truthlens.api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TruthLens - AI-Powered Multimodal Digital Forensics & Deepfake Detection Engine"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=getattr(settings, "CORS_ORIGIN_REGEX", r"^https:\/\/.*\.vercel\.app$"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def unhandled_exception(_request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    logger.exception("Unhandled API error")
    return JSONResponse(
        status_code=500,
        content={"detail": "The analysis request failed. No result was fabricated."},
    )


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "modalities": ["image", "video", "audio", "text"],
        "supabase_connected": supabase_service.is_connected(),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "gemini_model": settings.GEMINI_MODEL,
        "mcp_server_online": True,
        "mcp_tools": [t["name"] for t in mcp_server.list_tools()],
        "models_loaded_at_startup": [],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Model Context Protocol (MCP) Server Endpoints
@app.get("/api/mcp/status")
async def mcp_status():
    return {
        "status": "online",
        "server_name": mcp_server.server_name,
        "version": mcp_server.version,
        "mcp_search_key_configured": bool(settings.MCP_SEARCH_API_KEY),
        "tools": mcp_server.list_tools()
    }

@app.post("/api/mcp/tools/list")
async def mcp_list_tools():
    return {"tools": mcp_server.list_tools()}

@app.post("/api/mcp/tools/call")
async def mcp_call_tool(payload: dict):
    tool_name = payload.get("name", "")
    arguments = payload.get("arguments", {})
    try:
        result = await mcp_server.call_tool(tool_name, arguments)
        return {"content": [{"type": "text", "text": str(result)}], "result": result, "isError": False}
    except Exception as e:
        return {"content": [{"type": "text", "text": str(e)}], "isError": True}

@app.post("/api/mcp/search")
async def mcp_direct_search(payload: dict):
    query = payload.get("query", "")
    modality = payload.get("modality", "image")
    web_res, _ = await mcp_client.search_media_presence(
        modality=modality,
        custom_query=query
    )
    return web_res

def detect_modality(filename: str, override: Optional[str] = None) -> str:
    if override and override.lower() in ["image", "video", "audio", "text"]:
        return override.lower()
    ext = os.path.splitext(filename)[1].lower()
    if ext in [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".jfif", ".jfi", ".bmp"]:
        return "image"
    elif ext in [".mp4", ".mov", ".webm", ".avi", ".mkv"]:
        return "video"
    elif ext in [".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac", ".weba"]:
        return "audio"
    elif ext in [".txt"]:
        return "text"
    return "image"

def _run(name: str, model: str, version: str, status: str, findings: int, score_type: str,
         score_value, note: str, limitations: List[str], started: float, errors: List[str], evidence_id: str) -> AnalyzerRun:
    return AnalyzerRun(
        evidence_id=evidence_id,
        analyzer_name=name,
        model_name=model,
        model_version=version,
        status=status,
        findings_count=findings,
        score_type=score_type,
        score_value=score_value,
        confidence_note=note,
        limitations=limitations,
        duration_ms=int((time.perf_counter() - started) * 1000),
        errors=errors,
    )


@app.post("/api/analyze", response_model=FullAnalysisResponse)
async def analyze_multimodal_media(
    request: Request,
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    source_context: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    modality: Optional[str] = Form(None)
):
    enforce_rate_limit(request, settings.RATE_LIMIT_ANALYZE, settings.RATE_LIMIT_WINDOW_SECONDS)
    investigation_id = str(uuid.uuid4())
    trusted_user = user_id if is_uuid(user_id) else None
    all_evidence: List[EvidenceItem] = []
    analyzer_runs: List[AnalyzerRun] = []
    processing_notes: List[str] = [
        "Original bytes are stored under a random name and are not overwritten by later processing.",
        "Indicator scores are heuristic weights. They are not a probability that the evidence is fake.",
    ]

    video_diag: Optional[VideoDiagnostics] = None
    audio_diag: Optional[AudioDiagnostics] = None
    text_diag: Optional[TextDiagnostics] = None
    technical_res: TechnicalResult = TechnicalResult()
    quality_gate_res: Optional[QualityGateResult] = None

    # Determine Modality & save file or text payload
    if text_content and (not file or file.filename == ""):
        # Direct text input modality
        modality = "text"
        filename = safe_original_name("statement.txt")
        filepath = os.path.join(settings.UPLOAD_DIR, storage_filename(".txt"))
        with open(filepath, "w", encoding="utf-8") as handle:
            handle.write(text_content)
    elif file and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format '{ext}'. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        modality = detect_modality(file.filename, override=modality)
        filename = safe_original_name(file.filename)
        filepath = os.path.join(settings.UPLOAD_DIR, storage_filename(ext))

        with open(filepath, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                buffer.write(chunk)

        file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
        if file_size_mb > settings.MAX_FILE_SIZE_MB:
            os.remove(filepath)
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_MB}MB"
            )
        content_error = validate_file_contents(filepath, ext)
        if content_error:
            os.remove(filepath)
            raise HTTPException(status_code=400, detail=content_error)
    else:
        raise HTTPException(status_code=400, detail="Please upload a media file or provide text content.")

    # 1. Base Metadata & SHA-256 Extraction (Instant local hash)
    metadata_res, meta_evidence = extract_metadata(filepath, file.filename if file else filename)
    all_evidence.extend(meta_evidence)

    # 2. Modality-Specific Diagnostic Execution with Parallel Optimization
    if modality == "video":
        video_diag, ai_res, vid_evidence = await analyze_video_forensics(filepath, filename)
        all_evidence.extend(vid_evidence)
        if video_diag:
            quality_gate_res, qual_ev = assess_video_quality(
                video_diag.duration_seconds, video_diag.frame_count,
                video_diag.resolution.get("width", 0), video_diag.resolution.get("height", 0)
            )
            if qual_ev:
                all_evidence.append(qual_ev)
        caption_res, cap_evidence = await cross_verify_generic_modality_claim(
            modality, caption, source_context, ai_res
        )
        all_evidence.extend(cap_evidence)

    elif modality == "audio":
        audio_diag, ai_res, aud_evidence = await analyze_audio_forensics(filepath, filename)
        all_evidence.extend(aud_evidence)
        if audio_diag:
            quality_gate_res, qual_ev = assess_audio_quality(
                audio_diag.duration_seconds, audio_diag.sample_rate_hz
            )
            if qual_ev:
                all_evidence.append(qual_ev)
        caption_res, cap_evidence = await cross_verify_generic_modality_claim(
            modality, caption, source_context, ai_res
        )
        all_evidence.extend(cap_evidence)

    elif modality == "text":
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content_to_check = f.read()
        text_diag, ai_res, txt_evidence = await analyze_text_forensics(content_to_check, filename)
        all_evidence.extend(txt_evidence)
        if text_diag:
            quality_gate_res, qual_ev = assess_text_quality(text_diag.word_count)
            if qual_ev:
                all_evidence.append(qual_ev)
        caption_res, cap_evidence = await cross_verify_generic_modality_claim(
            modality, caption, source_context, ai_res
        )
        all_evidence.extend(cap_evidence)

    else:
        # Standard Image: Run local CV & Quality checks instantly
        technical_res, tech_evidence = analyze_technical_properties(filepath)
        all_evidence.extend(tech_evidence)
        quality_gate_res, qual_ev = assess_image_quality(filepath)
        if qual_ev:
            all_evidence.append(qual_ev)

        # Execute Gemini Vision & Cross-Verification concurrently
        tasks = [analyze_with_gemini(filepath)]
        if caption and caption.strip():
            tasks.append(cross_verify_caption_and_image(
                filepath, caption, source_context, AIVisualResult(scene_description="Parallel inspection")
            ))

        ai_outcomes = await asyncio.gather(*tasks)
        ai_res, ai_evidence = ai_outcomes[0]
        all_evidence.extend(ai_evidence)

        if len(ai_outcomes) > 1:
            caption_res, cap_evidence = ai_outcomes[1]
            all_evidence.extend(cap_evidence)
        else:
            caption_res = CaptionComparisonResult(
                caption_provided=False,
                caption_text=None,
                source_context=source_context,
                consistency_verdict="No Caption Provided",
                discrepancy_details=[],
                semantic_match_score=1.0,
                explanation="Direct image analysis executed."
            )

    # 2.5 Model Context Protocol (MCP) Web & Social Media Discovery
    web_presence_res, mcp_evidence = await mcp_client.search_media_presence(
        modality=modality,
        visual_description=ai_res.scene_description if ai_res else "",
        detected_entities=ai_res.detected_entities if ai_res else [],
        caption=caption,
        source_context=source_context
    )
    if mcp_evidence:
        all_evidence.append(mcp_evidence)

    # 3. Multi-Layer Evidence Scorecard & Final Assessment Aggregation
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
        web_presence=web_presence_res,
        video_diagnostics=video_diag,
        audio_diagnostics=audio_diag,
        text_diagnostics=text_diag,
        quality_gate=quality_gate_res,
        evidence_scorecard=scorecard,
        limitations=limitations,
        recommendations=recommendations,
        report_download_url=report_url,
        created_at=created_at
    )

    # 4. Asynchronous Background Tasks (Zero latency blocking)
    background_tasks.add_task(generate_pdf_report, full_response)
    background_tasks.add_task(supabase_service.save_investigation, full_response.dict(), user_id)

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

@app.get("/api/storage/stats")
async def get_storage_stats():
    def get_dir_info(dir_path: str):
        total_size = 0
        files = []
        if os.path.exists(dir_path):
            for entry in os.scandir(dir_path):
                if entry.is_file() and not entry.name.startswith("."):
                    stat = entry.stat()
                    total_size += stat.st_size
                    files.append({
                        "filename": entry.name,
                        "size_bytes": stat.st_size,
                        "created_at": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat()
                    })
        return total_size, files

    uploads_size, upload_files = get_dir_info(settings.UPLOAD_DIR)
    reports_size, report_files = get_dir_info(settings.REPORTS_DIR)

    all_files = []
    for f in upload_files:
        ext = f["filename"].split(".")[-1].lower() if "." in f["filename"] else ""
        cat = "video" if ext in ["mp4", "mov", "webm", "avi"] else ("audio" if ext in ["mp3", "wav", "m4a", "ogg"] else ("text" if ext in ["txt"] else "image"))
        all_files.append({**f, "category": cat, "type": "upload"})
    for f in report_files:
        all_files.append({**f, "category": "pdf_report", "type": "report"})

    all_files.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return {
        "total_size_bytes": uploads_size + reports_size,
        "total_files_count": len(all_files),
        "uploads_size_bytes": uploads_size,
        "uploads_count": len(upload_files),
        "reports_size_bytes": reports_size,
        "reports_count": len(report_files),
        "supabase_connected": supabase_service.is_connected(),
        "files": all_files[:50]
    }
