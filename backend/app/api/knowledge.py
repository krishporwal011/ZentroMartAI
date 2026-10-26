"""Knowledge Base search and inspection endpoints."""
from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional

from app.services.retrieval import kb_retriever
from app.models.schemas import KnowledgeSearchResponse

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base"])


@router.get("/search", response_model=KnowledgeSearchResponse)
def search_knowledge(
    q: str = Query(..., min_length=1, description="Search query"),
    top_k: int = Query(5, ge=1, le=20),
) -> KnowledgeSearchResponse:
    results = kb_retriever.search(query=q, top_k=top_k)
    mapped = []
    for chunk, score in results:
        data = chunk.to_dict()
        data["relevance_score"] = score
        mapped.append(data)

    return KnowledgeSearchResponse(
        query=q,
        total_results=len(mapped),
        results=mapped,
    )


@router.get("/sections")
def list_sections() -> List[Dict[str, Any]]:
    return [chunk.to_dict() for chunk in kb_retriever.sections]


@router.get("/section/{section_id}")
def get_section_by_id(section_id: str) -> Dict[str, Any]:
    sec = kb_retriever.get_section(section_id)
    if not sec:
        return {"found": False, "section_id": section_id}
    data = sec.to_dict()
    data["found"] = True
    return data
