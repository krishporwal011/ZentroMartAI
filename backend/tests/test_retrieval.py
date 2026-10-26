"""Retrieval and policy precedence unit tests."""
import pytest
from app.services.retrieval import kb_retriever


def test_section_ids_preserved():
    sec_ret = kb_retriever.get_section("RET-2")
    assert sec_ret is not None
    assert sec_ret.doc_id == "POL-RET"
    assert sec_ret.doc_type == "policy"
    assert sec_ret.status == "current"


def test_policy_precedence_over_superseded():
    # Searching for returns should surface current POL-RET (v4) over superseded POL-RET-v3
    results = kb_retriever.search("electronics return window days", top_k=5)
    assert len(results) > 0
    top_section, top_score = results[0]
    assert top_section.status == "current"
    assert top_section.doc_id == "POL-RET"


def test_policy_precedence_over_marketing():
    # Searching for ZentroMart Plus benefits
    results = kb_retriever.search("plus membership benefits return window", top_k=5)
    assert len(results) > 0
    top_section, _ = results[0]
    assert top_section.doc_type in ("policy", "agent_guide")
    assert top_section.doc_type != "marketing"


def test_refund_policy_precedence_over_faq():
    # FAQ-1 claims 5 to 7 days for everything, but REF-2 gives specific timelines
    results = kb_retriever.search("wallet refund timeline how fast", top_k=3, disallow_hard_negatives=["FAQ-1"])
    assert len(results) > 0
    section_ids = [s.section_id for s, _ in results]
    assert "REF-2" in section_ids
    assert "FAQ-1" not in section_ids
