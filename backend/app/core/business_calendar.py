"""Business calendar utilities adhering to ZentroMart policies.

Rules:
- Fixed reference date: 20 October 2026.
- Business days: Monday through Saturday.
- Non-business days: Sundays and warehouse holidays listed in data/holidays.csv.
- Return windows: Calendar days.
- Refund and logistics timelines: Business days.
"""
from datetime import date, datetime, timedelta
from typing import Set, List, Optional

MONTH_NAMES_EN = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

MONTH_NAMES_HI = [
    "", "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
]


def parse_date(date_val: str | date | datetime) -> date:
    """Parse date string in YYYY-MM-DD or ISO timestamp into datetime.date."""
    if isinstance(date_val, datetime):
        return date_val.date()
    if isinstance(date_val, date):
        return date_val
    val_str = str(date_val).strip()
    if "T" in val_str:
        val_str = val_str.split("T")[0]
    elif " " in val_str:
        val_str = val_str.split(" ")[0]
    return datetime.strptime(val_str, "%Y-%m-%d").date()


def is_sunday(d: date) -> bool:
    """Return True if date is a Sunday (weekday() == 6)."""
    return d.weekday() == 6


def is_holiday(d: date, holidays: Set[str]) -> bool:
    """Return True if date string is in the holidays set."""
    return d.isoformat() in holidays


def is_business_day(d: date, holidays: Set[str]) -> bool:
    """A business day is Monday to Saturday, excluding warehouse holidays."""
    if is_sunday(d):
        return False
    if is_holiday(d, holidays):
        return False
    return True


def add_business_days(start_date: date | str, days: int, holidays: Set[str]) -> date:
    """Add N business days to start_date, counting Mon-Sat and skipping holidays.
    
    If days == 0, returns start_date.
    The start day itself is not counted as day 1 (counting begins on the next day).
    """
    current = parse_date(start_date)
    added = 0
    while added < days:
        current += timedelta(days=1)
        if is_business_day(current, holidays):
            added += 1
    return current


def count_business_days(start_date: date | str, end_date: date | str, holidays: Set[str]) -> int:
    """Count business days between start_date (exclusive) and end_date (inclusive)."""
    current = parse_date(start_date)
    target = parse_date(end_date)
    if current >= target:
        return 0
    count = 0
    while current < target:
        current += timedelta(days=1)
        if is_business_day(current, holidays):
            count += 1
    return count


def add_calendar_days(start_date: date | str, days: int) -> date:
    """Add N calendar days to start_date."""
    return parse_date(start_date) + timedelta(days=days)


def format_date_multilingual(d: date | str) -> dict:
    """Return formatted date strings across English, ISO, and Hindi formats."""
    d_obj = parse_date(d)
    day = d_obj.day
    month_en = MONTH_NAMES_EN[d_obj.month]
    month_hi = MONTH_NAMES_HI[d_obj.month]
    year = d_obj.year
    
    return {
        "iso": d_obj.isoformat(),
        "en": f"{day} {month_en} {year}",
        "hi": f"{day} {month_hi} {year}",
        "all_variants": [
            d_obj.isoformat(),
            f"{day} {month_en} {year}",
            f"{day} {month_hi} {year}",
            f"{day:02d} {month_en} {year}",
            f"{day:02d} {month_hi} {year}"
        ]
    }
