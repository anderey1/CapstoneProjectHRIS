from importlib import import_module
from types import SimpleNamespace
from decimal import Decimal

import pytest
from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from rest_framework.test import APIClient

from core.models import AuditLog, Employee, Payroll, Role


pytestmark = pytest.mark.django_db
User = get_user_model()


def test_superuser_has_no_staff_role_and_login_preserves_it(admin_user):
    assert admin_user.role == ''
    admin_user.full_clean()
    assert admin_user.is_management
    client = APIClient()
    response = client.post('/api/token/', {'username': 'admin', 'password': 'password123'})
    assert response.status_code == 200
    assert response.data['role'] == ''
    assert response.data['is_superuser'] is True
    AuditLog.objects.create(user=admin_user, action='System configuration')
    assert AuditLog.objects.filter(user=admin_user, action='System configuration').exists()


def test_non_superuser_requires_staff_role():
    user = User(username='no_role', role='')
    with pytest.raises(ValidationError):
        user.full_clean()
    with transaction.atomic(), pytest.raises(IntegrityError):
        User.objects.create_user(username='no_role', role='')


@pytest.mark.parametrize('path', [
    '/api/schools/', '/api/employees/', '/api/audit-logs/',
    '/api/applicants/', '/api/dashboard/operations/',
])
def test_roleless_superuser_keeps_management_access(admin_user, path):
    client = APIClient()
    client.force_authenticate(admin_user)
    assert client.get(path).status_code == 200


@pytest.mark.parametrize('role', ['ADMINISTRATIVE', ''])
def test_removed_or_blank_staff_role_cannot_be_assigned(hr_user, role):
    client = APIClient()
    client.force_authenticate(hr_user)
    response = client.post('/api/employees/', {
        'first_name': 'Invalid', 'last_name': 'Role', 'role': role,
        'username': 'invalid_role', 'password': 'password123',
    }, format='json')
    assert response.status_code == 400
    assert not User.objects.filter(username='invalid_role').exists()


def test_staff_roles_remain_separate():
    assert 'ADMINISTRATIVE' not in Role.values
    assert {Role.HR, Role.ACCOUNTANT, Role.NON_TEACHING}.issubset(Role.values)
    assert User.objects.create_superuser(username='new_it', password=None).role == ''


def test_role_data_migration_removes_elena_and_preserves_other_accounts(admin_user, hr_user, teacher_employee):
    migration = import_module('core.migrations.0027_remove_administrative_role')
    admin_user.role = 'ADMINISTRATIVE'
    admin_user.save(update_fields=['role'])
    elena = User.objects.create_user(username='elena.torres', role='ADMINISTRATIVE')
    employee = Employee.objects.create(user=elena, first_name='Elena', last_name='Torres')
    payroll = Payroll.objects.create(employee=employee, basic_salary=Decimal('20402'), status='released')
    # Preserve the historical audit entry even when its actor is deleted.
    AuditLog.objects.bulk_create([AuditLog(user=elena, action='Historical action')])
    other = User.objects.create_user(username='other_legacy', role='ADMINISTRATIVE')
    editor = SimpleNamespace(connection=SimpleNamespace(alias='default'))
    migration.remove_administrative_role(apps, editor)
    migration.remove_administrative_role(apps, editor)
    admin_user.refresh_from_db()
    other.refresh_from_db()
    hr_user.refresh_from_db()
    assert admin_user.is_superuser and admin_user.role == ''
    assert other.role == Role.NON_TEACHING and not other.is_management
    assert hr_user.role == Role.HR
    assert not User.objects.filter(username='elena.torres').exists()
    assert not Employee.objects.filter(pk=employee.pk).exists()
    assert not Payroll.objects.filter(pk=payroll.pk).exists()
    assert Employee.objects.filter(pk=teacher_employee.pk).exists()
    assert AuditLog.objects.filter(action='Historical action', user=None).exists()
