"""Upload validation, storage names, and a small in-memory rate limiter."""

import os
import time
import uuid
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException, Request

_HITS: Dict[str, List[float]] = defaultdict(list)


def client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def enforce_rate_limit(request: Request, limit: int, window_seconds: int) -> None:
    now = time.time()
    key = client_key(request)
    recent = [stamp for stamp in _HITS[key] if now - stamp < window_seconds]
    if len(recent) >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {window_seconds} seconds.",
        )
    recent.append(now)
    _HITS[key] = recent


def safe_original_name(filename: Optional[str]) -> str:
    base = os.path.basename(filename or "evidence")
    cleaned = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in base)
    return cleaned[:180] or "evidence"


def storage_filename(extension: str) -> str:
    ext = extension if extension.startswith(".") else f".{extension}"
    return f"{uuid.uuid4().hex}{ext.lower()}"


def _starts(blob: bytes, magic: bytes) -> bool:
    return blob.startswith(magic)


def validate_file_contents(filepath: str, extension: str) -> Optional[str]:
    """
    Return an error string when the bytes do not match the declared type.
    Uploaded files are never executed.
    """
    ext = extension.lower()
    try:
        with open(filepath, "rb") as handle:
            header = handle.read(64)
            if ext == ".txt":
                rest = handle.read(256_000)
                payload = header + rest
    except OSError as exc:
        return f"Could not read uploaded file: {exc}"

    if not header and ext != ".txt":
        return "Uploaded file is empty."

    if ext in {".jpg", ".jpeg"} and not _starts(header, b"\xff\xd8\xff"):
        return "File extension is JPEG but the content is not a JPEG image."
    if ext == ".png" and not _starts(header, b"\x89PNG\r\n\x1a\n"):
        return "File extension is PNG but the content is not a PNG image."
    if ext == ".webp":
        if not (header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"WEBP"):
            return "File extension is WebP but the content is not a WebP image."
    if ext in {".tif", ".tiff"} and not (header.startswith(b"II*\x00") or header.startswith(b"MM\x00*")):
        return "File extension is TIFF but the content is not a TIFF image."
    if ext == ".gif" and not (header.startswith(b"GIF87a") or header.startswith(b"GIF89a")):
        return "GIF content was rejected. Use JPEG, PNG, WebP, or TIFF."
    if ext in {".mp4", ".mov", ".m4a"} and b"ftyp" not in header[:32]:
        return "File content does not contain a valid ISO media (ftyp) header."
    if ext in {".webm", ".mkv"} and not header.startswith(b"\x1a\x45\xdf\xa3"):
        return "File content does not contain a valid Matroska/WebM header."
    if ext == ".avi":
        if not (header.startswith(b"RIFF") and b"AVI " in header[:16]):
            return "File content does not contain a valid AVI header."
    if ext == ".wav":
        if not (header.startswith(b"RIFF") and b"WAVE" in header[:16]):
            return "File content does not contain a valid WAV header."
    if ext == ".ogg" and not header.startswith(b"OggS"):
        return "File content does not contain a valid Ogg header."
    if ext == ".flac" and not header.startswith(b"fLaC"):
        return "File content does not contain a valid FLAC header."
    if ext == ".mp3":
        if not (header.startswith(b"ID3") or (len(header) >= 2 and header[0] == 0xFF and (header[1] & 0xE0) == 0xE0)):
            return "File content does not look like an MP3 stream."
    if ext == ".aac":
        if not (len(header) >= 2 and header[0] == 0xFF and (header[1] & 0xF0) == 0xF0):
            return "File content does not look like an AAC ADTS stream."
    if ext == ".txt":
        if b"\x00" in header:
            return "Text uploads must be plain text without binary content."
        try:
            payload.decode("utf-8")
        except UnicodeDecodeError:
            return "Text uploads must be valid UTF-8."
    return None


def is_uuid(value: Optional[str]) -> bool:
    if not value:
        return False
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False
