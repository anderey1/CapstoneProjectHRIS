import re
from unittest.mock import patch
import pytest
from django.core import mail, signing
from django.test import override_settings
from rest_framework.test import APIClient
from core.models import Employee, Notification
from core.services.employee_accounts import SETUP_SALT, rotate_setup

pytestmark = pytest.mark.django_db

@pytest.fixture
def client(hr_user):
    client = APIClient()
    client.force_authenticate(hr_user)
    return client

@pytest.fixture
def pending(client):
    public = APIClient()
    response = public.post('/api/employees/register-existing/', dict(first_name='Existing', last_name='Teacher', department='School', position='Teacher I', role='TEACHING', username='existing_teacher', email='teacher@example.com', password='original-password-723!'), format='json')
    assert response.status_code == 201, response.data
    return Employee.objects.get(user__username='existing_teacher')

@pytest.fixture(autouse=True)
def email_backend(settings):
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'


def test_registration_notifies_hr_and_directory_excludes_pending(client, pending, hr_user):
    assert not pending.user.is_active
    assert Notification.objects.filter(recipient=hr_user, source_type='registration', source_id=pending.pk).count() == 1
    assert client.get('/api/employees/?directory=active').data['count'] == 0
    assert client.get('/api/employees/').data['count'] == 1
    assert client.get('/api/notifications/summary/').data['action_required'] >= 1


def test_approve_preserves_password_and_emails(client, pending):
    response = client.post(f'/api/employees/{pending.pk}/approve-registration/')
    assert response.status_code == 200
    pending.refresh_from_db()
    assert pending.registration_status == 'approved'
    assert pending.user.is_active and pending.user.check_password('original-password-723!')
    assert len(mail.outbox) == 1
    assert client.post(f'/api/employees/{pending.pk}/approve-registration/').status_code == 400
    assert len(mail.outbox) == 1


def test_reject_retains_reason_record_and_excludes_tasks(client, pending, hr_user):
    url = f'/api/employees/{pending.pk}/reject-registration/'
    assert client.post(url, {}, format='json').status_code == 400
    assert client.post(url, {'reason': '   '}, format='json').status_code == 400
    response = client.post(url, {'reason': 'Employment could not be verified.'}, format='json')
    assert response.status_code == 200
    pending.refresh_from_db()
    assert pending.registration_status == 'rejected'
    assert pending.reviewed_by == hr_user
    assert pending.reviewed_at
    assert not pending.user.is_active
    assert pending.rejection_reason in mail.outbox[0].body
    assert client.get('/api/employees/rejected-registrations/').data['count'] == 1
    assert client.get('/api/employees/pending-registrations/').data['count'] == 0
    assert client.get('/api/notifications/tasks/').data['results'] == []
    assert client.post(f'/api/employees/{pending.pk}/approve-registration/').status_code == 400


def add_account(client):
    response = client.post('/api/employees/', dict(first_name='Added', last_name='Employee', username='added_employee', email='added@example.com', role='TEACHING', send_setup_email=True), format='json')
    assert response.status_code == 201, response.data
    return Employee.objects.get(pk=response.data['id']), response


def setup_token():
    return re.search(r'setup-password\?token=(\S+)', mail.outbox[-1].body).group(1)


def test_setup_single_use_and_resend(client):
    employee, response = add_account(client)
    assert response.data['email_delivery'] == 'sent'
    assert employee.user.is_active and not employee.user.has_usable_password()
    assert employee.email == employee.user.email == 'added@example.com'
    old_token = setup_token()
    assert client.post(f'/api/employees/{employee.pk}/resend-setup/').status_code == 200
    token = setup_token()
    public = APIClient()
    url = '/api/password-setup/'
    assert public.post(url, {'token': old_token, 'password': 'Strong-setup-739!'}, format='json').status_code == 400
    assert public.post(url, {'token': token, 'password': '123'}, format='json').status_code == 400
    assert public.post(url, {'token': token, 'password': 'Strong-setup-739!'}, format='json').status_code == 200
    assert public.post(url, {'token': token, 'password': 'Other-password-47!'}, format='json').status_code == 400
    employee.user.refresh_from_db()
    assert employee.user.check_password('Strong-setup-739!')
    assert client.post(f'/api/employees/{employee.pk}/resend-setup/').status_code == 400


def test_expired_and_tampered_setup(client):
    employee, _ = add_account(client)
    with patch('django.core.signing.time.time', return_value=1):
        token = rotate_setup(employee)
    public = APIClient()
    for candidate in [token, token + 'tampered']:
        assert public.post('/api/password-setup/', {'token': candidate, 'password': 'Strong-setup-739!'}, format='json').status_code == 400


def test_email_failure_does_not_rollback(client, pending):
    with patch('core.services.employee_accounts.send_mail', side_effect=RuntimeError('offline')):
        response = client.post(f'/api/employees/{pending.pk}/approve-registration/')
        assert response.status_code == 200 and response.data['email_delivery'] == 'failed'
        employee, response = add_account(client)
        assert response.data['email_delivery'] == 'failed'
        assert employee.user.is_active
    pending.refresh_from_db()
    assert pending.registration_status == 'approved'


def test_console_delivery_reported(client):
    with override_settings(EMAIL_BACKEND='django.core.mail.backends.console.EmailBackend'):
        _, response = add_account(client)
    assert response.data['email_delivery'] == 'console'


def test_employee_cannot_manage_accounts(client, pending):
    client.force_authenticate(pending.user)
    for action in ['approve-registration', 'reject-registration', 'resend-setup']:
        assert client.post(f'/api/employees/{pending.pk}/{action}/', {'reason': 'no'}, format='json').status_code == 403
    assert client.get('/api/employees/rejected-registrations/').status_code == 403


def test_legacy_creation_and_duplicate_setup(client):
    employee, _ = add_account(client)
    response = client.post('/api/employees/', dict(first_name='Other', last_name='Employee', username='different', email=employee.user.email.upper(), send_setup_email=True), format='json')
    assert response.status_code == 400
    response = client.post('/api/employees/', dict(first_name='Legacy', last_name='Employee', username='legacy_employee', password='initial-password-384!', email='legacy@example.com'), format='json')
    assert response.status_code == 201
    employee = Employee.objects.get(pk=response.data['id'])
    assert employee.user.check_password('initial-password-384!')


def test_setup_inactive_account_cannot_use_link(client):
    employee, _ = add_account(client)
    token = setup_token()
    employee.user.is_active = False
    employee.user.save(update_fields=['is_active'])
    assert APIClient().post('/api/password-setup/', {'token': token, 'password': 'Strong-setup-739!'}, format='json').status_code == 400


def test_audit_failure_rolls_back_creation_and_sends_no_email(client):
    from core.models import User
    with patch('core.views.employee.viewset.AuditLog.objects.create', side_effect=RuntimeError('audit unavailable')):
        with pytest.raises(RuntimeError):
            add_account(client)
    assert not User.objects.filter(username='added_employee').exists()
    assert not Employee.objects.filter(first_name='Added').exists()
    assert not getattr(mail, 'outbox', [])


def test_migration_backfills_existing_accounts(client, pending, teacher_employee):
    from importlib import import_module
    from django.apps import apps
    module = import_module('core.migrations.0024_employee_registration_status_and_more')
    pending.registration_status = 'none'
    pending.save(update_fields=['registration_status'])
    module.populate_status(apps, None)
    pending.refresh_from_db()
    teacher_employee.refresh_from_db()
    assert pending.registration_status == 'pending'
    assert teacher_employee.registration_status == 'approved'
