import os
import hashlib
from typing import Dict, Any, List, Tuple
from PIL import Image, ExifTags
from app.models.schemas import MetadataResult, EvidenceItem

AI_SOFTWARE_SIGNATURES = [
    "stable diffusion", "midjourney", "dall-e", "comfyui", "automatic1111",
    "novelai", "adobe firefly", "bing image creator", "flux.1", "leonardo.ai"
]

PHOTO_EDITING_SIGNATURES = [
    "photoshop", "lightroom", "gimp", "canva", "snapseed", "picsart", "affinity"
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

    try:
        with Image.open(filepath) as img:
            width, height = img.size
            img_format = img.format or "UNKNOWN"
            color_mode = img.mode

            # Extract EXIF if available
            exif_data = img.getexif()
            if exif_data and len(exif_data) > 0:
                has_exif = True
                for tag_id, value in exif_data.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    # Sanitize value for JSON serialization
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

                # Check GPS Info
                if "GPSInfo" in raw_exif_tags:
                    gps_info = {"present": True, "raw": str(raw_exif_tags["GPSInfo"])}

            # Also check info dictionary for PNG text chunks (often contains AI prompts)
            png_info = getattr(img, "info", {})
            ai_chunk_found = []
            for k, v in png_info.items():
                k_lower = str(k).lower()
                v_lower = str(v).lower()
                if any(ai_sig in k_lower or ai_sig in v_lower for ai_sig in AI_SOFTWARE_SIGNATURES):
                    ai_chunk_found.append(f"{k}: {str(v)[:120]}")

    except Exception as e:
        observations.append(f"Image header parsing encountered warning: {str(e)}")
        width, height = (0, 0)
        img_format = "UNKNOWN"
        color_mode = "UNKNOWN"

    dimensions = {
        "width": width,
        "height": height,
        "aspect_ratio": f"{width}:{height}" if height > 0 else "N/A"
    }

    # Forensics rules evaluation
    # 1. AI Software signature check
    detected_ai_sig = None
    if software_signature:
        for sig in AI_SOFTWARE_SIGNATURES:
            if sig in software_signature.lower():
                detected_ai_sig = software_signature
                break
    
    if detected_ai_sig or ai_chunk_found:
        found_source = detected_ai_sig or (ai_chunk_found[0] if ai_chunk_found else "Embedded chunk")
        suspicious_indicators.append(f"AI synthesis software metadata identified: {found_source}")
        evidence_items.append(EvidenceItem(
            id="META-01",
            title="AI Synthesis Software Traces in Metadata",
            layer="Metadata Analysis",
            severity="suspicious",
            confidence="High Confidence",
            explanation=f"The file headers or embedded chunks explicitly reference synthetic generation framework: '{found_source}'.",
            why_flagged="Known generative AI tools (e.g. ComfyUI, Stable Diffusion, DALL-E) frequently serialize generation parameters into image headers.",
            limitations="Metadata can be forged or manually injected, but its direct presence strongly correlates with synthetic provenance.",
            evidence_source="Image EXIF / PNG Header Chunks",
            score_impact=25
        ))
    elif software_signature:
        # Check editing software
        for sig in PHOTO_EDITING_SIGNATURES:
            if sig in software_signature.lower():
                observations.append(f"Post-processing software signature detected: {software_signature}")
                evidence_items.append(EvidenceItem(
                    id="META-02",
                    title="Digital Post-Processing Software Signature",
                    layer="Metadata Analysis",
                    severity="low",
                    confidence="High Confidence",
                    explanation=f"Image contains metadata traces indicating modification with '{software_signature}'.",
                    why_flagged="Indicates the image passed through image editing software rather than direct camera pipeline.",
                    limitations="Standard legitimate photographs are routinely retouched or resized in software like Photoshop or Lightroom.",
                    evidence_source="EXIF Software Tag",
                    score_impact=5
                ))
                break

    # 2. Camera hardware presence
    if camera_make or camera_model:
        observations.append(f"Hardware camera tags present: {camera_make or ''} {camera_model or ''}".strip())
        evidence_items.append(EvidenceItem(
            id="META-03",
            title="Camera Hardware Signature Found",
            layer="Metadata Analysis",
            severity="informational",
            confidence="Moderate Confidence",
            explanation=f"Found hardware signature: {camera_make or 'Unknown'} {camera_model or ''}.",
            why_flagged="Hardware EXIF indicates potential origin from physical capture device.",
            limitations="EXIF data can be copied, spoofed, or injected into synthetic images using tools like ExifTool.",
            evidence_source="EXIF Make & Model Tags",
            score_impact=0
        ))
    else:
        # Absence of EXIF
        observations.append("Absence of EXIF camera hardware tags (common in social media uploads, messaging apps, and AI generators).")
        evidence_items.append(EvidenceItem(
            id="META-04",
            title="Stripped or Absent Camera EXIF Metadata",
            layer="Metadata Analysis",
            severity="low",
            confidence="High Confidence",
            explanation="No camera hardware make, model, or exposure timing was detected in the file headers.",
            why_flagged="Platforms like WhatsApp, Twitter/X, and AI generators routinely strip camera metadata.",
            limitations="Stripped metadata is standard across modern web distribution and does NOT prove forgery by itself.",
            evidence_source="File Header Inspection",
            score_impact=5
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
