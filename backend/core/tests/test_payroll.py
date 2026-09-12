import pytest
from decimal import Decimal
from datetime import date
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from core.models import Attendance, ProvidentLoan, LoanPayment, Payroll, LeaveRequest, Role
from core.services.payroll import PayrollCalculator
from core.views.payroll import PayrollViewSet

@pytest.mark.django_db
class TestPayrollCalculator:
    def test_gsis_deduction(self, teacher_employee):
        """GSIS personal share is exactly 9% of basic monthly salary, split semi-monthly."""
        result = PayrollCalculator.compute(
            employee=teacher_employee,
            cutoff_period="May 1-15, 2026",
            start_date=None,
            end_date=None
        )
        # ₱27,000 * 0.09 = ₱2,430 monthly -> ₱1,215 semi-monthly
        expected_gsis = Decimal("1215.00")
        assert result['gsis'] == expected_gsis
        assert result['sss'] == expected_gsis  # Legacy alias

    def test_train_law_tax_above_threshold(self, teacher_employee):
        """Salaries above ₱20,833.33/mo are subject to 15% withholding tax on excess."""
        result = PayrollCalculator.compute(
            employee=teacher_employee,
            cutoff_period="May 1-15, 2026",
            start_date=None,
            end_date=None
        )
        # (27,000 - 20,833.33) * 0.15 / 2 = 462.50
        assert result['tax'] == Decimal("462.50")

    def test_train_law_tax_exempt_below_threshold(self, non_teaching_employee):
        """Salaries at or below ₱20,833.33/mo have zero withholding tax."""
        result = PayrollCalculator.compute(
            employee=non_teaching_employee,
            cutoff_period="May 1-15, 2026",
            start_date=None,
            end_date=None
        )
        assert result['tax'] == Decimal("0.00")

    def test_philhealth_and_pagibig_deductions(self, teacher_employee):
        """PhilHealth is 2.5% employee share / 2 and Pag-IBIG is ₱100 flat semi-monthly."""
        result = PayrollCalculator.compute(
            employee=teacher_employee,
            cutoff_period="May 1-15, 2026",
            start_date=None,
            end_date=None
        )
        # (27,000 * 0.025) / 2 = 337.50
        assert result['philhealth'] == Decimal("337.50")
        assert result['pagibig'] == Decimal("100.00")

    def test_pera_allowance_included_in_gross(self, teacher_employee):
        """PERA provides ₱1,000 semi-monthly allowance added to basic pay."""
        result = PayrollCalculator.compute(
            employee=teacher_employee,
            cutoff_period="May 1-15, 2026",
            start_date=None,
            end_date=None
        )
        assert result['pera'] == Decimal("1000.00")
        assert result['gross_salary'] == result['basic_salary'] + Decimal("1000.00")
        assert result['net_salary'] == result['gross_salary'] - result['total_deductions']

    def test_provident_loan_deduction(self, teacher_employee):
        """Active released loan amortizes semi-monthly payment."""
        loan = ProvidentLoan.objects.create(
            employee=teacher_employee,
            purpose='general',
            loan_amount=Decimal("50000.00"),
            interest_rate=Decimal("6.0"),
            term_months=12,
            status='released'
        )

        result = PayrollCalculator.compute(
            employee=teacher_employee,
            cutoff_period="May 1-15, 2026",
            start_date=None,
            end_date=None
        )
        # 53,000 / 12 = 4416.67 monthly -> 2208.34 semi-monthly
        expected_ded = (loan.monthly_payment / Decimal("2.0")).quantize(Decimal("0.01"))
        assert result['loans'] == expected_ded


    def test_attendance_based_salary_calculation(self, teacher_employee):
        """Calculates basic pay based on actual days worked."""
        start = date(2026, 5, 1)
        end = date(2026, 5, 5)
        # Create 3 present attendance records
        for day in [1, 2, 4]:
            Attendance.objects.create(
                employee=teacher_employee,
                date=date(2026, 5, day),
                status='present'
            )

        result = PayrollCalculator.compute(
            employee=teacher_employee,
            cutoff_period="May 1-15, 2026",
            start_date=start,
            end_date=end
        )
        assert result['days_worked'] == Decimal("3.0")
        expected_daily = teacher_employee.salary / Decimal("22.0")
        expected_basic = (expected_daily * Decimal("3.0")).quantize(Decimal("0.01"))
        assert result['basic_salary'] == expected_basic

    def test_zero_attendance_results_in_zero_days_worked(self, teacher_employee):
        """When cutoff dates are given but employee has 0 attendance records, days_worked is 0."""
        start = date(2026, 5, 1)
        end = date(2026, 5, 5)

        result = PayrollCalculator.compute(
            employee=teacher_employee,
            cutoff_period="May 1-15, 2026",
            start_date=start,
            end_date=end
        )
        assert result['days_worked'] == Decimal("0.0")
        assert result['basic_salary'] == Decimal("0.00")




@pytest.mark.django_db
def test_approved_leave_credited_in_payroll(teacher_employee):
    """Approved paid leaves within cutoff are credited as days worked."""
    # May 4 (Mon) to May 8 (Fri), 2026: 5 weekdays
    start = date(2026, 5, 4)
    end = date(2026, 5, 8)

    # 2 present attendance days (May 4 and May 5)
    for day in [4, 5]:
        Attendance.objects.create(
            employee=teacher_employee,
            date=date(2026, 5, day),
            status='present'
        )

    # 2 approved leave days (May 6 and May 7)
    LeaveRequest.objects.create(
        employee=teacher_employee,
        leave_type='sick',
        start_date=date(2026, 5, 6),
        end_date=date(2026, 5, 7),
        working_days_applied=2,
        status='approved'
    )

    result = PayrollCalculator.compute(
        employee=teacher_employee,
        cutoff_period="May 1-15, 2026",
        start_date=start,
        end_date=end
    )
    # 2 present + 2 leave = 4 days worked
    assert result['days_worked'] == Decimal("4.0")
    expected_daily = teacher_employee.salary / Decimal("22.0")
    expected_basic = (expected_daily * Decimal("4.0")).quantize(Decimal("0.01"))
    assert result['basic_salary'] == expected_basic

def _accountant_user():
    return get_user_model().objects.create_user(
        username="payroll_accountant",
        password="test-password",
        role=Role.ACCOUNTANT,
    )


def _approved_payroll(employee, cutoff, loans):
    return Payroll.objects.create(
        employee=employee,
        cutoff_period=cutoff,
        basic_salary=Decimal("10000.00"),
        net_salary=Decimal("10000.00"),
        loans=loans,
        status="approved",
    )


def _release(payroll, user):
    factory = APIRequestFactory()
    request = factory.post(f"/api/payroll/{payroll.id}/release/")
    force_authenticate(request, user=user)
    return PayrollViewSet.as_view({"post": "release"})(request, pk=payroll.id)


@pytest.mark.django_db
def test_single_release_allocates_multiple_loans_in_order_and_caps_final_payment(teacher_employee):
    first_loan = ProvidentLoan.objects.create(
        employee=teacher_employee,
        loan_amount=Decimal("1000.00"),
        interest_rate=Decimal("0.00"),
        term_months=4,
        status="released",
    )
    second_loan = ProvidentLoan.objects.create(
        employee=teacher_employee,
        loan_amount=Decimal("2000.00"),
        interest_rate=Decimal("0.00"),
        term_months=4,
        status="released",
    )
    LoanPayment.objects.create(loan=first_loan, amount_paid=Decimal("900.00"))
    payroll = _approved_payroll(teacher_employee, "May 1-15, 2026", Decimal("350.00"))

    response = _release(payroll, _accountant_user())

    assert response.status_code == 200
    assert list(first_loan.loanpayment_set.values_list("amount_paid", flat=True)) == [
        Decimal("900.00"),
        Decimal("100.00"),
    ]
    assert list(second_loan.loanpayment_set.values_list("amount_paid", flat=True)) == [
        Decimal("250.00"),
    ]


@pytest.mark.django_db
def test_bulk_release_matches_single_release_allocation(teacher_employee, non_teaching_employee):
    for employee in (teacher_employee, non_teaching_employee):
        ProvidentLoan.objects.create(
            employee=employee,
            loan_amount=Decimal("1000.00"),
            interest_rate=Decimal("0.00"),
            term_months=4,
            status="released",
        )
        ProvidentLoan.objects.create(
            employee=employee,
            loan_amount=Decimal("2000.00"),
            interest_rate=Decimal("0.00"),
            term_months=4,
            status="released",
        )

    single = _approved_payroll(teacher_employee, "May 1-15, 2026", Decimal("375.00"))
    bulk = _approved_payroll(non_teaching_employee, "May 1-15, 2026", Decimal("375.00"))
    accountant = _accountant_user()

    single_response = _release(single, accountant)
    factory = APIRequestFactory()
    request = factory.post(
        "/api/payroll/bulk-release/",
        {"cutoff": "May 1-15, 2026"},
        format="json",
    )
    force_authenticate(request, user=accountant)
    bulk_response = PayrollViewSet.as_view({"post": "bulk_release"})(request)

    assert single_response.status_code == 200
    assert bulk_response.status_code == 200
    assert list(
        LoanPayment.objects.filter(loan__employee=teacher_employee)
        .order_by("loan_id", "id")
        .values_list("amount_paid", flat=True)
    ) == list(
        LoanPayment.objects.filter(loan__employee=non_teaching_employee)
        .order_by("loan_id", "id")
        .values_list("amount_paid", flat=True)
    )


@pytest.mark.django_db
def test_release_does_not_overpay_when_payroll_amount_exceeds_total_balance(teacher_employee):
    first_loan = ProvidentLoan.objects.create(
        employee=teacher_employee,
        loan_amount=Decimal("1000.00"),
        interest_rate=Decimal("0.00"),
        term_months=1,
        status="released",
    )
    second_loan = ProvidentLoan.objects.create(
        employee=teacher_employee,
        loan_amount=Decimal("2000.00"),
        interest_rate=Decimal("0.00"),
        term_months=1,
        status="released",
    )
    LoanPayment.objects.create(loan=first_loan, amount_paid=Decimal("600.00"))
    LoanPayment.objects.create(loan=second_loan, amount_paid=Decimal("1700.00"))
    payroll = _approved_payroll(teacher_employee, "May 1-15, 2026", Decimal("9999.00"))

    response = _release(payroll, _accountant_user())

    assert response.status_code == 200
    assert first_loan.current_balance == Decimal("0.00")
    assert second_loan.current_balance == Decimal("0.00")
    assert sum(first_loan.loanpayment_set.values_list("amount_paid", flat=True)) == Decimal("1000.00")
    assert sum(second_loan.loanpayment_set.values_list("amount_paid", flat=True)) == Decimal("2000.00")


@pytest.mark.django_db
def test_release_retry_does_not_create_duplicate_payments(teacher_employee):
    loan = ProvidentLoan.objects.create(
        employee=teacher_employee,
        loan_amount=Decimal("1000.00"),
        interest_rate=Decimal("0.00"),
        term_months=1,
        status="released",
    )
    payroll = _approved_payroll(teacher_employee, "May 1-15, 2026", Decimal("500.00"))
    accountant = _accountant_user()

    first_response = _release(payroll, accountant)
    second_response = _release(payroll, accountant)

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert LoanPayment.objects.filter(loan=loan).count() == 1


@pytest.mark.django_db
def test_bulk_release_rolls_back_all_payrolls_on_allocation_failure(
    teacher_employee, non_teaching_employee, monkeypatch
):
    for employee in (teacher_employee, non_teaching_employee):
        ProvidentLoan.objects.create(
            employee=employee,
            loan_amount=Decimal("1000.00"),
            interest_rate=Decimal("0.00"),
            term_months=1,
            status="released",
        )
        _approved_payroll(employee, "May 1-15, 2026", Decimal("500.00"))

    original = LoanPayment.allocate_payroll_deduction
    calls = 0

    def fail_on_second_call(cls, employee, amount, posted_by=None):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise RuntimeError("forced allocation failure")
        return original(employee, amount, posted_by)

    monkeypatch.setattr(
        LoanPayment,
        "allocate_payroll_deduction",
        classmethod(fail_on_second_call),
    )
    factory = APIRequestFactory()
    request = factory.post(
        "/api/payroll/bulk-release/",
        {"cutoff": "May 1-15, 2026"},
        format="json",
    )
    force_authenticate(request, user=_accountant_user())

    with pytest.raises(RuntimeError, match="forced allocation failure"):
        PayrollViewSet.as_view({"post": "bulk_release"})(request)

    assert not Payroll.objects.filter(
        cutoff_period="May 1-15, 2026", status="released"
    ).exists()
    assert not LoanPayment.objects.exists()
