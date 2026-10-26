"""Orders lookup endpoint with strict identity-checking gate."""
from fastapi import APIRouter
from app.models.schemas import OrderLookupRequest, OrderLookupResponse
from app.tools.tools_adapter import secure_lookup_order

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("/lookup", response_model=OrderLookupResponse)
def lookup_order_endpoint(req: OrderLookupRequest) -> OrderLookupResponse:
    res = secure_lookup_order(req.order_id, req.verification_value)
    
    # Map result strictly adhering to disclosure rules
    if res.get("verified"):
        return OrderLookupResponse(
            found=True,
            verified=True,
            verification_required=False,
            message="Verification successful.",
            order_id=res.get("order_id"),
            status=res.get("status"),
            total_inr=res.get("total_inr"),
            payment_method=res.get("payment_method"),
            delivered_on=res.get("delivered_on"),
            customer_first_name=res.get("customer_first_name"),
            is_plus=res.get("is_plus"),
            items=res.get("items"),
        )
    elif res.get("verification_required"):
        return OrderLookupResponse(
            found=False,
            verified=False,
            verification_required=True,
            message=res.get("message", "Ask for the registered phone last 4 digits OR delivery pincode."),
            order_id=res.get("order_id"),
        )
    else:
        return OrderLookupResponse(
            found=False,
            verified=False,
            verification_required=True,
            message=res.get("message", "Verification failed or order not found."),
        )
