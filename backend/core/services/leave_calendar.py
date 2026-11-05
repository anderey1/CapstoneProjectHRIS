"""Reviewed public holidays for the Lucena division's Monday-Friday schedule."""
import json
from datetime import date
from pathlib import Path
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from core.utils.dates import calculate_working_days

CALENDAR_DIR = Path(__file__).resolve().parent.parent / 'data' / 'leave_calendar'
NON_WORKING = {'regular', 'special_non_working'}


def load_calendar(year):
    if not isinstance(year, int) or not 1900 <= year <= 9999:
        raise ValidationError('Enter a valid calendar year.')
    path = CALENDAR_DIR / f'{year}.json'
    if not path.exists():
        raise ValidationError(f'Leave calendar for {year} is not available. Ask HR to update the reviewed calendar.')
    try:
        with path.open(encoding='utf-8') as stream:
            data = json.load(stream)
        _validate_calendar(data, year)
    except (ValueError, KeyError, TypeError, AttributeError, OSError) as error:
        raise ValidationError(f'Invalid holiday data in calendar {year}. Ask HR to update it.') from error
    return data


def _validate_calendar(data, year):
    if data['year'] != year or data['coverage'] != 'reviewed' or not data['version']:
        raise ValidationError(f'Leave calendar for {year} has not been reviewed.')
    date.fromisoformat(data['reviewed_at'])
    seen = set()
    for holiday in data['holidays']:
        parsed = date.fromisoformat(holiday['date'])
        identity = (holiday['date'], holiday['scope'], holiday['source'])
        if (parsed.year != year or holiday['category'] not in NON_WORKING | {'special_working'}
                or holiday['scope'] not in {'national', 'lucena'}
                or not holiday['label'] or not holiday['source'].startswith('https://')
                or identity in seen):
            raise ValidationError(f'Invalid holiday record in calendar {year}.')
        seen.add(identity)


def calendar_response(year):
    return {**load_calendar(year), 'today': timezone.localdate(timezone=ZoneInfo('Asia/Manila')).isoformat(),
            'timezone': 'Asia/Manila', 'location': 'lucena'}


def count_leave_working_days(start, end):
    if start > end:
        return 0
    excluded = set()
    for year in range(start.year, end.year + 1):
        for holiday in load_calendar(year)['holidays']:
            day = date.fromisoformat(holiday['date'])
            if holiday['category'] in NON_WORKING and start <= day <= end:
                excluded.add(day)
    return calculate_working_days(start, end) - sum(day.weekday() < 5 for day in excluded)
