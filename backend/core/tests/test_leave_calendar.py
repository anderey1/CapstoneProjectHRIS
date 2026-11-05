from datetime import date
from decimal import Decimal

import pytest
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError

from core.services.leave_calendar import count_leave_working_days, load_calendar


@pytest.mark.django_db
def test_submission_excludes_bonifacio_and_deducts_saved_days(non_teaching_employee, hr_user, superintendent_user, monkeypatch):
    monkeypatch.setattr('django.utils.timezone.localdate', lambda *args, **kwargs: date(2026, 11, 5))
    client = APIClient()
    client.force_authenticate(non_teaching_employee.user)
    response = client.post('/api/leaves/', {
        'leave_type': 'vacation', 'start_date': '2026-11-27', 'end_date': '2026-11-30',
        'working_days_applied': 99,
    })
    assert response.status_code == 201, response.data
    assert Decimal(response.data['working_days_applied']) == 1
    leave_id = response.data['id']
    client.force_authenticate(hr_user)
    assert client.post(f'/api/leaves/{leave_id}/approve/').status_code == 200
    client.force_authenticate(superintendent_user)
    assert client.post(f'/api/leaves/{leave_id}/approve/').status_code == 200
    non_teaching_employee.refresh_from_db()
    assert non_teaching_employee.vacation_leave_balance == 14


@pytest.mark.parametrize('start,end,expected', [
    ('2026-11-05', '2026-11-05', 1),
    ('2026-11-30', '2026-11-30', 0),
    ('2026-11-28', '2026-11-29', 0),
    ('2026-02-25', '2026-02-25', 1),
    ('2026-08-19', '2026-08-21', 0),
    ('2026-03-20', '2026-03-20', 0),
    ('2026-05-27', '2026-05-27', 0),
])
def test_reviewed_calendar_counts(start, end, expected):
    assert count_leave_working_days(date.fromisoformat(start), date.fromisoformat(end)) == expected


def test_missing_year_is_not_an_empty_calendar():
    with pytest.raises(ValidationError, match='2027'):
        count_leave_working_days(date(2026, 12, 29), date(2027, 1, 4))


@pytest.mark.parametrize('change', ['date', 'category', 'source', 'duplicate', 'malformed_date'])
def test_invalid_dataset_is_rejected(tmp_path, monkeypatch, change):
    import json
    calendar = load_calendar(2026)
    if change == 'duplicate':
        calendar['holidays'].append(calendar['holidays'][0].copy())
    else:
        field = 'date' if change == 'malformed_date' else change
        calendar['holidays'][0][field] = {'date': '2025-01-01', 'category': 'school_break', 'source': '', 'malformed_date': 'not-a-date'}[change]
    (tmp_path / '2026.json').write_text(json.dumps(calendar), encoding='utf-8')
    monkeypatch.setattr('core.services.leave_calendar.CALENDAR_DIR', tmp_path)
    with pytest.raises(ValidationError):
        load_calendar(2026)


@pytest.mark.django_db
def test_maternity_keeps_holiday_and_weekend_days(non_teaching_employee, monkeypatch, settings, tmp_path):
    from django.core.files.uploadedfile import SimpleUploadedFile
    settings.MEDIA_ROOT = tmp_path
    monkeypatch.setattr('django.utils.timezone.localdate', lambda *args, **kwargs: date(2026, 11, 5))
    client = APIClient()
    client.force_authenticate(non_teaching_employee.user)
    response = client.post('/api/leaves/', {
        'leave_type': 'maternity', 'start_date': '2026-11-27', 'end_date': '2026-11-30',
        'supporting_document': SimpleUploadedFile('proof.pdf', b'%PDF-1.7', content_type='application/pdf'),
    })
    assert response.status_code == 201, response.data
    assert Decimal(response.data['working_days_applied']) == 4


def test_duplicate_declarations_do_not_double_deduct(monkeypatch):
    calendar = load_calendar(2026)
    holiday = next(item for item in calendar['holidays'] if item['date'] == '2026-11-30')
    calendar['holidays'].append({**holiday, 'source': 'https://www.deped.gov.ph/another-declaration'})
    monkeypatch.setattr('core.services.leave_calendar.load_calendar', lambda year: calendar)
    assert count_leave_working_days(date(2026, 11, 27), date(2026, 11, 30)) == 1


@pytest.mark.django_db
def test_calendar_endpoint_authentication_and_year_validation(non_teaching_employee):
    client = APIClient()
    assert client.get('/api/leaves/calendar/?year=2026').status_code == 401
    client.force_authenticate(non_teaching_employee.user)
    response = client.get('/api/leaves/calendar/?year=2026')
    assert response.status_code == 200
    assert response.data['timezone'] == 'Asia/Manila'
    assert response.data['coverage'] == 'reviewed'
    assert 'results' not in response.data
    for year in ('', 'bad', '2027', '../2026', '0'):
        assert client.get('/api/leaves/calendar/', {'year': year}).status_code == 400


@pytest.mark.django_db
@pytest.mark.parametrize('kind,start,end,status,days', [
    ('sick', '2026-11-05', '2026-11-05', 400, None),
    ('emergency', '2026-11-05', '2026-11-05', 400, None),
    ('vacation', '2026-11-05', '2026-11-05', 400, None),
    ('vacation', '2026-11-09', '2026-11-09', 400, None),
    ('vacation', '2026-11-10', '2026-11-10', 201, 1),
    ('vacation', '2026-11-30', '2026-11-30', 400, None),
    ('sick', '2026-10-06', '2026-10-06', 201, 1),
    ('sick', '2026-10-05', '2026-10-05', 400, None),
    ('forced', '2026-12-29', '2027-01-04', 400, None),
    ('adoption', '2026-11-27', '2026-11-30', 201, 4),
])
def test_submission_date_boundaries(non_teaching_employee, monkeypatch, kind, start, end, status, days):
    monkeypatch.setattr('django.utils.timezone.localdate', lambda *args, **kwargs: date(2026, 11, 5))
    client = APIClient()
    client.force_authenticate(non_teaching_employee.user)
    response = client.post('/api/leaves/', {'leave_type': kind, 'start_date': start, 'end_date': end})
    assert response.status_code == status, response.data
    if days is not None:
        assert Decimal(response.data['working_days_applied']) == days


@pytest.mark.django_db
def test_disapproval_keeps_balance(non_teaching_employee, hr_user, monkeypatch):
    monkeypatch.setattr('django.utils.timezone.localdate', lambda *args, **kwargs: date(2026, 11, 5))
    client = APIClient()
    client.force_authenticate(non_teaching_employee.user)
    created = client.post('/api/leaves/', {'leave_type': 'vacation', 'start_date': '2026-11-27', 'end_date': '2026-11-30'})
    client.force_authenticate(hr_user)
    assert client.post(f"/api/leaves/{created.data['id']}/reject/", {'disapproval_reason': 'Coverage needed'}).status_code == 200
    non_teaching_employee.refresh_from_db()
    assert non_teaching_employee.vacation_leave_balance == 15


@pytest.mark.django_db
@pytest.mark.parametrize('kind,start,end,status', [
    ('sick', '2026-11-05', '2026-11-06', 400),
    ('sick', '2026-11-04', '2026-11-05', 400),
    ('emergency', '2026-11-05', '2026-11-06', 400),
    ('rehabilitation', '2026-11-05', '2026-11-06', 400),
    ('maternity', '2026-11-05', '2026-11-06', 400),
    ('adoption', '2026-11-05', '2026-11-06', 400),
    ('sick', '2026-11-06', '2026-11-06', 201),
    ('sick', '2026-11-04', '2026-11-04', 201),
])
def test_filing_today_cannot_select_today(non_teaching_employee, monkeypatch, kind, start, end, status):
    monkeypatch.setattr('django.utils.timezone.localdate', lambda *args, **kwargs: date(2026, 11, 5))
    client = APIClient()
    client.force_authenticate(non_teaching_employee.user)
    response = client.post('/api/leaves/', {'leave_type': kind, 'start_date': start, 'end_date': end})
    assert response.status_code == status, response.data
    if status == 400:
        assert "Today's date cannot be selected" in str(response.data)
