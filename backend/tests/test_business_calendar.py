"""Business calendar unit tests verifying Monday-Saturday, Sunday exclusion, and holiday skipping."""
from datetime import date
import pytest

from app.core.business_calendar import (
    parse_date,
    is_sunday,
    is_business_day,
    add_business_days,
    add_calendar_days,
    count_business_days,
    format_date_multilingual,
)

HOLIDAYS = {"2026-08-15", "2026-10-02", "2026-10-19", "2026-11-09"}


def test_sunday_exclusion():
    # 2026-10-18 is Sunday
    sun = date(2026, 10, 18)
    assert is_sunday(sun) is True
    assert is_business_day(sun, HOLIDAYS) is False

    # 2026-10-17 is Saturday (Business day in ZentroMart)
    sat = date(2026, 10, 17)
    assert is_sunday(sat) is False
    assert is_business_day(sat, HOLIDAYS) is True


def test_holiday_skipping():
    # 2026-10-19 is Monday, warehouse closure holiday
    hol = date(2026, 10, 19)
    assert is_business_day(hol, HOLIDAYS) is False


def test_add_business_days_exact_scenario():
    # Scenario from PQ0008: Credit card refund started 2026-10-17 (Saturday).
    # Card takes 5 to 7 business days.
    # Day 1: Tue 2026-10-20 (since Sun 18 skip, Mon 19 holiday skip)
    # Day 2: Wed 2026-10-21
    # Day 3: Thu 2026-10-22
    # Day 4: Fri 2026-10-23
    # Day 5: Sat 2026-10-24
    # Sun 25 skip
    # Day 6: Mon 2026-10-26
    # Day 7: Tue 2026-10-27
    start = date(2026, 10, 17)
    day5 = add_business_days(start, 5, HOLIDAYS)
    day7 = add_business_days(start, 7, HOLIDAYS)

    assert day5 == date(2026, 10, 24)
    assert day7 == date(2026, 10, 27)


def test_add_calendar_days_return_window():
    # Delivered 2026-10-14, 30 days festive window (RET-8)
    deliv = date(2026, 10, 14)
    deadline = add_calendar_days(deliv, 30)
    assert deadline == date(2026, 11, 13)


def test_format_date_multilingual():
    d = date(2026, 10, 27)
    formatted = format_date_multilingual(d)
    assert formatted["iso"] == "2026-10-27"
    assert formatted["en"] == "27 October 2026"
    assert formatted["hi"] == "27 अक्टूबर 2026"
