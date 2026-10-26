"""Escalation logic and ticket creation tests."""
import pytest
from app.services.escalation import escalation_engine
from app.tools.tools_adapter import secure_create_ticket


def test_safety_hazard_escalation():
    msg = "My phone battery is swollen and smells like burning."
    should_esc, reason, desc, ev = escalation_engine.evaluate_triggers(msg)
    assert should_esc is True
    assert reason == "safety_hazard"
    assert "DWM-5" in ev


def test_legal_threat_escalation():
    msg = "I will file a complaint in consumer court and hire a lawyer."
    should_esc, reason, desc, ev = escalation_engine.evaluate_triggers(msg)
    assert should_esc is True
    assert reason == "legal_complaint"
    assert "ESC-1" in ev


def test_fraud_escalation():
    msg = "There is an order on my account that I never placed."
    should_esc, reason, desc, ev = escalation_engine.evaluate_triggers(msg)
    assert should_esc is True
    assert reason == "unauthorized_activity"
    assert "ESC-1" in ev


def test_human_agent_requested():
    msg = "I want to speak with a human agent please."
    should_esc, reason, desc, ev = escalation_engine.evaluate_triggers(msg)
    assert should_esc is True
    assert reason == "customer_requested"


def test_high_value_damage_escalation():
    # Item worth ₹32,999 (> ₹10,000 threshold under DWM-3)
    should_esc, reason, desc, ev = escalation_engine.evaluate_triggers(
        message="The TV screen is completely shattered",
        item_price=32999,
    )
    assert should_esc is True
    assert reason == "high_value_damage"
    assert "DWM-3" in ev


def test_ticket_creation_length_rule():
    # Too short summary (< 20 chars) rejected by mock tool
    res_short = secure_create_ticket(summary="Short")
    assert res_short.get("created") is False

    # Valid summary (>= 20 chars) accepted
    res_valid = secure_create_ticket(
        summary="Customer reports broken 43-inch TV. High value claim requires Priority Resolution review.",
        reason="high_value_damage",
    )
    assert res_valid.get("created") is True
    assert res_valid.get("ticket_id").startswith("TKT")
