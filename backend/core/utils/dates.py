from django.utils import timezone
from datetime import datetime


def calculate_working_days(start_date, end_date):
    """
    Calculates the number of working days (Mon-Fri) between two dates inclusive.
    Pure python implementation to avoid extra dependencies.
    """
    import datetime
    day_count = 0
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5: # 0-4 is Mon-Fri
            day_count += 1
        current_date += datetime.timedelta(days=1)
    return day_count


def parse_cutoff_dates(cutoff_string):
    """
    Parses string like "May 1-15, 2026" or "May 1-15 (1st Quatrain)"
    Returns (start_date, end_date) as datetime.date objects.
    """
    import re
    from datetime import date

    # Try to extract Month, Day1, Day2, and Year
    # Supports "May 1-15, 2026" and "May 1-15 (1st Quatrain)" with Year extracted from context if missing
    pattern = r"([A-Za-z]+)\s+(\d+)-(\d+)(?:,\s+(\d{4}))?"
    match = re.search(pattern, cutoff_string)

    if not match:
        return None, None

    month_name = match.group(1)
    day1 = int(match.group(2))
    day2 = int(match.group(3))
    year = int(match.group(4)) if match.group(4) else timezone.now().year

    try:
        month_num = datetime.strptime(month_name[:3], "%b").month
        start_date = date(year, month_num, day1)
        end_date = date(year, month_num, day2)
        return start_date, end_date
    except Exception:
        return None, None
