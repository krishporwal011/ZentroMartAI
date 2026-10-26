"""Order lookup security and identity verification gate tests."""
import pytest
from app.tools.tools_adapter import secure_lookup_order
from app.services.conversation import ConversationService
from app.core.dataset_loader import dataset_store


def test_unverified_lookup_reveals_no_details():
    oid = list(dataset_store.orders.keys())[0]
    res = secure_lookup_order(oid)
    assert res.get("verification_required") is True
    assert "items" not in res
    assert "status" not in res
    assert "total_inr" not in res
    assert "delivery_pincode" not in res
    assert "phone" not in res


def test_invalid_proof_rejected():
    oid = list(dataset_store.orders.keys())[0]
    res = secure_lookup_order(oid, verification_value="0000")
    assert res.get("verified") is False
    assert res.get("verification_required") is True
    assert "items" not in res
    assert "status" not in res


def test_valid_phone_suffix_verification():
    oid = list(dataset_store.orders.keys())[0]
    order = dataset_store.orders[oid]
    cust = dataset_store.customers[order["customer_id"]]
    phone_last4 = cust["phone"][-4:]

    res = secure_lookup_order(oid, verification_value=phone_last4)
    assert res.get("found") is True
    assert res.get("verified") is True
    assert "items" in res
    assert "status" in res
    # Must not leak back the phone_last4 or expected secrets
    assert "phone_last4" not in res


def test_valid_pincode_verification():
    oid = list(dataset_store.orders.keys())[0]
    order = dataset_store.orders[oid]
    pincode = order["delivery_pincode"]

    res = secure_lookup_order(oid, verification_value=pincode)
    assert res.get("found") is True
    assert res.get("verified") is True
    assert "items" in res
    assert "status" in res


@pytest.mark.asyncio
async def test_retry_limit_enforced_in_conversation():
    conv = ConversationService()
    cid = "test_retry_limit"
    oid = "89782837"

    # Step 1: User gives order ID
    step1 = await conv.handle_message(cid, f"My order is {oid}")
    assert step1["decision"] == "clarify"
    assert step1["verified"] is False

    # Step 2: Attempt 1 with wrong digits
    step2 = await conv.handle_message(cid, "9999")
    assert step2["decision"] == "clarify"
    assert "re-check" in step2["response"].lower() or "dobara" in step2["response"].lower() or "दोबारा" in step2["response"]

    # Step 3: Attempt 2 with wrong digits
    step3 = await conv.handle_message(cid, "8888")
    assert step3["decision"] == "refuse"
    assert step3["verified"] is False
    assert "privacy" in step3["response"].lower() or "fail" in step3["response"].lower() or "साझा नहीं" in step3["response"]
