"""Escalation detection and support ticket creation service.

Implements the 7 mandatory rules from kb/agent_escalation_handoff.md:
1. Damaged, defective or wrong item worth > ₹10,000 (DWM-3, ESC-1).
2. Customer reports order, payment or account activity they did not make (ESC-1).
3. Customer mentions legal action, consumer court, or police complaint (ESC-1).
4. Third or later contact within 7 days (contacts_last_7_days >= 2, ESC-1).
5. Refund > 3 business days past maximum timeline (ESC-1).
6. Customer asks for a human agent (ESC-1).
7. Product safety risk: swelling battery, burning smell, sparks, injury (DWM-5, ESC-1).
"""
import re
from typing import Dict, Any, Optional, Tuple, List

from app.tools.tools_adapter import secure_create_ticket

SAFETY_KEYWORDS = [
    "swelling", "swollen", "battery swollen", "burning", "burning smell",
    "smoke", "sparks", "sparking", "fire", "shock", "electric shock",
    "injury", "injured", "blast", "exploded", "धुआं", "आग", "जलने की बदबू", "बैटरी फूल"
]

LEGAL_KEYWORDS = [
    "legal", "lawyer", "advocate", "consumer court", "consumer forum",
    "police", "fir", "court", "sue", "legal action", "पुलिस", "कोर्ट", "उपभोक्ता फोरम"
]

FRAUD_KEYWORDS = [
    "never placed", "did not place", "unauthorized", "didn't make", "account hacked",
    "fraud", "fraudulent", "scam", "maine order nahi kiya", "maine nahi mangwaya", "धोखाधड़ी"
]

HUMAN_AGENT_KEYWORDS = [
    "human agent", "talk to human", "speak to human", "human", "representative",
    "customer care executive", "insan se baat", "kisi insan", "agent se baat",
    "connect to agent", "person", "colleague", "कस्टमर केयर", "इंसान से बात", "एजेंट"
]


class EscalationEngine:
    def evaluate_triggers(
        self,
        message: str,
        order: Optional[Dict[str, Any]] = None,
        item_price: Optional[int] = None,
        refund_days_overdue: int = 0,
    ) -> Tuple[bool, Optional[str], Optional[str], List[str]]:
        """Evaluate if conversation requires immediate escalation under ESC-1.
        
        Returns (should_escalate, reason_code, description, evidence_sections)
        """
        msg_lower = message.lower()
        
        # Rule 7: Product safety risk
        if any(kw in msg_lower for kw in SAFETY_KEYWORDS):
            return (
                True,
                "safety_hazard",
                "Product safety risk reported (battery swelling, burning smell, sparks or injury). Immediate stop of use and priority review required.",
                ["ESC-1", "DWM-5"]
            )

        # Rule 3: Legal action, consumer court, police complaint
        if any(kw in msg_lower for kw in LEGAL_KEYWORDS):
            return (
                True,
                "legal_complaint",
                "Customer mentioned legal action, consumer court or police complaint.",
                ["ESC-1"]
            )

        # Rule 2: Unauthorized order / payment / account activity
        if any(kw in msg_lower for kw in FRAUD_KEYWORDS):
            return (
                True,
                "unauthorized_activity",
                "Customer reports order, payment or account activity they did not authorize.",
                ["ESC-1"]
            )

        # Rule 6: Customer asks for human agent
        if any(kw in msg_lower for kw in HUMAN_AGENT_KEYWORDS):
            return (
                True,
                "customer_requested",
                "Customer explicitly requested to speak with a human support colleague.",
                ["ESC-1"]
            )

        # Rule 1: Damaged/defective/wrong item worth > ₹10,000
        if item_price and item_price > 10000:
            return (
                True,
                "high_value_damage",
                f"Damaged, defective or wrong item value (₹{item_price:,}) exceeds ₹10,000 threshold for automated resolution.",
                ["ESC-1", "DWM-3"]
            )
        if order:
            # Check damage claims in order record
            subtotal = int(order.get("subtotal_inr") or order.get("total_inr") or 0)
            if order.get("damage_sku") and subtotal > 10000:
                return (
                    True,
                    "high_value_damage",
                    f"Damaged item claim on order {order.get('order_id')} exceeds ₹10,000. Priority Resolution handover required.",
                    ["ESC-1", "DWM-3"]
                )

            # Rule 4: Third or later contact within 7 days (contacts_last_7_days >= 2)
            contacts = int(order.get("contacts_last_7_days") or 0)
            if contacts >= 2:
                return (
                    True,
                    "repeat_contact",
                    f"Customer has contacted support {contacts} prior times in the last 7 days regarding order {order.get('order_id')}.",
                    ["ESC-1"]
                )

        # Rule 5: Refund more than 3 business days past maximum timeline
        if refund_days_overdue > 3:
            return (
                True,
                "overdue_refund",
                f"Refund is {refund_days_overdue} business days past its maximum processing timeline.",
                ["ESC-1"]
            )

        return (False, None, None, [])

    def create_escalation_ticket(
        self,
        summary: str,
        order_id: Optional[str] = None,
        reason: Optional[str] = None,
        intent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create ticket through secure mock tool with compliant summary length."""
        # Ensure summary is at least 20 chars
        clean_summary = summary.strip()
        if len(clean_summary) < 20:
            clean_summary = f"{clean_summary} - Escalated to human support for review."
            
        result = secure_create_ticket(
            summary=clean_summary,
            order_id=order_id,
            reason=reason,
            intent=intent
        )
        return result


escalation_engine = EscalationEngine()
