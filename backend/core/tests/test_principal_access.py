from importlib import import_module

import pytest
from django.apps import apps
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from core.models import AuditLog, Employee, EmployeeDocument, LeaveRequest, Role, School


pytestmark = pytest.mark.django_db


@pytest.fixture
def client(supervisor_user):
    client = APIClient()
    client.force_authenticate(supervisor_user)
    return client


@pytest.fixture
def other_teacher():
    school = School.objects.create(name='Other school')
    return Employee.objects.create_with_user(
        {'username': 'other_teacher', 'password': None, 'role': Role.TEACHING},
        {'first_name': 'Other', 'last_name': 'Teacher', 'school': school},
    )


def test_principal_directory_and_details_are_school_scoped(client, teacher_employee, other_teacher, non_teaching_employee, supervisor_user):
    response = client.get('/api/employees/', {'exclude_self': 'true', 'directory': 'active'})
    assert response.status_code == 200
    assert [row['id'] for row in response.data['results']] == [teacher_employee.pk]
    assert response.data['count'] == response.data['summary']['total'] == 1
    assert response.data['summary']['roles'] == [Role.TEACHING]
    assert client.get(f'/api/employees/{teacher_employee.pk}/').status_code == 200
    assert client.get(f'/api/employees/{supervisor_user.employee_profile.pk}/').status_code == 200
    for employee in (other_teacher, non_teaching_employee):
        assert client.get(f'/api/employees/{employee.pk}/').status_code == 404
    assert client.get('/api/employees/', {'search': 'Other', 'role': Role.ADMINISTRATIVE}).data['count'] == 0
    assert not supervisor_user.is_management


@pytest.mark.parametrize('method,path,data', [
    ('post', '/api/employees/', {'first_name': 'New', 'last_name': 'Teacher'}),
    ('patch', '/api/employees/{teacher}/', {'salary': '999999', 'role': Role.HR}),
    ('delete', '/api/employees/{teacher}/', {}),
    ('post', '/api/employees/{teacher}/approve-registration/', {}),
    ('post', '/api/employees/{teacher}/resend-setup/', {}),
])
def test_principal_cannot_change_employee_or_account_records(client, teacher_employee, method, path, data):
    response = getattr(client, method)(path.format(teacher=teacher_employee.pk), data, format='json')
    assert response.status_code == 403
    teacher_employee.refresh_from_db()
    assert teacher_employee.user.role == Role.TEACHING


@pytest.mark.parametrize('path', [
    '/api/employees/pending-registrations/', '/api/employees/rejected-registrations/',
    '/api/employees/leave-staff/', '/api/audit-logs/', '/api/applicants/',
])
def test_principal_cannot_access_division_management(client, path):
    assert client.get(path).status_code == 403


def test_principal_without_school_cannot_view_teachers_or_process_leave(client, supervisor_user, teacher_employee):
    principal = supervisor_user.employee_profile
    principal.school = None
    principal.save(update_fields=['school'])
    leave = LeaveRequest.objects.create(employee=teacher_employee, workflow='teaching', assigned_principal=principal,
                                        leave_type='sick', start_date='2026-01-01', end_date='2026-01-02')
    assert client.get('/api/employees/').data['count'] == 0
    assert client.get(f'/api/employees/{teacher_employee.pk}/').status_code == 404
    assert client.get('/api/leaves/', {'scope': 'team'}).data['count'] == 0
    assert client.post(f'/api/leaves/{leave.pk}/reject/', {'disapproval_reason': 'No'}, format='json').status_code == 404
    assert not leave.can_process(supervisor_user)


def test_cross_school_assigned_leave_is_inaccessible(client, supervisor_user, other_teacher, teacher_employee):
    leave = LeaveRequest.objects.create(employee=other_teacher, workflow='teaching', assigned_principal=supervisor_user.employee_profile,
                                        leave_type='sick', start_date='2026-01-01', end_date='2026-01-02')
    assert not leave.can_process(supervisor_user)
    assert client.get(f'/api/leaves/{leave.pk}/').status_code == 404
    for endpoint, data in [('approve', {}), ('reject', {'disapproval_reason': 'No'}), ('return-for-correction', {'reason': 'Fix'})]:
        assert client.post(f'/api/leaves/{leave.pk}/{endpoint}/', data, format='json').status_code == 404
    assert client.get('/api/notifications/tasks/').data['results'] == []
    assert client.get('/api/notifications/summary/').data['action_required'] == 0
    leave.refresh_from_db()
    assert leave.status == 'pending_supervisor'


def test_school_queue_can_view_but_cannot_process_another_assigned_principals_leave(client, supervisor_user, teacher_employee, hr_user):
    leave = LeaveRequest.objects.create(employee=teacher_employee, workflow='teaching', assigned_principal=None,
                                        leave_type='sick', start_date='2026-01-01', end_date='2026-01-02')
    response = client.get(f'/api/leaves/{leave.pk}/')
    assert response.status_code == 200
    assert response.data['can_approve'] is False
    assert client.post(f'/api/leaves/{leave.pk}/reject/', {'disapproval_reason': 'No'}, format='json').status_code == 403


def test_hr_assigns_principal_school_and_supervisor(client, hr_user, teacher_employee, supervisor_user, other_teacher):
    client.force_authenticate(hr_user)
    principal = supervisor_user.employee_profile
    assert client.patch(f'/api/employees/{principal.pk}/', {'school': None}, format='json').status_code == 400
    assert client.patch(f'/api/employees/{other_teacher.pk}/', {'supervisor': principal.pk}, format='json').status_code == 400
    assert client.patch(f'/api/employees/{teacher_employee.pk}/', {'supervisor': principal.pk}, format='json').status_code == 200


def test_teaching_leave_cannot_use_cross_school_principal(client, supervisor_user, other_teacher):
    from .test_teaching_leave_workflow import application_data

    other_teacher.supervisor = supervisor_user.employee_profile
    other_teacher.save(update_fields=['supervisor'])
    client.force_authenticate(other_teacher.user)
    response = client.post('/api/leaves/', application_data(), format='json')
    assert response.status_code == 400
    assert LeaveRequest.objects.count() == 0


def test_principal_can_read_teacher_documents_but_cannot_modify_them(client, teacher_employee, other_teacher, supervisor_user):
    document = EmployeeDocument.objects.create(employee=teacher_employee, document_type='pds', file='teacher.pdf')
    other = EmployeeDocument.objects.create(employee=other_teacher, document_type='pds', file='other.pdf')
    response = client.get('/api/employee-documents/', {'employee': teacher_employee.pk})
    assert [row['id'] for row in response.data['results']] == [document.pk]
    assert client.get(f'/api/employee-documents/{document.pk}/').status_code == 200
    assert client.get(f'/api/employee-documents/{other.pk}/').status_code == 404
    assert client.get('/api/employee-documents/', {'employee': other_teacher.pk}).data['count'] == 0
    assert client.patch(f'/api/employee-documents/{document.pk}/', {'document_type': 'changed'}, format='json').status_code == 403
    assert client.delete(f'/api/employee-documents/{document.pk}/').status_code == 403
    assert client.post(f'/api/employee-documents/{document.pk}/verify/', {}, format='json').status_code == 403
    assert client.post('/api/employee-documents/', {'employee': teacher_employee.pk, 'document_type': 'pds',
                                                  'file': SimpleUploadedFile('test.pdf', b'PDF content')}, format='multipart').status_code == 403
    document.refresh_from_db()
    assert document.document_type == 'pds'
    assert document.employee_id == teacher_employee.pk


def test_migration_converts_principal_titles_without_promoting_other_staff(supervisor_user, hr_user, admin_user):
    migration = import_module('core.migrations.0026_principal_school_access')
    supervisor_user.role = Role.ADMINISTRATIVE
    supervisor_user.save(update_fields=['role'])
    migration.assign_principal_role(apps, None)
    supervisor_user.refresh_from_db()
    hr_user.refresh_from_db()
    admin_user.refresh_from_db()
    assert supervisor_user.role == Role.PRINCIPAL
    assert hr_user.role == Role.HR
    assert admin_user.is_superuser
    assert admin_user.role == Role.ADMINISTRATIVE


def test_principal_audit_and_login_role(supervisor_user, client):
    AuditLog.objects.create(user=supervisor_user, action='Principal action')
    assert AuditLog.objects.filter(user=supervisor_user, action='Principal action').exists()
    anonymous = APIClient()
    response = anonymous.post('/api/token/', {'username': supervisor_user.username, 'password': 'password123'}, format='json')
    assert response.status_code == 200
    assert response.data['role'] == Role.PRINCIPAL


def test_role_change_preserves_hr_awarded_principal_leave_credits(client, hr_user, supervisor_user):
    principal = supervisor_user.employee_profile
    vacation, sick = principal.vacation_leave_balance, principal.sick_leave_balance
    assert client.post('/api/employees/award_yearly_credits/').status_code == 403
    client.force_authenticate(hr_user)
    assert client.post('/api/employees/award_yearly_credits/').status_code == 200
    principal.refresh_from_db()
    assert principal.vacation_leave_balance == vacation + 15
    assert principal.sick_leave_balance == sick + 15
