"""Configuration settings for ZentroMart AI Customer Support Agent."""
from pathlib import Path
import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Base project directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Default dataset directory
DEFAULT_DATASET_DIR = BASE_DIR / "Capstone_Project_Dataset_FTTT_2026"
DATASET_DIR_STR = os.getenv("DATASET_DIR", str(DEFAULT_DATASET_DIR))
DATASET_PATH = Path(DATASET_DIR_STR).resolve()
if not DATASET_PATH.exists() and DEFAULT_DATASET_DIR.exists():
    DATASET_PATH = DEFAULT_DATASET_DIR.resolve()


class Settings(BaseModel):
    PROJECT_NAME: str = "ZentroMart AI Customer Support Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Dataset path & fixed reference date
    DATASET_DIR: Path = DATASET_PATH
    REFERENCE_DATE: str = os.getenv("REFERENCE_DATE", "2026-10-20")
    
    # CORS allowed origins
    FRONTEND_ORIGINS: List[str] = [
        "https://zentro-mart-ai.vercel.app",
        "https://zentromart-ai.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ] + ([o.strip().rstrip("/") for o in os.getenv("FRONTEND_ORIGIN", "").split(",") if o.strip()] if os.getenv("FRONTEND_ORIGIN") else [])
    
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "deterministic")  # deterministic | openai | gemini
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    # Gnani Voice Settings
    GNANI_API_KEY: str = os.getenv("GNANI_API_KEY", "")
    GNANI_STT_URL: str = os.getenv("GNANI_STT_URL", "https://api.vachana.ai/stt/v3")
    GNANI_TTS_URL: str = os.getenv("GNANI_TTS_URL", "https://api.vachana.ai/api/v1/tts/inference")
    GNANI_DEFAULT_VOICE_EN: str = "Devika"
    GNANI_DEFAULT_VOICE_HI: str = "Nalini"
    GNANI_DEFAULT_VOICE_HINGLISH: str = "Poorvi"

    # TinyFish Web Agent Settings
    TINYFISH_API_KEY: str = os.getenv("TINYFISH_API_KEY", "")
    TINYFISH_API_URL: str = os.getenv("TINYFISH_API_URL", "https://agent.tinyfish.ai/v1/agent/run")
    TINYFISH_TIMEOUT: float = float(os.getenv("TINYFISH_TIMEOUT", "60.0"))


settings = Settings()
