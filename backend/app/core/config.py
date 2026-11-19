import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    PROJECT_NAME: str = "TruthLens Multimodal Forensic Engine"
    VERSION: str = "2.1.0"
    API_V1_STR: str = "/api"
    
    # AI & Cloud Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_FALLBACK_MODEL: str = "gemini-3.1-flash-lite"
    
    # Model Context Protocol (MCP) Server Configuration
    MCP_SEARCH_API_KEY: str = ""
    MCP_SERVER_ENABLED: bool = True
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    RATE_LIMIT_ANALYZE: int = 30
    RATE_LIMIT_WINDOW_SECONDS: int = 600
    
    # Upload & Storage settings (Use /tmp when deployed to Vercel/serverless)
    UPLOAD_DIR: str = "/tmp/uploads" if (os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV")) else os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    REPORTS_DIR: str = "/tmp/reports_generated" if (os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV")) else os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "reports_generated")
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [
        # Images
        ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".jfif", ".jfi", ".bmp",
        # Videos
        ".mp4", ".mov", ".webm", ".avi", ".mkv",
        # Audio / Voice
        ".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac", ".weba",
        # Text
        ".txt"
    ]
    
    # CORS. Wildcard is omitted because credentialed browser requests reject it.
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ORIGIN_REGEX: str = r"^https:\/\/.*\.vercel\.app$"

    class Config:
        env_file = str(BACKEND_ROOT / ".env")
        extra = "ignore"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
