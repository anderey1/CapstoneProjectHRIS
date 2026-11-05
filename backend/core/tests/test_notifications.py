import pytest
from rest_framework.test import APIClient
from core.models import Notification
from core.models import LeaveRequest


@pytest.mark.django_db
def test_notifications_are_private_and_read_state_persists(hr_user, superintendent_user):
    client = APIClient()
    own = Notification.objects.create(recipient=hr_user, title='Leave updated')
    other = Notification.objects.create(recipient=superintendent_user, title='Private update')
    client.force_authenticate(hr_user)
    result = client.get('/api/notifications/')
    assert result.status_code == 200
    assert [row['id'] for row in result.data['results']] == [own.pk]
    assert client.post(f'/api/notifications/{other.pk}/read/').status_code == 404
    assert client.post(f'/api/notifications/{own.pk}/read/').status_code == 200
    assert client.get('/api/notifications/').data['results'][0]['read_at'] is not None


@pytest.mark.django_db
def test_leave_rejection_notifies_applicant(hr_user, teacher_employee):
    leave = LeaveRequest.objects.create(employee=teacher_employee, leave_type='sick', start_date='2026-01-01', end_date='2026-01-02', status='pending_hr')
    client = APIClient()
    client.force_authenticate(hr_user)
    assert client.post(f'/api/leaves/{leave.pk}/reject/', {'disapproval_reason': 'Please revise'}, format='json').status_code == 200
    client.force_authenticate(teacher_employee.user)
    rows = client.get('/api/notifications/').data['results']
    assert len(rows) == 1
    assert rows[0]['source_id'] == leave.pk


@pytest.mark.django_db
def test_assigned_principal_sees_leave_task_and_applicant_does_not(teacher_employee, supervisor_user):
    leave = LeaveRequest.objects.create(employee=teacher_employee, leave_type='sick', start_date='2026-01-01', end_date='2026-01-02', status='pending_supervisor', workflow='teaching', assigned_principal=supervisor_user.employee_profile)
    client = APIClient()
    client.force_authenticate(supervisor_user)
    tasks = client.get('/api/notifications/tasks/')
    assert tasks.status_code == 200
    assert f'leave:{leave.pk}' in [row['key'] for row in tasks.data['results']]
    client.force_authenticate(teacher_employee.user)
    assert f'leave:{leave.pk}' not in [row['key'] for row in client.get('/api/notifications/tasks/').data['results']]
