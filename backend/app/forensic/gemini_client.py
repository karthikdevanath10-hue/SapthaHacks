"""Shared Gemini JSON client with model fallback. Does not invent results."""

import json
import logging
from typing import Any, Dict, List, Optional, Tuple

import httpx

from app.core.config import settings

logger = logging.getLogger("truthlens.gemini")


def configured_models() -> List[str]:
    models: List[str] = []
    # Prioritize fast, high-quota flash-lite models to avoid HTTP 429
    for name in (settings.GEMINI_MODEL, settings.GEMINI_FALLBACK_MODEL, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash"):
        if name and name not in models:
            models.append(name)
    return models


def parse_model_json(raw_text: str) -> Dict[str, Any]:
    cleaned = (raw_text or "").strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Model output was not a JSON object")
    return parsed


async def gemini_json(
    parts: List[Dict[str, Any]],
    timeout: float = 35.0,
) -> Tuple[Optional[Dict[str, Any]], Optional[str], Optional[str]]:
    """
    Returns (parsed_json, error, model_name).
    parsed_json is None when every configured model fails.
    The API key is never written to logs.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None, "GEMINI_API_KEY is not configured", None

    last_error = "No Gemini model was attempted"
    for model in configured_models():
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={api_key}"
        )
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json",
            },
        }
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(url, json=payload)
            if response.status_code != 200:
                last_error = f"{model} returned HTTP {response.status_code}"
                logger.warning("Gemini request unsuccessful: %s", last_error)
                continue
            body = response.json()
            candidates = body.get("candidates") or []
            if not candidates:
                last_error = f"{model} returned no candidates"
                logger.warning(last_error)
                continue
            raw_text = (
                candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            )
            if not str(raw_text).strip():
                last_error = f"{model} returned empty output"
                continue
            return parse_model_json(raw_text), None, model
        except Exception as exc:
            last_error = f"{model} output could not be used: {exc}"
            logger.warning("Gemini call failed: %s", last_error)

    return None, last_error, None
