"""TinyFish Autonomous Web Agent API endpoints."""
from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import (
    TinyFishRunRequest,
    TinyFishRunResponse,
    TinyFishStatusResponse,
)
from app.services.tinyfish_service import tinyfish_service

logger = logging.getLogger("zentromart-tinyfish-api")

router = APIRouter(prefix="/api/tinyfish", tags=["TinyFish Web Agent"])


@router.get("/status", response_model=TinyFishStatusResponse)
def get_tinyfish_status() -> TinyFishStatusResponse:
    """Return status of TinyFish Web Agent integration, API key, and preset templates."""
    status_data = tinyfish_service.get_status()
    return TinyFishStatusResponse(**status_data)


@router.post("/agent/run", response_model=TinyFishRunResponse)
async def run_tinyfish_agent(req: TinyFishRunRequest) -> TinyFishRunResponse:
    """Execute a natural language web agent task on target URL.
    
    Supports:
    - Live cloud web automation if TINYFISH_API_KEY is configured
    - Built-in deterministic extraction (including SEC Form 10-K META Debt-to-Equity calculations)
    """
    if not req.goal or not req.url:
        raise HTTPException(status_code=400, detail="Both 'goal' and 'url' are required.")

    try:
        result = await tinyfish_service.run_agent(
            goal=req.goal,
            url=req.url,
            pretty=req.pretty,
        )
        return TinyFishRunResponse(**result)
    except Exception as exc:
        logger.error(f"Error executing TinyFish agent run: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"TinyFish execution failed: {str(exc)}",
        )
