# Revision Specification: REV-05
## Title: Public Sector GSIS Payroll Transition & Calculator Service

### 1. Objective & Problem Statement
1. The existing payroll model and calculation logic uses private-sector **SSS** (4.5%). DepEd employees are under the **GSIS (RA 8291)** system, which mandates a **9% personal share** (Life and Retirement).
2. Government employees receive **PERA** (Personnel Economic Relief Allowance, ₱2,000/mo, ₱1,000 per cutoff) which is currently omitted from payroll models.
3. In `backend/core/views/payroll.py`, the calculation logic is duplicated verbatim (>100 lines) between `generate()` and `bulk_generate()`.

### 2. Files to Create / Modify
- **Create:** `backend/core/services/payroll.py`
- **Modify:** [`backend/core/models/payroll.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/models/payroll.py)
- **Modify:** [`backend/core/views/payroll.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/views/payroll.py)
- **Modify:** [`backend/core/serializers/payroll.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/serializers/payroll.py)

### 3. Step-by-Step Implementation Instructions

#### Step 1: Update `Payroll` Model
In `backend/core/models/payroll.py`:
1. Rename `sss` $\to$ `gsis`:
   ```python
   gsis = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="GSIS 9% Personal Share")
   pera = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1000.00'), help_text="PERA (₱1,000/cutoff)")
   ```
2. Update the `save()` method:
   ```python
   def save(self, *args, **kwargs):
       self.total_deductions = self.gsis + self.philhealth + self.pagibig + self.tax + self.loans
       self.gross_salary = self.basic_salary + self.pera
       self.net_salary = self.gross_salary - self.total_deductions
       super().save(*args, **kwargs)
   ```

#### Step 2: Create `backend/core/services/payroll.py`
```python
from decimal import Decimal
from django.utils import timezone
from ..models import Attendance, ProvidentLoan

class PayrollCalculator:
    WORKING_DAYS = Decimal('22.0')
    GSIS_RATE = Decimal('0.09')          # 9% of basic monthly salary
    PHILHEALTH_RATE = Decimal('0.05')    # 5% total (2.5% personal share)
    PAGIBIG_DEFAULT = Decimal('100.00')  # ₱100 semi-monthly flat
    PERA_SEMI_MONTHLY = Decimal('1000.00') # ₱1,000 semi-monthly (₱2,000/month)
    TRAIN_TAX_EXEMPT = Decimal('20833.33') # ~₱250k annual exemption

    @classmethod
    def compute(cls, employee, cutoff_period, start_date, end_date):
        if not employee.salary:
            raise ValueError(f"Employee {employee} has no base salary.")

        # 1. Attendance Days
        days_worked = Decimal('11.0')
        if start_date and end_date:
            present_days = Attendance.objects.filter(
                employee=employee,
                date__range=(start_date, end_date),
                status__in=['present', 'late']
            ).values('date').distinct().count()
            if present_days > 0:
                days_worked = Decimal(str(present_days))

        # Basic earned based on attendance
        monthly_salary = employee.salary
        daily_rate = monthly_salary / cls.WORKING_DAYS
        basic_salary = (daily_rate * days_worked).quantize(Decimal('0.01'))

        # 2. Mandatory Deductions
        # GSIS: 9% of basic monthly salary / 2 per cutoff
        gsis_ded = ((monthly_salary * cls.GSIS_RATE) / Decimal('2.0')).quantize(Decimal('0.01'))
        
        # PhilHealth: 2.5% employee share / 2 (capped at ₱500/cutoff)
        philhealth_ded = min(((monthly_salary * (cls.PHILHEALTH_RATE / Decimal('2.0'))) / Decimal('2.0')), Decimal('500.00')).quantize(Decimal('0.01'))
        
        # Pag-IBIG: ₱100 flat
        pagibig_ded = cls.PAGIBIG_DEFAULT if monthly_salary >= Decimal('5000.00') else ((monthly_salary * Decimal('0.02')) / Decimal('2.0')).quantize(Decimal('0.01'))

        # TRAIN Law Withholding Tax
        tax_ded = Decimal('0.00')
        if monthly_salary > cls.TRAIN_TAX_EXEMPT:
            monthly_tax = (monthly_salary - cls.TRAIN_TAX_EXEMPT) * Decimal('0.15')
            tax_ded = (monthly_tax / Decimal('2.0')).quantize(Decimal('0.01'))

        # Active Provident Loan Repayment
        loan_ded = Decimal('0.00')
        active_loan = ProvidentLoan.objects.filter(employee=employee, status='released').first()
        if active_loan:
            std_payment = (active_loan.monthly_payment / Decimal('2.0')).quantize(Decimal('0.01'))
            loan_ded = min(std_payment, active_loan.current_balance)

        pera = cls.PERA_SEMI_MONTHLY
        gross_salary = basic_salary + pera
        total_deductions = gsis_ded + philhealth_ded + pagibig_ded + tax_ded + loan_ded
        net_salary = gross_salary - total_deductions

        return {
            'days_worked': days_worked,
            'basic_salary': basic_salary,
            'pera': pera,
            'gross_salary': gross_salary,
            'gsis': gsis_ded,
            'philhealth': philhealth_ded,
            'pagibig': pagibig_ded,
            'tax': tax_ded,
            'loans': loan_ded,
            'total_deductions': total_deductions,
            'net_salary': net_salary,
        }
```

#### Step 3: Refactor `PayrollViewSet`
In `backend/core/views/payroll.py`:
Both `generate()` and `bulk_generate()` will invoke `PayrollCalculator.compute(employee, cutoff, start_date, end_date)`, eliminating duplicated deduction calculations.

### 4. Verification & Acceptance Criteria
1. For Teacher I with SG 11 (₱27,000/mo):
   * Semi-monthly GSIS deduction = $(27,000 \times 0.09) / 2 = \text{₱}1,215.00$.
   * PERA = ₱1,000.00.
2. Both `generate()` and `bulk_generate()` produce identical results.
3. Released payroll with loan deductions correctly decrements the loan balance and records a `LoanPayment`.
