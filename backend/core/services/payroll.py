from decimal import Decimal
from django.utils import timezone
from ..models import Attendance, ProvidentLoan

class PayrollCalculator:
    """
    Standard Philippine Public Sector (DepEd) Semi-Monthly Payroll Calculator.
    Calculates salary, GSIS (RA 8291 9%), PhilHealth, Pag-IBIG, TRAIN Law Tax,
    PERA allowance, and active Provident Loan amortization.
    """
    WORKING_DAYS = Decimal('22.0')
    GSIS_RATE = Decimal('0.09')            # 9% Mandatory Personal Share
    PHILHEALTH_RATE = Decimal('0.05')      # 5% Total (2.5% Employee Share)
    PAGIBIG_DEFAULT = Decimal('100.00')    # ₱100.00 flat semi-monthly
    PERA_SEMI_MONTHLY = Decimal('1000.00') # ₱1,000.00 semi-monthly (₱2,000/month)
    TRAIN_TAX_THRESHOLD = Decimal('20833.33') # ₱250k annual tax-exempt threshold

    @classmethod
    def compute(cls, employee, cutoff_period, start_date, end_date):
        if not employee.salary:
            raise ValueError(f"Employee {employee} has no base salary set.")

        monthly_salary = employee.salary

        # 1. Days Worked from Attendance
        days_worked = Decimal('11.0') # Standard semi-monthly working days
        if start_date and end_date:
            present_days = Attendance.objects.filter(
                employee=employee,
                date__range=(start_date, end_date),
                status__in=['present', 'late']
            ).values('date').distinct().count()
            if present_days > 0:
                days_worked = Decimal(str(present_days))

        # 2. Basic Salary earned based on attendance
        daily_rate = monthly_salary / cls.WORKING_DAYS
        calculated_basic = (daily_rate * days_worked).quantize(Decimal('0.01'))

        # 3. Mandatory Deductions
        # GSIS: 9% of basic monthly salary, split into semi-monthly cutoff
        gsis_ded = ((monthly_salary * cls.GSIS_RATE) / Decimal('2.0')).quantize(Decimal('0.01'))

        # PhilHealth: 2.5% employee share, semi-monthly (capped at ₱500/cutoff)
        philhealth_semi = (monthly_salary * (cls.PHILHEALTH_RATE / Decimal('2.0'))) / Decimal('2.0')
        philhealth_ded = min(philhealth_semi, Decimal('500.00')).quantize(Decimal('0.01'))

        # Pag-IBIG: ₱100 flat semi-monthly (or 2%/2 if monthly salary < ₱5,000)
        if monthly_salary < Decimal('5000.00'):
            pagibig_ded = ((monthly_salary * Decimal('0.02')) / Decimal('2.0')).quantize(Decimal('0.01'))
        else:
            pagibig_ded = cls.PAGIBIG_DEFAULT

        # TRAIN Law Withholding Tax: 15% on excess over ₱20,833.33/mo
        if monthly_salary > cls.TRAIN_TAX_THRESHOLD:
            monthly_tax = (monthly_salary - cls.TRAIN_TAX_THRESHOLD) * Decimal('0.15')
            tax_ded = (monthly_tax / Decimal('2.0')).quantize(Decimal('0.01'))
        else:
            tax_ded = Decimal('0.00')

        # Active Released Provident Loan Deduction
        loan_ded = Decimal('0.00')
        active_loan = ProvidentLoan.objects.filter(employee=employee, status='released').first()
        if active_loan:
            standard_payment = (active_loan.monthly_payment / Decimal('2.0')).quantize(Decimal('0.01'))
            remaining_balance = active_loan.current_balance
            loan_ded = min(standard_payment, remaining_balance)

        pera = cls.PERA_SEMI_MONTHLY
        gross_salary = calculated_basic + pera
        total_deductions = gsis_ded + philhealth_ded + pagibig_ded + tax_ded + loan_ded
        net_salary = gross_salary - total_deductions

        return {
            'days_worked': days_worked,
            'basic_salary': calculated_basic,
            'pera': pera,
            'gross_salary': gross_salary,
            'gsis': gsis_ded,
            'sss': gsis_ded, # Legacy alias for GSIS
            'philhealth': philhealth_ded,
            'pagibig': pagibig_ded,
            'tax': tax_ded,
            'loans': loan_ded,
            'total_deductions': total_deductions,
            'net_salary': net_salary,
        }
