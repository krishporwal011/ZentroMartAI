"""Pydantic schemas for request and response validation across all endpoints."""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = Field(None, description="Active session ID or empty to generate new")
    message: str = Field(..., min_length=1, max_length=2000, description="Customer text input")
    channel: str = Field("chat", description="Input channel (chat, voice, email)")


class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    intent: str
    decision: str
    evidence: List[str] = []
    tool_calls: List[str] = []
    verified: bool = False
    order_id: Optional[str] = None
    workflow: str = "idle"
    ticket_id: Optional[str] = None
    order_data: Optional[Dict[str, Any]] = None


class OrderLookupRequest(BaseModel):
    order_id: str = Field(..., description="8-digit order ID")
    verification_value: Optional[str] = Field(None, description="Phone last 4 digits or 6-digit delivery pincode")


class OrderLookupResponse(BaseModel):
    found: bool = False
    verified: bool = False
    verification_required: bool = True
    message: Optional[str] = None
    order_id: Optional[str] = None
    status: Optional[str] = None
    total_inr: Optional[int] = None
    payment_method: Optional[str] = None
    delivered_on: Optional[str] = None
    customer_first_name: Optional[str] = None
    is_plus: Optional[bool] = None
    items: Optional[List[Dict[str, Any]]] = None


class CreateTicketRequest(BaseModel):
    summary: str = Field(..., min_length=5, max_length=1000)
    order_id: Optional[str] = None
    reason: Optional[str] = None
    intent: Optional[str] = None


class CreateTicketResponse(BaseModel):
    created: bool
    ticket_id: Optional[str] = None
    error: Optional[str] = None


class KnowledgeSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[Dict[str, Any]]


class IntegrationHealth(BaseModel):
    name: str
    status: str  # connected | unconfigured | degraded
    details: str
    model_or_version: Optional[str] = None


class SystemHealthResponse(BaseModel):
    status: str
    reference_date: str
    dataset_records: Dict[str, int]
    integrations: List[IntegrationHealth]


class TinyFishRunRequest(BaseModel):
    goal: str = Field(..., min_length=3, description="Natural language goal for the web agent")
    url: str = Field(..., description="Target webpage URL to visit")
    pretty: bool = Field(True, description="Format JSON or Markdown output")


class TinyFishRunResponse(BaseModel):
    success: bool
    run_id: str
    status: str
    provider: str
    goal: str
    url: str
    execution_time_seconds: Optional[float] = None
    steps: List[Dict[str, Any]] = []
    result: Dict[str, Any] = {}
    formatted_output: str
    warning: Optional[str] = None
    simulated: Optional[bool] = False


class TinyFishStatusResponse(BaseModel):
    configured: bool
    provider: str
    api_url: str
    masked_api_key: Optional[str] = None
    presets: List[Dict[str, Any]] = []
