from decimal import Decimal
from unittest.mock import Mock, patch

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from core.models import Attendance, AuditLog, Employee, Payroll, Role, School
from core.services.dashboard_analytics import operational_dashboard


pytestmark = pytest.mark.django_db


def authenticated(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_dashboard_requires_login():
    assert APIClient().get('/api/dashboard/operations/').status_code == 401


def test_personal_dashboard_never_counts_other_employees(teacher_employee, non_teaching_employee):
    Attendance.objects.create(employee=teacher_employee, date='2026-05-01', is_dtr_approved=True)
    Attendance.objects.create(employee=non_teaching_employee, date='2026-05-01', is_dtr_approved=False)
    data = authenticated(teacher_employee.user).get('/api/dashboard/operations/').json()
    assert data['scope'] == 'personal'
    charts = {chart['key']: chart for chart in data['charts']}
    assert 'workforce' not in charts and 'recruitment' not in charts
    assert charts['attendance']['total'] == 1
    assert charts['attendance']['data'][1]['value'] == 0
    assert authenticated(teacher_employee.user).get('/api/dashboard/operations/insight/workforce/').status_code == 404


def test_finance_dashboard_only_exposes_finance_charts():
    user = get_user_model().objects.create_user(username='finance_dashboard', role=Role.ACCOUNTANT)
    data = operational_dashboard(user)
    assert [chart['key'] for chart in data['charts']] == ['payroll', 'payroll_status', 'loans']
    assert data['kpi_keys'] == ['payroll', 'payroll_status', 'loans']
    assert authenticated(user).get('/api/dashboard/operations/insight/recruitment/').status_code == 404


@pytest.mark.parametrize('role, expected_scope, expected_charts, expected_kpis', [
    (Role.HR, 'division',
     ['workforce', 'attendance', 'leaves', 'recruitment', 'stations', 'loans', 'payroll_status', 'payroll', 'performance'],
     ['workforce', 'attendance', 'leaves', 'recruitment']),
    (Role.SUPERINTENDENT, 'division',
     ['workforce', 'leaves', 'payroll_status', 'attendance', 'loans', 'performance', 'recruitment', 'stations', 'payroll'],
     ['workforce', 'leaves', 'payroll_status', 'loans']),
    (Role.PRINCIPAL, 'personal',
     ['attendance', 'leaves', 'loans', 'payroll_status', 'payroll', 'performance'],
     ['leaves', 'attendance', 'loans', 'payroll']),
    (Role.TEACHING, 'personal',
     ['attendance', 'leaves', 'loans', 'payroll_status', 'payroll', 'performance'],
     ['leaves', 'attendance', 'loans', 'payroll']),
    (Role.NON_TEACHING, 'personal',
     ['attendance', 'leaves', 'loans', 'payroll_status', 'payroll', 'performance'],
     ['leaves', 'attendance', 'loans', 'payroll']),
])
def test_dashboard_layout_is_role_specific(role, expected_scope, expected_charts, expected_kpis):
    user = get_user_model().objects.create_user(username=f'layout_{role.lower()}', role=role)
    data = operational_dashboard(user)
    assert data['scope'] == expected_scope
    assert [chart['key'] for chart in data['charts']] == expected_charts
    assert data['kpi_keys'] == expected_kpis


def test_superuser_dashboard_layout(admin_user):
    data = operational_dashboard(admin_user)
    assert data['scope'] == 'system'
    assert [chart['key'] for chart in data['charts']] == [
        'accounts', 'registrations', 'audit_activity', 'school_configuration', 'account_status', 'workforce'
    ]
    assert data['kpi_keys'] == ['accounts', 'registrations', 'audit_activity', 'school_configuration']


def test_superuser_dashboard_charts_use_system_records(admin_user, mock_school):
    User = get_user_model()
    pending_user = User.objects.create_user(username='pending_account', role=Role.TEACHING, is_active=False)
    Employee.objects.create(user=pending_user, first_name='Pending', last_name='Employee',
                            school=mock_school, salary=Decimal('10000'), registration_status='pending')
    rejected_user = User.objects.create_user(username='rejected_account', role=Role.NON_TEACHING, is_active=False)
    Employee.objects.create(user=rejected_user, first_name='Rejected', last_name='Employee',
                            school=mock_school, salary=Decimal('10000'), registration_status='rejected')
    School.objects.create(name='Unassigned School')
    AuditLog.objects.create(user=admin_user, action='Test audit entry')

    charts = {chart['key']: chart for chart in operational_dashboard(admin_user)['charts']}
    account_rows = {row['name']: row['value'] for row in charts['accounts']['data']}
    assert account_rows['System Administrator'] == 1
    assert account_rows['Teaching Staff'] == 1
    assert account_rows['Non-Teaching Staff'] == 1

    status_rows = {row['name']: row['value'] for row in charts['account_status']['data']}
    assert status_rows == {'Active accounts': 1, 'Inactive accounts': 2}

    registration_rows = {row['name']: row['value'] for row in charts['registrations']['data']}
    assert registration_rows == {'Pending': 1, 'Rejected': 1}

    school_rows = {row['name']: row['value'] for row in charts['school_configuration']['data']}
    assert school_rows == {
        'Schools with assigned personnel': 1,
        'Schools without assigned personnel': 1,
    }

    assert charts['audit_activity']['total'] == 1


def test_workforce_includes_management_roles(hr_user, teacher_employee):
    Employee.objects.create(user=hr_user, first_name='HR', last_name='Officer', salary=Decimal('27000'))
    chart = next(c for c in operational_dashboard(hr_user)['charts'] if c['key'] == 'workforce')
    assert chart['total'] == 3  # Teacher fixture also creates its principal.
    assert {row['name'] for row in chart['data']} == {'Teaching Staff', 'School Principal', 'HR Staff'}


def test_payroll_chart_only_uses_released_records_and_sums_net_pay(hr_user, teacher_employee):
    payroll = Payroll.objects.create(employee=teacher_employee, basic_salary=Decimal('27000'), status='released')
    Payroll.objects.create(employee=teacher_employee, basic_salary=Decimal('40000'), status='draft')
    chart = next(c for c in operational_dashboard(hr_user)['charts'] if c['key'] == 'payroll')
    assert len(chart['data']) == 1
    assert Decimal(chart['data'][0]['value']) == payroll.net_salary


def test_missing_profile_returns_empty_personal_data():
    user = get_user_model().objects.create_user(username='no_profile', role=Role.TEACHING)
    assert all(Decimal(str(chart['total'])) == 0 for chart in operational_dashboard(user)['charts'])


def test_missing_ai_key_is_honest_fallback(hr_user, monkeypatch):
    monkeypatch.delenv('GEMINI_API_KEY', raising=False)
    response = authenticated(hr_user).get('/api/dashboard/operations/insight/workforce/')
    assert response.status_code == 200
    assert response.data['source'] == 'data'
    assert response.data['available'] is False


def test_ai_failure_does_not_claim_success(hr_user, monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only')
    with patch('core.views.dashboard_operations.genai.Client', side_effect=RuntimeError('offline')):
        response = authenticated(hr_user).get('/api/dashboard/operations/insight/stations/')
    assert response.data['source'] == 'data'
    assert 'could not' in response.data['message']


def test_ai_gets_only_server_aggregates(hr_user, teacher_employee, monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only')
    client = Mock()
    client.models.generate_content.return_value.text = 'One employee is recorded.'
    with patch('core.views.dashboard_operations.genai.Client', return_value=client):
        response = authenticated(hr_user).get('/api/dashboard/operations/insight/workforce/')
    assert response.data['source'] == 'ai'
    prompt = client.models.generate_content.call_args.kwargs['contents']
    assert teacher_employee.first_name not in prompt
    assert teacher_employee.user.username not in prompt
    assert 'Current personnel records' in prompt


def test_equal_groups_are_described_as_tied(hr_user, teacher_employee):
    chart = next(c for c in operational_dashboard(hr_user)['charts'] if c['key'] == 'workforce')
    assert 'share the largest count' in chart['insight']
