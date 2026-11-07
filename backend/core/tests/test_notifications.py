import pytest
from rest_framework.test import APIClient
from decimal import Decimal
from unittest.mock import patch

from core.models import AuditLog, LeaveRequest, Notification, NotificationTaskDismissal, Payroll


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


@pytest.mark.django_db
def test_dismissed_update_stays_hidden_and_does_not_delete_source(hr_user, teacher_employee):
    leave = LeaveRequest.objects.create(employee=teacher_employee, leave_type='sick', start_date='2026-01-01', end_date='2026-01-02', status='pending_hr')
    notification = Notification.objects.create(recipient=hr_user, title='Leave updated', source_type='leave', source_id=leave.pk)
    client = APIClient()
    client.force_authenticate(hr_user)
    for _ in range(2):
        assert client.post('/api/notifications/dismiss/', {'notification_id': notification.pk}, format='json').status_code == 204
    notification.refresh_from_db()
    assert notification.dismissed_at is not None
    assert notification.read_at is not None
    refreshed_client = APIClient()
    refreshed_client.force_authenticate(hr_user)
    assert refreshed_client.get('/api/notifications/').data['results'] == []
    assert refreshed_client.get('/api/notifications/summary/').data['unread_updates'] == 0
    assert AuditLog.objects.filter(user=hr_user, action=f'Dismissed notification {notification.pk}').count() == 1
    leave.refresh_from_db()
    assert leave.status == 'pending_hr'
    assert refreshed_client.post(f'/api/notifications/{notification.pk}/read/').status_code == 200
    assert refreshed_client.get('/api/notifications/').data['results'] == []


@pytest.mark.django_db
def test_cannot_dismiss_another_users_update(hr_user, superintendent_user):
    notification = Notification.objects.create(recipient=superintendent_user, title='Private')
    client = APIClient()
    client.force_authenticate(hr_user)
    assert client.post('/api/notifications/dismiss/', {'notification_id': notification.pk}, format='json').status_code == 404
    notification.refresh_from_db()
    assert notification.dismissed_at is None


@pytest.mark.django_db
def test_task_dismissal_is_private_persistent_and_keeps_pending_work(teacher_employee, hr_user, admin_user):
    leave = LeaveRequest.objects.create(employee=teacher_employee, leave_type='sick', start_date='2026-01-01', end_date='2026-01-02', status='pending_hr')
    task_key = f'leave:{leave.pk}'
    client = APIClient()
    client.force_authenticate(teacher_employee.user)
    assert client.post('/api/notifications/dismiss/', {'task_key': task_key}, format='json').status_code == 404
    client.force_authenticate(hr_user)
    for _ in range(2):
        assert client.post('/api/notifications/dismiss/', {'task_key': task_key}, format='json').status_code == 204
    refreshed_client = APIClient()
    refreshed_client.force_authenticate(hr_user)
    assert refreshed_client.get('/api/notifications/tasks/').data['results'] == []
    assert refreshed_client.get('/api/notifications/summary/').data['action_required'] == 0
    assert NotificationTaskDismissal.objects.filter(recipient=hr_user, task_key=task_key).count() == 1
    assert AuditLog.objects.filter(user=hr_user, action=f'Dismissed notification task {task_key}').count() == 1
    leave.refresh_from_db()
    assert leave.status == 'pending_hr'
    client.force_authenticate(admin_user)
    assert task_key in [row['key'] for row in client.get('/api/notifications/tasks/').data['results']]
    leave.status = 'approved'
    leave.save(update_fields=['status'])
    assert refreshed_client.post('/api/notifications/dismiss/', {'task_key': task_key}, format='json').status_code == 204


@pytest.mark.django_db
def test_dismissals_are_excluded_before_pagination(hr_user, teacher_employee):
    notifications = Notification.objects.bulk_create([Notification(recipient=hr_user, title=f'Update {i}') for i in range(12)])
    leaves = LeaveRequest.objects.bulk_create([
        LeaveRequest(employee=teacher_employee, leave_type='sick', start_date='2026-01-01', end_date='2026-01-02', status='pending_hr')
        for _ in range(12)
    ])
    client = APIClient()
    client.force_authenticate(hr_user)
    assert client.post('/api/notifications/dismiss/', {'notification_id': notifications[-1].pk}, format='json').status_code == 204
    assert client.post('/api/notifications/dismiss/', {'task_key': f'leave:{leaves[0].pk}'}, format='json').status_code == 204
    for endpoint in ('/api/notifications/', '/api/notifications/tasks/'):
        first = client.get(endpoint).data
        second = client.get(endpoint, {'page': 2}).data
        assert first['count'] == second['count'] == 11
        assert len(first['results']) == 10
        assert len(second['results']) == 1
    assert client.get('/api/notifications/summary/').data == {'unread_updates': 11, 'action_required': 11}


@pytest.mark.django_db
@pytest.mark.parametrize('stage', ['approval', 'release'])
def test_grouped_payroll_dismissal_keeps_other_cutoffs_visible(stage, superintendent_user, teacher_employee):
    from core.models import Role

    superintendent_user.role = Role.SUPERINTENDENT if stage == 'approval' else Role.ACCOUNTANT
    superintendent_user.save(update_fields=['role'])
    status = 'draft' if stage == 'approval' else 'approved'
    for cutoff in ('November 1-15, 2026', 'November 1-15, 2026', 'November 16-30, 2026'):
        Payroll.objects.create(employee=teacher_employee, cutoff_period=cutoff, status=status, basic_salary=Decimal('10000'), net_salary=Decimal('9000'))
    client = APIClient()
    client.force_authenticate(superintendent_user)
    task_key = f'payroll_{stage}:November 1-15, 2026'
    assert client.get('/api/notifications/tasks/').data['count'] == 2
    assert client.post('/api/notifications/dismiss/', {'task_key': task_key}, format='json').status_code == 204
    tasks = client.get('/api/notifications/tasks/').data
    assert tasks['count'] == 1
    assert tasks['results'][0]['key'] == f'payroll_{stage}:November 16-30, 2026'
    assert client.get('/api/notifications/summary/').data['action_required'] == 1
    assert Payroll.objects.filter(status=status).count() == 3


@pytest.mark.django_db
@pytest.mark.parametrize('payload,expected', [
    ({}, 400),
    ({'notification_id': 1, 'task_key': 'leave:1'}, 400),
    ({'notification_id': -1}, 400),
    ({'task_key': ''}, 400),
    ({'task_key': 'unknown:1'}, 404),
    ({'task_key': 'leave:not-a-number'}, 404),
])
def test_dismissal_validates_input(hr_user, payload, expected):
    client = APIClient()
    client.force_authenticate(hr_user)
    assert client.post('/api/notifications/dismiss/', payload, format='json').status_code == expected
    assert NotificationTaskDismissal.objects.count() == 0


@pytest.mark.django_db
def test_dismissal_requires_authentication():
    assert APIClient().post('/api/notifications/dismiss/', {'notification_id': 1}, format='json').status_code == 401


@pytest.mark.django_db
@pytest.mark.parametrize('task', [False, True])
def test_dismissal_rolls_back_when_audit_fails(task, hr_user, teacher_employee):
    if task:
        leave = LeaveRequest.objects.create(employee=teacher_employee, leave_type='sick', start_date='2026-01-01', end_date='2026-01-02', status='pending_hr')
        payload = {'task_key': f'leave:{leave.pk}'}
    else:
        notification = Notification.objects.create(recipient=hr_user, title='Update')
        payload = {'notification_id': notification.pk}
    client = APIClient()
    client.force_authenticate(hr_user)
    with patch('core.views.notification.AuditLog.objects.create', side_effect=RuntimeError('Audit unavailable')):
        with pytest.raises(RuntimeError, match='Audit unavailable'):
            client.post('/api/notifications/dismiss/', payload, format='json')
    assert NotificationTaskDismissal.objects.count() == 0
    if not task:
        notification.refresh_from_db()
        assert notification.dismissed_at is None
        assert notification.read_at is None
