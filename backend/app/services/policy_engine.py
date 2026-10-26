"""Deterministic policy rules engine for ZentroMart e-commerce operations."""
from datetime import date
from typing import Dict, Any, Optional, List, Set

from app.config import settings
from app.core.business_calendar import (
    parse_date,
    add_calendar_days,
    add_business_days,
    format_date_multilingual,
)
from app.core.dataset_loader import dataset_store

# Reference date: 2026-10-20
REF_DATE = parse_date(settings.REFERENCE_DATE)

# Non-returnable categories
NON_RETURNABLE_CATEGORIES = {"grocery", "innerwear", "digital"}


class PolicyEngine:
    def __init__(self, holidays: Optional[Set[str]] = None):
        self.holidays = holidays or dataset_store.get_holidays()

    def check_return_eligibility(
        self,
        category: str,
        delivered_on: str | date,
        placed_at: Optional[str | date] = None,
        is_plus: bool = False,
        is_opened: bool = False,
        is_damaged_defective: bool = False,
    ) -> Dict[str, Any]:
        """Compute return eligibility, deadline, pickup fee, and evidence sections."""
        deliv_date = parse_date(delivered_on)
        cat = category.lower().strip()
        evidence_sections: List[str] = ["RET-2"]

        # Check non-returnable categories
        if cat in NON_RETURNABLE_CATEGORIES:
            evidence_sections.append("RET-5")
            if is_damaged_defective:
                evidence_sections.append("DWM-1")
                return {
                    "eligible": False,
                    "returnable": False,
                    "reason": f"Category '{cat}' is not returnable for change of mind. Damaged/defective items can be reported within 48h.",
                    "evidence": evidence_sections,
                }
            return {
                "eligible": False,
                "returnable": False,
                "reason": f"Items in '{cat}' category are not returnable.",
                "evidence": evidence_sections,
            }

        # Check beauty seal condition
        if cat == "beauty_sealed" and is_opened:
            evidence_sections.append("RET-4")
            return {
                "eligible": False,
                "returnable": False,
                "reason": "Beauty and personal care products are returnable only if unopened with the seal intact.",
                "evidence": evidence_sections,
            }

        # Determine return window in calendar days
        window_days = 10  # default
        
        if cat == "electronics":
            # Check RET-3: delivered before 1 August 2026 keeps 10-day window from v3
            cutoff_aug1 = date(2026, 8, 1)
            if deliv_date < cutoff_aug1:
                window_days = 10
                evidence_sections.extend(["RET-3", "RETv3-2"])
            else:
                window_days = 7
                evidence_sections.append("RET-3")
                
        elif cat == "fashion":
            # Standard fashion is 15 days
            window_days = 15
            # Check RET-8: orders placed between 01 Oct and 15 Oct 2026 get 30 days
            if placed_at:
                order_date = parse_date(placed_at)
                if date(2026, 10, 1) <= order_date <= date(2026, 10, 15):
                    window_days = 30
                    evidence_sections.append("RET-8")
                    
        elif cat in ("home_kitchen", "books_media"):
            window_days = 10
            
        elif cat == "beauty_sealed":
            window_days = 7

        deadline = add_calendar_days(deliv_date, window_days)
        is_eligible = REF_DATE <= deadline

        # Reverse pickup fee (RET-6)
        pickup_fee = 0
        fee_waived = False
        if cat == "fashion":
            pickup_fee = 49
            evidence_sections.append("RET-6")
            if is_plus:
                evidence_sections.append("PLS-2")
                fee_waived = True
                pickup_fee = 0
            elif is_damaged_defective:
                evidence_sections.append("DWM-2")
                fee_waived = True
                pickup_fee = 0

        dates_info = format_date_multilingual(deadline)

        return {
            "eligible": is_eligible,
            "returnable": True,
            "category": cat,
            "window_days": window_days,
            "delivered_on": deliv_date.isoformat(),
            "deadline_date": deadline.isoformat(),
            "deadline_en": dates_info["en"],
            "deadline_hi": dates_info["hi"],
            "deadline_variants": dates_info["all_variants"],
            "reverse_pickup_fee": pickup_fee,
            "fee_waived": fee_waived,
            "evidence": evidence_sections,
        }

    def compute_refund_timeline(
        self,
        payment_method: str,
        initiated_on: str | date,
        is_plus: bool = False,
    ) -> Dict[str, Any]:
        """Compute expected refund arrival dates in business days."""
        init_date = parse_date(initiated_on)
        pm = payment_method.lower().strip()
        evidence_sections: List[str] = ["REF-2", "KB-00.3"]

        # Map timelines: (min_bus_days, max_bus_days, is_instant)
        method_map = {
            "upi": (1, 3, False),
            "card": (5, 7, False),
            "netbanking": (3, 5, False),
            "wallet": (0, 0, True),
            "cod_wallet": (0, 0, True),
            "cod_bank": (5, 7, False),
        }

        min_days, max_days, is_instant = method_map.get(pm, (5, 7, False))

        if is_instant:
            return {
                "payment_method": pm,
                "is_instant": True,
                "initiated_on": init_date.isoformat(),
                "min_days": 0,
                "max_days": 0,
                "timeline_desc": "Instant, within 2 hours",
                "timeline_desc_hi": "तुरंत, 2 घंटे के अंदर",
                "evidence": evidence_sections,
            }

        start_expected = add_business_days(init_date, min_days, self.holidays)
        end_expected = add_business_days(init_date, max_days, self.holidays)

        start_info = format_date_multilingual(start_expected)
        end_info = format_date_multilingual(end_expected)

        return {
            "payment_method": pm,
            "is_instant": False,
            "initiated_on": init_date.isoformat(),
            "min_days": min_days,
            "max_days": max_days,
            "earliest_date": start_expected.isoformat(),
            "latest_date": end_expected.isoformat(),
            "earliest_en": start_info["en"],
            "latest_en": end_info["en"],
            "earliest_hi": start_info["hi"],
            "latest_hi": end_info["hi"],
            "deadline_variants": end_info["all_variants"],
            "evidence": evidence_sections,
        }

    def check_warranty_assured(self, product_sku: str) -> Dict[str, Any]:
        """Verify brand warranty and ZentroMart Assured under WAR-1, WAR-2, and MKS-3."""
        prod = dataset_store.find_product(product_sku)
        if not prod:
            return {"found": False, "sku": product_sku}

        brand_warranty = int(prod.get("warranty_months") or 0)
        fulfilled_by = prod.get("fulfilled_by", "").strip()
        listing_assured = str(prod.get("assured", "")).lower() == "true"
        
        # MKS-3: ZentroMart Assured NEVER applies to marketplace sellers!
        is_marketplace = fulfilled_by != "ZentroMart"
        if is_marketplace:
            assured_applies = False
            evidence = ["WAR-1", "MKS-3"]
        else:
            assured_applies = listing_assured
            evidence = ["WAR-1", "WAR-2"] if listing_assured else ["WAR-1"]

        return {
            "found": True,
            "sku": product_sku,
            "title": prod.get("title", ""),
            "brand": prod.get("brand", ""),
            "brand_warranty_months": brand_warranty,
            "fulfilled_by": fulfilled_by,
            "is_marketplace": is_marketplace,
            "assured_applies": assured_applies,
            "assured_months": 12 if assured_applies else 0,
            "evidence": evidence,
        }


policy_engine = PolicyEngine()
