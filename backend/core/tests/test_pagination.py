import pytest
from decimal import Decimal
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import (
    Applicant, Attendance, AuditLog, Employee, EmployeeDocument, LeaveRequest,
    LoanDocument, Payroll, PerformanceReview, ProvidentLoan, SalaryGrade, School,
)


@pytest.fixture
def client(hr_user):
    client = APIClient()
    client.force_authenticate(hr_user)
    return client


@pytest.mark.django_db
def test_employee_pages_search_and_summary(client, mock_school):
    employees = Employee.objects.bulk_create([
        Employee(first_name=f'Person {i:02}', last_name='Pagination',
                 department='Instructional', school=mock_school)
        for i in range(13)
    ])
    first = client.get('/api/employees/')
    second = client.get('/api/employees/', {'page': 2})
    assert first.status_code == second.status_code == 200
    assert first.data['count'] == 13
    assert len(first.data['results']) == 10
    assert len(second.data['results']) == 3
    assert first.data['summary']['total'] == 13
    assert second.data['summary'] == first.data['summary']
    assert not ({row['id'] for row in first.data['results']} &
                {row['id'] for row in second.data['results']})
    found = client.get('/api/employees/', {'search': 'Person 12'})
    assert found.data['count'] == 1
    assert found.data['results'][0]['id'] == employees[-1].id
    assert client.get('/api/employees/', {'page': 99}).status_code == 404


@pytest.mark.django_db
def test_filters_cannot_expand_employee_scope(client, teacher_employee):
    Employee.objects.create(first_name='Private', last_name='Record')
    client.force_authenticate(teacher_employee.user)
    response = client.get('/api/employees/', {'search': 'Private'})
    assert response.data['count'] == 0
    assert response.data['summary']['total'] == 1
    assert response.data['summary']['departments'] == ([teacher_employee.department] if teacher_employee.department else [])


@pytest.mark.django_db
def test_attendance_month_filter_and_totals(client, teacher_employee):
    Attendance.objects.bulk_create([
        Attendance(employee=teacher_employee, date=f'2026-10-{day:02}', status='present')
        for day in range(1, 14)
    ] + [Attendance(employee=teacher_employee, date='2026-09-01', status='late')])
    response = client.get('/api/attendance/', {'month': 10, 'year': 2026, 'page': 2})
    assert response.status_code == 200
    assert response.data['count'] == 13
    assert len(response.data['results']) == 3
    assert response.data['summary']['present'] == 13
    assert response.data['summary']['late'] == 0
    invalid = client.get('/api/attendance/', {'month': 'bad'})
    assert invalid.status_code == 400


@pytest.mark.django_db
@pytest.mark.parametrize('resource', ['loans', 'leaves', 'payroll', 'performance', 'applicants', 'audit-logs'])
def test_list_filters_find_records_beyond_first_page(client, teacher_employee, non_teaching_employee, hr_user, resource):
    employee = teacher_employee
    if resource == 'loans':
        ProvidentLoan.objects.bulk_create([
            ProvidentLoan(employee=employee, loan_amount=Decimal('12000.00'), interest_rate=Decimal('0.00'),
                          monthly_payment=Decimal('1000.00'), total_amount=Decimal('12000.00'), status='released')
            for _ in range(13)
        ])
        match = ProvidentLoan.objects.create(employee=employee, loan_amount=Decimal('12000.00'),
                                            interest_rate=Decimal('0.00'), status='paid')
        params = {'status': 'paid'}
    elif resource == 'leaves':
        LeaveRequest.objects.bulk_create([
            LeaveRequest(employee=employee, leave_type='vacation', start_date='2026-10-01',
                         end_date='2026-10-01', status='pending_hr') for _ in range(13)
        ])
        match = LeaveRequest.objects.create(employee=employee, leave_type='sick', start_date='2026-10-01',
                                            end_date='2026-10-01', status='approved')
        params = {'status': 'approved', 'leave_type': 'sick'}
    elif resource == 'payroll':
        Payroll.objects.bulk_create([
            Payroll(employee=employee, basic_salary=Decimal('10000.00'), net_salary=Decimal('9000.00'),
                    cutoff_period='October 1-15, 2026') for _ in range(13)
        ])
        match = Payroll.objects.create(employee=employee, basic_salary=Decimal('10000.00'),
                                        net_salary=Decimal('9000.00'), cutoff_period='October 16-31, 2026')
        params = {'cutoff_period': 'October 16-31, 2026'}
    elif resource == 'performance':
        PerformanceReview.objects.bulk_create([
            PerformanceReview(employee=employee, period='Q1', quality_score=3, behavior_score=3,
                              punctuality_score=3) for _ in range(13)
        ])
        match = PerformanceReview.objects.create(employee=employee, period='Q2', quality_score=5,
                                                 behavior_score=5, punctuality_score=5)
        params = {'period': 'Q2', 'rating': 'O'}
    elif resource == 'applicants':
        Applicant.objects.bulk_create([
            Applicant(first_name='Pagination', last_name=f'Person {i}', status='applied') for i in range(13)
        ])
        match = Applicant.objects.create(first_name='Pagination', last_name='Selected', status='hired')
        params = {'status': 'hired', 'search': 'Selected'}
    else:
        AuditLog.objects.bulk_create([AuditLog(user=hr_user, action='Viewed employee') for _ in range(13)])
        match = AuditLog.objects.create(user=hr_user, action='Approved payroll')
        params = {'module': 'Division Payroll', 'date_range': '24H'}

    ordering_field = {'loans': 'date_applied', 'leaves': 'date_applied', 'payroll': 'date_generated',
                      'performance': 'date_evaluated', 'applicants': 'date_applied', 'audit-logs': 'timestamp'}[resource]
    type(match).objects.exclude(pk=match.pk).update(**{ordering_field: timezone.now() + timedelta(days=1)})
    first = client.get(f'/api/{resource}/')
    second = client.get(f'/api/{resource}/', {'page': 2})
    assert first.status_code == second.status_code == 200
    assert first.data['count'] == 14
    assert len(first.data['results']) == 10
    assert len(second.data['results']) == 4
    assert match.pk in {row['id'] for row in second.data['results']}
    assert first.data['summary']['total'] == 14
    assert first.data['summary'] == second.data['summary']
    filtered = client.get(f'/api/{resource}/', params)
    assert filtered.status_code == 200
    assert filtered.data['count'] == 1
    assert filtered.data['results'][0]['id'] == match.id
    if resource == 'loans':
        assert first.data['summary']['released_value'] == '168000'
    if resource not in ('applicants', 'audit-logs'):
        match.pk = None
        match.employee = non_teaching_employee
        match.save()
        client.force_authenticate(teacher_employee.user)
        own = client.get(f'/api/{resource}/')
        assert own.data['count'] == 14
        assert own.data['summary']['total'] == 14
        assert client.get(f'/api/{resource}/', {'search': 'Private', 'employee_id': non_teaching_employee.pk}).data['count'] == 0
    else:
        client.force_authenticate(teacher_employee.user)
        assert client.get(f'/api/{resource}/').status_code == 403


@pytest.mark.django_db
def test_pending_registrations_and_reference_lists_are_paginated(client, mock_school):
    users = get_user_model().objects.bulk_create([
        get_user_model()(username=f'pagination_pending_{i}', is_active=False) for i in range(13)
    ])
    Employee.objects.bulk_create([Employee(user=user, first_name='Pending', last_name=str(i)) for i, user in enumerate(users)])
    School.objects.bulk_create([School(name=f'Pagination School {i}', latitude=mock_school.latitude,
                                      longitude=mock_school.longitude) for i in range(12)])
    SalaryGrade.objects.bulk_create([SalaryGrade(grade=i, amount=Decimal('10000')) for i in range(1, 14)])
    for endpoint in ('employees/pending-registrations', 'schools', 'salary-grades'):
        response = client.get(f'/api/{endpoint}/', {'page': 2})
        assert response.status_code == 200
        assert response.data['count'] == 13
        assert len(response.data['results']) == 3


@pytest.mark.django_db
def test_document_lists_use_drf_pages(client, teacher_employee):
    loan = ProvidentLoan.objects.create(employee=teacher_employee, loan_amount=Decimal('12000'), interest_rate=Decimal('0'))
    LoanDocument.objects.bulk_create([
        LoanDocument(loan=loan, doc_type='laf', file=f'pagination-{i}.pdf') for i in range(13)
    ])
    response = client.get(f'/api/loans/{loan.pk}/documents/', {'page': 2})
    assert response.data['count'] == 13
    assert len(response.data['results']) == 3
    EmployeeDocument.objects.bulk_create([
        EmployeeDocument(employee=teacher_employee, document_type=f'type-{i}', file=f'pagination-{i}.pdf')
        for i in range(13)
    ])
    response = client.get('/api/employee-documents/', {'employee': teacher_employee.pk, 'page_size': 10, 'page': 2})
    assert response.data['count'] == 13
    assert len(response.data['results']) == 3


@pytest.mark.django_db
def test_leave_scope_and_summary_cannot_include_other_employees(client, teacher_employee, non_teaching_employee):
    LeaveRequest.objects.create(employee=teacher_employee, leave_type='sick', start_date='2026-10-01', end_date='2026-10-01')
    other = LeaveRequest.objects.create(employee=non_teaching_employee, leave_type='sick', start_date='2026-10-01', end_date='2026-10-01')
    client.force_authenticate(teacher_employee.user)
    for scope in ('mine', 'team'):
        response = client.get('/api/leaves/', {'scope': scope})
        assert all(row['id'] != other.pk for row in response.data['results'])
        assert response.data['count'] == (1 if scope == 'mine' else 0)
        assert response.data['summary']['total'] == response.data['count']
