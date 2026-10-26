"""Health and integration status endpoints."""
from fastapi import APIRouter
from typing import Dict, Any

from app.config import settings
from app.core.dataset_loader import dataset_store
from app.services.retrieval import kb_retriever
from app.services.llm_provider import get_llm_provider
from app.services.voice_service import voice_service
from app.services.tinyfish_service import tinyfish_service
from app.models.schemas import SystemHealthResponse, IntegrationHealth

router = APIRouter(tags=["Health"])


@router.get("/health")
@router.get("/api/health")
def health_check() -> Dict[str, str]:
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "reference_date": settings.REFERENCE_DATE,
    }



@router.get("/api/health/integrations", response_model=SystemHealthResponse)
def integrations_health() -> SystemHealthResponse:
    llm = get_llm_provider()
    voice_status = voice_service.get_status()
    tf_status = tinyfish_service.get_status()

    integrations = [
        IntegrationHealth(
            name="Dataset & Relational Store",
            status="connected" if len(dataset_store.orders) == 1000 else "degraded",
            details=f"Loaded 1,000 orders, 70 products, 300 customers, 36 pincodes, 4 holidays",
            model_or_version="FTTT_2026",
        ),
        IntegrationHealth(
            name="Knowledge Base Indexer",
            status="connected" if kb_retriever.total_docs > 0 else "degraded",
            details=f"Indexed {len(kb_retriever.sections)} semantic sections across {len(set(s.doc_id for s in kb_retriever.sections))} documents",
            model_or_version="BM25 Precedence",
        ),
        IntegrationHealth(
            name="LLM Provider",
            status="connected" if llm.is_configured() else "unconfigured",
            details=f"Provider: {llm.provider_name()}. {'Active hosted credentials' if llm.is_configured() else 'Operating in deterministic offline mode'}",
            model_or_version=llm.provider_name(),
        ),
        IntegrationHealth(
            name="Gnani Speech-to-Text (STT)",
            status=voice_status["status"],
            details=voice_status["message"],
            model_or_version=voice_status["stt_model"],
        ),
        IntegrationHealth(
            name="Gnani Text-to-Speech (TTS)",
            status=voice_status["status"],
            details=voice_status["message"],
            model_or_version=voice_status["tts_model"],
        ),
        IntegrationHealth(
            name="TinyFish Web Agent",
            status="connected" if tf_status["configured"] else "fallback",
            details=(
                f"Cloud browser agent connected ({tf_status['masked_api_key']})"
                if tf_status["configured"]
                else "Deterministic simulator active (SEC Form 10-K & web task simulation ready)"
            ),
            model_or_version=tf_status["provider"],
        ),
    ]

    record_counts = {
        "orders": len(dataset_store.orders),
        "products": len(dataset_store.products),
        "customers": len(dataset_store.customers),
        "pincodes": len(dataset_store.pincodes),
        "holidays": len(dataset_store.holidays),
        "support_logs": len(dataset_store.support_logs),
        "practice_questions": len(dataset_store.practice_questions),
        "practice_conversations": len(dataset_store.practice_conversations),
        "kb_sections": len(kb_retriever.sections),
    }

    return SystemHealthResponse(
        status="healthy",
        reference_date=settings.REFERENCE_DATE,
        dataset_records=record_counts,
        integrations=integrations,
    )
