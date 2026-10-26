"""Tickets API router for creating and listing support handovers."""
from fastapi import APIRouter
from typing import List, Dict, Any
import csv
import os

from app.models.schemas import CreateTicketRequest, CreateTicketResponse
from app.tools.tools_adapter import secure_create_ticket
from app.config import settings

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


@router.post("", response_model=CreateTicketResponse)
def create_ticket_endpoint(req: CreateTicketRequest) -> CreateTicketResponse:
    res = secure_create_ticket(
        summary=req.summary,
        order_id=req.order_id,
        reason=req.reason,
        intent=req.intent,
    )
    return CreateTicketResponse(
        created=res.get("created", False),
        ticket_id=res.get("ticket_id"),
        error=res.get("error"),
    )


@router.get("", response_model=List[Dict[str, Any]])
def list_created_tickets() -> List[Dict[str, Any]]:
    tickets_path = settings.DATASET_DIR / "tools" / "tickets_created.csv"
    if not tickets_path.exists():
        return []
    try:
        with open(tickets_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            return list(reader)
    except Exception:
        return []
