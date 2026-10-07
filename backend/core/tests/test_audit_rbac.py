import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import Role, AuditLog, Employee, ProvidentLoan
from decimal import Decimal

User = get_user_model()

@pytest.mark.django_db
def test_all_management_roles_can_access_audit_logs():
    """All management roles (HR, Superintendent, Accountant, Administrative) can read audit logs."""
    admin_user = User.objects.create_user(username="admin_user", password="pwd", role=Role.ADMINISTRATIVE)
    hr_user = User.objects.create_user(username="hr_user", password="pwd", role=Role.HR)
    supt_user = User.objects.create_user(username="supt_user", password="pwd", role=Role.SUPERINTENDENT)
    accountant_user = User.objects.create_user(username="acct_user", password="pwd", role=Role.ACCOUNTANT)
    teacher_user = User.objects.create_user(username="teacher_user", password="pwd", role=Role.TEACHING)

    AuditLog.objects.create(user=admin_user, action="Test management audit entry")

    client = APIClient()

    for mgmt in [admin_user, hr_user, supt_user, accountant_user]:
        client.force_authenticate(user=mgmt)
        res = client.get('/api/audit-logs/')
        assert res.status_code == 200, f"Role {mgmt.role} should be able to read audit logs"
        assert res.data['count'] >= 1

    # Non-management user is denied
    client.force_authenticate(user=teacher_user)
    res_forbidden = client.get('/api/audit-logs/')
    assert res_forbidden.status_code == 403


@pytest.mark.django_db
def test_admin_can_release_approved_loan_funds(teacher_employee):
    """Admin role can release funds for approved loans."""
    admin_user = User.objects.create_user(username="admin_officer", password="pwd", role=Role.ADMINISTRATIVE)
    loan = ProvidentLoan.objects.create(
        employee=teacher_employee,
        loan_amount=Decimal("25000.00"),
        interest_rate=Decimal("5.0"),
        term_months=12,
        status='approved'
    )

    client = APIClient()
    client.force_authenticate(user=admin_user)

    res = client.post(f'/api/loans/{loan.id}/release-funds/')
    assert res.status_code == 200
    loan.refresh_from_db()
    assert loan.status == 'released'
