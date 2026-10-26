"""Chat API endpoint routing to conversation service."""
from fastapi import APIRouter, HTTPException
import uuid

from app.models.schemas import ChatRequest, ChatResponse
from app.services.conversation import conversation_service

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    try:
        cid = request.conversation_id or str(uuid.uuid4())
        result = await conversation_service.handle_message(
            conversation_id=cid,
            message=request.message,
            channel=request.channel,
        )
        return ChatResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversational processing error: {str(exc)}")
