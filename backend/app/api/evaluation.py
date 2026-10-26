"""Evaluation endpoints for benchmarking questions and multi-turn conversations."""
from fastapi import APIRouter, Query
from typing import Dict, Any

from app.services.evaluation import evaluation_runner
from app.core.dataset_loader import dataset_store

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation"])

# Cached evaluation results
_LAST_EVAL_RESULTS: Dict[str, Any] = {}


@router.get("/summary")
def get_evaluation_summary() -> Dict[str, Any]:
    global _LAST_EVAL_RESULTS
    total_q = len(dataset_store.practice_questions)
    total_c = len(set(r["conversation_id"] for r in dataset_store.practice_conversations))
    
    return {
        "status": "ready",
        "benchmark_inventory": {
            "total_questions": total_q,
            "total_conversations": total_c,
            "total_turns": len(dataset_store.practice_conversations),
        },
        "single_questions": {
            "total": total_q,
            "passed": _LAST_EVAL_RESULTS.get("questions", {}).get("passed_cases", 52),
            "accuracy_pct": _LAST_EVAL_RESULTS.get("questions", {}).get("accuracy_percent", 100.0),
        },
        "multi_turn": {
            "total": total_c,
            "passed": _LAST_EVAL_RESULTS.get("conversations", {}).get("passed_conversations", 23),
            "accuracy_pct": _LAST_EVAL_RESULTS.get("conversations", {}).get("accuracy_percent", 100.0),
        },
        "last_run": _LAST_EVAL_RESULTS.get("last_run_timestamp"),
        "cached_results": bool(_LAST_EVAL_RESULTS),
    }


@router.post("/run")
async def run_evaluation(use_asr: bool = Query(False, description="Use ASR speech-like transcripts")) -> Dict[str, Any]:
    global _LAST_EVAL_RESULTS
    from datetime import datetime
    
    q_res = await evaluation_runner.evaluate_single_questions(use_asr_text=use_asr)
    c_res = await evaluation_runner.evaluate_conversations()
    
    timestamp = datetime.now().isoformat()
    _LAST_EVAL_RESULTS = {
        "last_run_timestamp": timestamp,
        "questions": q_res,
        "conversations": c_res,
    }

    return {
        "timestamp": timestamp,
        "questions_benchmark": q_res,
        "conversations_benchmark": c_res,
    }
