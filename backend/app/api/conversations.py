"""Conversations lifecycle management API."""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import uuid

from app.services.conversation import conversation_service

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


@router.get("")
def list_conversations() -> List[Dict[str, Any]]:
    return [s.to_dict() for s in conversation_service.sessions.values()]


@router.post("")
def create_conversation() -> Dict[str, Any]:
    cid = str(uuid.uuid4())
    session = conversation_service.get_or_create_session(cid)
    return session.to_dict()


@router.get("/{conversation_id}")
def get_conversation(conversation_id: str) -> Dict[str, Any]:
    session = conversation_service.sessions.get(conversation_id)
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    data = session.to_dict()
    data["messages"] = session.messages
    return data


@router.delete("/{conversation_id}")
def reset_conversation(conversation_id: str) -> Dict[str, Any]:
    session = conversation_service.reset_session(conversation_id)
    return {"status": "reset", "conversation_id": session.conversation_id}
