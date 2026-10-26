"""Tests for TinyFish Web Agent integration."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.tinyfish_service import TinyFishService

client = TestClient(app)


def test_tinyfish_service_status():
    service = TinyFishService(api_key="")
    status = service.get_status()
    assert status["configured"] is False
    assert status["provider"] == "tinyfish_simulator"
    assert len(status["presets"]) >= 3
    preset_ids = [p["id"] for p in status["presets"]]
    assert "meta_debt_equity_2025" in preset_ids


@pytest.mark.asyncio
async def test_tinyfish_meta_10k_calculation():
    service = TinyFishService(api_key="")
    goal = "Calculate META's debt to equity ratio using figures from its 2025 fiscal year 10-K filing from https://www.sec.gov"
    url = "https://www.sec.gov"

    res = await service.run_agent(goal=goal, url=url, pretty=True)
    assert res["success"] is True
    assert res["status"] == "completed"
    assert "result" in res

    data = res["result"]
    assert data["ticker"] == "META"
    assert data["cik"] == "0001326801"
    
    # Financial metrics verification from SEC 10-K
    figs = data["financial_figures_in_millions_usd"]
    assert figs["long_term_debt"] == 58744.0
    assert figs["total_stockholders_equity"] == 217243.0
    assert figs["total_debt_including_leases"] == 83897.0

    calcs = data["debt_to_equity_calculations"]
    assert calcs["method_1_long_term_debt_only"]["debt_to_equity_ratio"] == 0.2704
    assert calcs["method_2_total_debt_including_leases"]["debt_to_equity_ratio"] == 0.3862

    # Verify formatted output contains key metrics
    formatted = res["formatted_output"]
    assert "0.2704" in formatted
    assert "0.3862" in formatted
    assert "$58,744M" in formatted


def test_tinyfish_status_endpoint():
    response = client.get("/api/tinyfish/status")
    assert response.status_code == 200
    data = response.json()
    assert "configured" in data
    assert "provider" in data
    assert "presets" in data
    assert len(data["presets"]) >= 3


def test_tinyfish_run_endpoint_meta_query():
    payload = {
        "goal": "Calculate META's debt to equity ratio using figures from its 2025 fiscal year 10-K filing from https://www.sec.gov",
        "url": "https://www.sec.gov",
        "pretty": True,
    }
    response = client.post("/api/tinyfish/agent/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "run_id" in data
    assert data["goal"] == payload["goal"]
    assert data["url"] == payload["url"]
    assert "formatted_output" in data
    assert "0.2704" in data["formatted_output"]


def test_tinyfish_run_endpoint_validation():
    # Empty url should fail validation
    payload = {"goal": "Check prices", "url": ""}
    response = client.post("/api/tinyfish/agent/run", json=payload)
    assert response.status_code in (400, 422)


def test_health_integrations_includes_tinyfish():
    response = client.get("/api/health/integrations")
    assert response.status_code == 200
    data = response.json()
    integration_names = [i["name"] for i in data["integrations"]]
    assert "TinyFish Web Agent" in integration_names
