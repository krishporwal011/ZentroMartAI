"""Gnani Speech Services integration (STT & TTS) with honest configuration state."""
from typing import Dict, Any, Optional
import httpx

from app.config import settings


class GnaniVoiceService:
    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.stt_url = settings.GNANI_STT_URL
        self.tts_url = settings.GNANI_TTS_URL

    def is_configured(self) -> bool:
        """Check if a valid Gnani API key is configured."""
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def get_status(self) -> Dict[str, Any]:
        """Return integration status for UI health indicators."""
        configured = self.is_configured()
        return {
            "configured": configured,
            "provider": "Gnani AI",
            "stt_model": "gnani-prisma-v2.5",
            "tts_model": "timbre-v2.5",
            "stt_endpoint": self.stt_url,
            "tts_endpoint": self.tts_url,
            "status": "connected" if configured else "unconfigured",
            "message": "Gnani Speech Services connected" if configured else "Gnani API key not configured. Set GNANI_API_KEY in .env.",
        }

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language_code: str = "hi-IN",
    ) -> Dict[str, Any]:
        """Transcribe audio using Gnani Prisma v2.5 STT REST API."""
        if not self.is_configured():
            return {
                "success": False,
                "error": "Gnani API key not configured.",
                "transcript": "",
                "unconfigured": True,
            }

        try:
            headers = {"X-API-Key-ID": self.api_key}
            files = {"audio_file": (filename, audio_bytes, "audio/wav")}
            data = {"language_code": language_code}

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.stt_url,
                    headers=headers,
                    files=files,
                    data=data,
                )
                if response.status_code == 200:
                    res_json = response.json()
                    return {
                        "success": True,
                        "transcript": res_json.get("transcript", ""),
                        "request_id": res_json.get("request_id"),
                        "model": res_json.get("model", "gnani-prisma-v2.5"),
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Gnani STT API error (HTTP {response.status_code})",
                        "details": response.text,
                    }
        except Exception as exc:
            return {
                "success": False,
                "error": f"STT network error: {str(exc)}",
            }

    async def synthesize_speech(
        self,
        text: str,
        language: str = "en-IN",
        voice: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Synthesize speech using Gnani Timbre v2.5 TTS REST API."""
        if not self.is_configured():
            return {
                "success": False,
                "error": "Gnani API key not configured.",
                "audio_bytes": None,
                "unconfigured": True,
            }

        # Select appropriate default voice for language
        if not voice:
            if language == "hi-IN":
                voice = settings.GNANI_DEFAULT_VOICE_HI
            elif language == "hi-en":
                voice = settings.GNANI_DEFAULT_VOICE_HINGLISH
            else:
                voice = settings.GNANI_DEFAULT_VOICE_EN

        payload = {
            "text": text,
            "voice": voice,
            "model": "timbre-v2.5",
            "language": language,
            "speed": 1.0,
            "audio_config": {
                "sample_rate": 48000,
                "num_channels": 1,
                "sample_width": 2,
                "encoding": "linear_pcm",
                "container": "wav",
            },
        }

        try:
            headers = {
                "X-API-Key-ID": self.api_key,
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.tts_url,
                    headers=headers,
                    json=payload,
                )
                if response.status_code == 200:
                    return {
                        "success": True,
                        "audio_bytes": response.content,
                        "content_type": "audio/wav",
                        "voice_used": voice,
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Gnani TTS API error (HTTP {response.status_code})",
                        "details": response.text,
                    }
        except Exception as exc:
            return {
                "success": False,
                "error": f"TTS network error: {str(exc)}",
            }


voice_service = GnaniVoiceService()
