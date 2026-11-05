from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from core.models import LeaveAction, LeaveRequest


@pytest.mark.django_db
def test_superintendent_can_approve_only_once_at_final_stage(non_teaching_employee, superintendent_user):
    leave = LeaveRequest.objects.create(
        employee=non_teaching_employee, leave_type='vacation', workflow='standard',
        status='pending_superintendent', start_date='2026-11-09', end_date='2026-11-09',
        working_days_applied=Decimal('1.0'),
    )
    client = APIClient()
    client.force_authenticate(superintendent_user)
    url = f'/api/leaves/{leave.pk}/approve/'
    first = client.post(url, {'expected_status': 'pending_superintendent'}, format='json')
    assert first.status_code == 200
    assert first.data['status'] == 'approved'
    second = client.post(url, {'expected_status': 'pending_superintendent'}, format='json')
    assert second.status_code == 400
    non_teaching_employee.refresh_from_db()
    assert non_teaching_employee.vacation_leave_balance == Decimal('14.0')
    assert LeaveAction.objects.filter(leave=leave, to_status='approved').count() == 1
    listed = client.get('/api/leaves/').data['results']
    assert next(row for row in listed if row['id'] == leave.pk)['can_approve'] is False


@pytest.mark.django_db
@pytest.mark.parametrize('stage', ['pending_supervisor', 'pending_hr', 'approved', 'rejected'])
def test_superintendent_cannot_approve_other_stages(non_teaching_employee, superintendent_user, stage):
    leave = LeaveRequest.objects.create(
        employee=non_teaching_employee, leave_type='vacation', workflow='standard',
        status=stage, start_date='2026-11-09', end_date='2026-11-09', working_days_applied=Decimal('1.0'),
    )
    client = APIClient()
    client.force_authenticate(superintendent_user)
    response = client.post(f'/api/leaves/{leave.pk}/approve/', {}, format='json')
    assert response.status_code in (400, 403, 404)
    non_teaching_employee.refresh_from_db()
    assert non_teaching_employee.vacation_leave_balance == Decimal('15.0')
    assert LeaveAction.objects.filter(leave=leave).count() == 0
