import pytest
from decimal import Decimal
from datetime import date
from core.models import Attendance, ProvidentLoan, Payroll
from core.services.payroll import PayrollCalculator

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
