import os
import hashlib
from typing import Dict, Any, List, Tuple
from PIL import Image, ExifTags
from app.models.schemas import MetadataResult, EvidenceItem

AI_SOFTWARE_SIGNATURES = [
    "stable diffusion", "midjourney", "dall-e", "comfyui", "automatic1111",
    "novelai", "adobe firefly", "bing image creator", "flux.1", "leonardo.ai",
    "elevenlabs", "sora", "runway", "pika", "luma", "kling"
]

PHOTO_EDITING_SIGNATURES = [
    "photoshop", "lightroom", "gimp", "canva", "snapseed", "picsart", "affinity",
    "premiere", "after effects", "capcut", "davinci resolve", "audacity"
]

def format_file_size(size_in_bytes: int) -> str:
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024 * 1024:
        return f"{size_in_bytes / 1024:.1f} KB"
    else:
        return f"{size_in_bytes / (1024 * 1024):.2f} MB"

def calculate_sha256(filepath: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def extract_metadata(filepath: str, original_filename: str) -> Tuple[MetadataResult, List[EvidenceItem]]:
    file_size = os.path.getsize(filepath)
    file_hash = calculate_sha256(filepath)
    ext = os.path.splitext(filepath)[1].lower()
    
    evidence_items: List[EvidenceItem] = []
    observations: List[str] = []
    suspicious_indicators: List[str] = []

    camera_make = None
    camera_model = None
    software_signature = None
    creation_datetime = None
    gps_info = None
    raw_exif_tags = {}
    has_exif = False

    width, height = (0, 0)
    color_mode = "N/A"
    img_format = ext.strip(".").upper()

    # 1. Images
    if ext in [".jpg", ".jpeg", ".png", ".webp", ".tiff"]:
        try:
            with Image.open(filepath) as img:
                width, height = img.size
                img_format = img.format or ext.strip(".").upper()
                color_mode = img.mode

                exif_data = img.getexif()
                if exif_data and len(exif_data) > 0:
                    has_exif = True
                    for tag_id, value in exif_data.items():
                        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                        if isinstance(value, bytes):
                            try:
                                value = value.decode("utf-8", errors="ignore").strip("\x00")
                            except Exception:
                                value = str(value)
                        elif not isinstance(value, (int, float, str, bool, list, dict)):
                            value = str(value)
                        raw_exif_tags[tag_name] = value

                    camera_make = raw_exif_tags.get("Make")
                    camera_model = raw_exif_tags.get("Model")
                    software_signature = raw_exif_tags.get("Software")
                    creation_datetime = raw_exif_tags.get("DateTime") or raw_exif_tags.get("DateTimeOriginal")

                    if "GPSInfo" in raw_exif_tags:
                        gps_info = {"present": True, "raw": str(raw_exif_tags["GPSInfo"])}

                # Also check info dictionary for PNG text chunks (often contains AI prompts)
                png_info = getattr(img, "info", {})
                for k, v in png_info.items():
                    k_lower = str(k).lower()
                    v_lower = str(v).lower()
                    if any(ai_sig in k_lower or ai_sig in v_lower for ai_sig in AI_SOFTWARE_SIGNATURES):
                        software_signature = f"{k}: {str(v)[:80]}"
                        break
        except Exception as e:
            observations.append(f"Image header parsing notice: {str(e)}")

    # 2. Videos
    elif ext in [".mp4", ".mov", ".webm", ".avi", ".mkv"]:
        try:
            import cv2
            cap = cv2.VideoCapture(filepath)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            color_mode = "YUV/RGB Video Stream"
            observations.append(f"Video container verified: {width}x{height} resolution.")
        except Exception:
            pass

    # 3. Audio
    elif ext in [".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac"]:
        color_mode = "Audio Track"
        observations.append("Audio stream container extracted.")

    # 4. Text
    elif ext in [".txt"]:
        color_mode = "UTF-8 Text Stream"
        observations.append("Plaintext document ingested.")

    dimensions = {
        "width": width,
        "height": height,
        "aspect_ratio": f"{width}:{height}" if height > 0 else "N/A"
    }

    # Software signature checking
    detected_ai_sig = None
    if software_signature:
        for sig in AI_SOFTWARE_SIGNATURES:
            if sig in software_signature.lower():
                detected_ai_sig = software_signature
                break
    
    if detected_ai_sig:
        suspicious_indicators.append(f"AI synthesis software metadata identified: {detected_ai_sig}")
        evidence_items.append(EvidenceItem(
            id="META-01",
            title="AI Synthesis Software Traces in Metadata",
            layer="Metadata Analysis",
            severity="suspicious",
            confidence="High Confidence",
            explanation=f"File headers explicitly reference synthetic generative pipeline: '{detected_ai_sig}'.",
            why_flagged="Known generative AI tools frequently serialize generation parameters into media headers.",
            limitations="Metadata can be forged or manually injected, but its direct presence strongly correlates with synthetic provenance.",
            evidence_source="File Header / Container Tag Inspection",
            score_impact=25
        ))
    elif software_signature:
        for sig in PHOTO_EDITING_SIGNATURES:
            if sig in software_signature.lower():
                observations.append(f"Post-processing software signature detected: {software_signature}")
                evidence_items.append(EvidenceItem(
                    id="META-02",
                    title="Digital Post-Processing Software Signature",
                    layer="Metadata Analysis",
                    severity="low",
                    confidence="High Confidence",
                    explanation=f"Media contains metadata traces indicating modification with '{software_signature}'.",
                    why_flagged="Indicates the file passed through non-linear editing software rather than direct capture device pipeline.",
                    limitations="Standard legitimate files are routinely edited or trimmed in professional software.",
                    evidence_source="Container Software Tag",
                    score_impact=5
                ))
                break

    if camera_make or camera_model:
        observations.append(f"Hardware capture tags present: {camera_make or ''} {camera_model or ''}".strip())
        evidence_items.append(EvidenceItem(
            id="META-03",
            title="Hardware Device Signature Found",
            layer="Metadata Analysis",
            severity="informational",
            confidence="Moderate Confidence",
            explanation=f"Found hardware signature: {camera_make or 'Unknown'} {camera_model or ''}.",
            why_flagged="Hardware tags indicate potential origin from physical capture device.",
            limitations="EXIF data can be copied or spoofed.",
            evidence_source="Device Make & Model Tags",
            score_impact=0
        ))
    elif ext in [".jpg", ".jpeg", ".png", ".mp4", ".mov", ".webm"]:
        is_live_capture = "live_capture" in original_filename.lower() or "live_video" in original_filename.lower()
        if is_live_capture:
            observations.append("Direct web browser optical capture (WebRTC HTML5 video/canvas stream).")
            evidence_items.append(EvidenceItem(
                id="META-04-LIVE",
                title="Direct Browser Optical Capture (HTML5 Stream)",
                layer="Metadata Analysis",
                severity="informational",
                confidence="High Confidence",
                explanation="Media was acquired live via browser optical sensor (WebRTC MediaStream). Standard HTML5 browser sandboxes generate clean raster buffers without physical hardware EXIF headers.",
                why_flagged="Expected standard specification for direct in-browser optical acquisition.",
                limitations="Acquired live via browser optical sensor. Valid physical stream.",
                evidence_source="Live Optical Acquisition Stream",
                score_impact=0
            ))

    meta_result = MetadataResult(
        filename=original_filename,
        file_size_bytes=file_size,
        file_size_human=format_file_size(file_size),
        dimensions=dimensions,
        format=img_format,
        color_mode=color_mode,
        has_exif=has_exif,
        camera_make=camera_make,
        camera_model=camera_model,
        software_signature=software_signature,
        creation_datetime=creation_datetime,
        gps_info=gps_info,
        sha256_hash=file_hash,
        raw_exif_tags=raw_exif_tags,
        observations=observations,
        suspicious_indicators=suspicious_indicators
    )

    return meta_result, evidence_items
