import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import (
    Role, ProvidentLoan, Payroll, PerformanceReview,
    LeaveRequest, Employee, EmployeeDocument, Attendance
)
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def accountant_user(db):
    return User.objects.create_user(
        username="acct_tester",
        password="password123",
        role=Role.ACCOUNTANT,
        first_name="Arthur",
        last_name="Accountant"
    )

@pytest.mark.django_db
def test_borrower_cannot_delete_released_loan(client, teacher_employee):
    """Borrower cannot delete an active or released loan (CRIT-01 BOLA)."""
    loan = ProvidentLoan.objects.create(
        employee=teacher_employee,
        loan_amount=Decimal("30000.00"),
        interest_rate=Decimal("6.0"),
        term_months=12,
        status='released'
    )
    client.force_authenticate(user=teacher_employee.user)
    res = client.delete(f'/api/loans/{loan.id}/')
    assert res.status_code in [400, 403]
    assert ProvidentLoan.objects.filter(id=loan.id).exists()

@pytest.mark.django_db
def test_borrower_cannot_alter_loan_terms_post_approval(client, teacher_employee):
    """Borrower cannot modify loan terms once approved (CRIT-01)."""
    loan = ProvidentLoan.objects.create(
        employee=teacher_employee,
        loan_amount=Decimal("20000.00"),
        interest_rate=Decimal("6.0"),
        term_months=12,
        status='approved'
    )
    client.force_authenticate(user=teacher_employee.user)
    res = client.patch(f'/api/loans/{loan.id}/', {'loan_amount': '50000.00'})
    assert res.status_code in [400, 403]
    loan.refresh_from_db()
    assert loan.loan_amount == Decimal("20000.00")

@pytest.mark.django_db
def test_hr_cannot_approve_or_disburse_loan(client, teacher_employee, hr_user):
    """HR role cannot approve or disburse loan funds (CRIT-02 SoD)."""
    loan = ProvidentLoan.objects.create(
        employee=teacher_employee,
        loan_amount=Decimal("25000.00"),
        interest_rate=Decimal("6.0"),
        term_months=12,
        status='verified'
    )
    client.force_authenticate(user=hr_user)
    
    # Try approve
    res_app = client.post(f'/api/loans/{loan.id}/approve/')
    assert res_app.status_code == 403

    # Try release
    loan.status = 'approved'
    loan.save()
    res_rel = client.post(f'/api/loans/{loan.id}/release-funds/')
    assert res_rel.status_code == 403

@pytest.mark.django_db
def test_accountant_cannot_modify_or_delete_released_payroll(client, teacher_employee, accountant_user):
    """Released payroll records are immutable and cannot be deleted (HIGH-01)."""
    payroll = Payroll.objects.create(
        employee=teacher_employee,
        cutoff_period="October 1-15, 2026",
        basic_salary=Decimal("27000.00"),
        gross_salary=Decimal("28000.00"),
        net_salary=Decimal("25000.00"),
        status='released'
    )
    client.force_authenticate(user=accountant_user)

    # Attempt to modify released payroll
    res_patch = client.patch(f'/api/payroll/{payroll.id}/', {'net_salary': '999999.00'})
    assert res_patch.status_code == 400
    assert "cannot modify payroll" in str(res_patch.data).lower()

    # Attempt to delete released payroll
    res_del = client.delete(f'/api/payroll/{payroll.id}/')
    assert res_del.status_code == 400
    assert "cannot delete payroll" in str(res_del.data).lower()
    assert Payroll.objects.filter(id=payroll.id).exists()

@pytest.mark.django_db
def test_teacher_ipcrf_self_rating_denied_promotion_flag(client, teacher_employee):
    """Employee self-rating does not grant promotion eligibility (HIGH-02)."""
    client.force_authenticate(user=teacher_employee.user)
    payload = {
        "period": "SY 2025-2026",
        "punctuality_score": 5.0,
        "quality_score": 5.0,
        "behavior_score": 5.0,
    }
    res = client.post('/api/performance/', payload)
    assert res.status_code == 201
    review = PerformanceReview.objects.get(id=res.data['id'])
    assert review.is_promotion_eligible is False
    assert review.punctuality_score is None

@pytest.mark.django_db
def test_applicant_cannot_tamper_leave_dates_at_superintendent_stage(client, teacher_employee):
    """Applicant cannot alter leave dates once forwarded to Superintendent (HIGH-03)."""
    leave = LeaveRequest.objects.create(
        employee=teacher_employee,
        leave_type='sick',
        start_date='2026-11-02',
        end_date='2026-11-03',
        working_days_applied=Decimal('2.0'),
        status='pending_superintendent'
    )
    client.force_authenticate(user=teacher_employee.user)
    res = client.patch(f'/api/leaves/{leave.id}/', {
        'start_date': '2026-11-02',
        'end_date': '2026-11-30'
    })
    assert res.status_code == 400
    assert "cannot be altered" in str(res.data).lower()

@pytest.mark.django_db
def test_teacher_cannot_delete_verified_201_document(client, teacher_employee):
    """Verified 201 records cannot be deleted by employee (HIGH-04)."""
    dummy_file = SimpleUploadedFile("transcript.pdf", b"%PDF-1.4 dummy content", content_type="application/pdf")
    doc = EmployeeDocument.objects.create(
        employee=teacher_employee,
        document_type="transcript",
        file=dummy_file,
        verified=True
    )
    client.force_authenticate(user=teacher_employee.user)
    res = client.delete(f'/api/employee-documents/{doc.id}/')
    assert res.status_code == 400
    assert "verified 201 official documents cannot be deleted" in str(res.data).lower()
    assert EmployeeDocument.objects.filter(id=doc.id).exists()

@pytest.mark.django_db
def test_superintendent_can_approve_monthly_dtr(client, teacher_employee, superintendent_user):
    """Superintendent can approve monthly DTR without 403 decorator override (MED-02)."""
    Attendance.objects.create(
        employee=teacher_employee,
        date='2026-10-01',
        status='present'
    )
    client.force_authenticate(user=superintendent_user)
    res = client.post('/api/attendance/approve_dtr/', {
        'employee_id': teacher_employee.id,
        'month': '2026-10'
    })
    assert res.status_code == 200
    assert "successfully approved" in str(res.data).lower()
