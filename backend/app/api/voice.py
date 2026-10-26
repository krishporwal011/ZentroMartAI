"""Voice endpoints integrating Gnani Speech-to-Text and Text-to-Speech."""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.services.voice_service import voice_service

router = APIRouter(prefix="/api/voice", tags=["Voice"])


class SynthesizeRequest(BaseModel):
    text: str
    language: str = "en-IN"
    voice: Optional[str] = None


@router.get("/status")
def voice_status() -> Dict[str, Any]:
    return voice_service.get_status()


@router.post("/transcribe")
async def transcribe_audio_endpoint(
    audio: UploadFile = File(...),
    language_code: str = Form("hi-IN"),
) -> Dict[str, Any]:
    """Transcribe user-recorded audio via Gnani STT."""
    try:
        content = await audio.read()
        if len(content) == 0:
            return {"success": False, "error": "Empty audio payload"}
        
        result = await voice_service.transcribe_audio(
            audio_bytes=content,
            filename=audio.filename or "audio.wav",
            language_code=language_code,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failure: {str(exc)}")


@router.post("/synthesize")
async def synthesize_speech_endpoint(req: SynthesizeRequest):
    """Synthesize text into speech via Gnani TTS."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    result = await voice_service.synthesize_speech(
        text=req.text,
        language=req.language,
        voice=req.voice,
    )

    if not result.get("success"):
        return {
            "success": False,
            "error": result.get("error", "Synthesis failed"),
            "unconfigured": result.get("unconfigured", False),
        }

    # Return audio bytes directly with proper mime type
    return Response(content=result["audio_bytes"], media_type="audio/wav")
