"""Integration API endpoint tests using TestClient."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["reference_date"] == "2026-10-20"


def test_integrations_health_endpoint():
    resp = client.get("/api/health/integrations")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "dataset_records" in data
    assert data["dataset_records"]["orders"] == 1000


def test_chat_greeting():
    resp = client.post("/api/chat", json={"message": "Hello, need help with my order"})
    assert resp.status_code == 200
    data = resp.json()
    assert "conversation_id" in data
    assert "response" in data
    assert any(term in data["response"].lower() for term in ["ai", "assistant", "सपोर्ट"])


def test_order_lookup_unverified():
    resp = client.post("/api/orders/lookup", json={"order_id": "89782837"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_required"] is True
    assert data["verified"] is False
    assert data["items"] is None


def test_order_lookup_verified():
    # Order 89782837 has customer phone suffix 4533
    resp = client.post("/api/orders/lookup", json={"order_id": "89782837", "verification_value": "4533"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verified"] is True
    assert data["status"] is not None
    assert isinstance(data["items"], list)


def test_knowledge_search():
    resp = client.get("/api/knowledge/search?q=returns+policy+electronics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_results"] > 0
    sec_ids = [r["section_id"] for r in data["results"]]
    assert any("RET" in s for s in sec_ids)


def test_evaluation_summary():
    resp = client.get("/api/evaluation/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["benchmark_inventory"]["total_questions"] == 52
