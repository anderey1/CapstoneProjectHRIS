from rest_framework import viewsets, status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from decimal import Decimal
from ..models import Employee, ProvidentLoan, LoanPayment, Payroll, Role, AuditLog
from ..serializers import PayrollSerializer
from ..permissions import IsAdminOrHR, IsAccountant

class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.all().order_by('-date_generated')
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR]:
            return Payroll.objects.all().order_by('-date_generated')
        return Payroll.objects.filter(employee__user=user).order_by('-date_generated')

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user, 
            action=f"Deleted payroll: {instance.employee} ({instance.cutoff_period})"
        )
        instance.delete()

    @action(detail=False, methods=['POST'], permission_classes=[IsAdminOrHR | IsAccountant])
    def generate(self, request):
        """Generates a payroll record for a specific employee."""
        employee_id = request.data.get('employee_id')
        if not employee_id:
            return Response({"detail": "employee_id is required."}, status=400)
            
        employee = get_object_or_404(Employee, id=employee_id)
        cutoff = request.data.get('cutoff', request.data.get('cutoff_period', 'Unknown Cutoff'))

        # Get employee's basic monthly salary to calculate dynamic deductions
        monthly_salary = employee.salary

        # 1. SSS Deduction: 4.5% of monthly salary, split per cutoff (capped at 675.00 per cutoff)
        sss_deduction = (monthly_salary * Decimal('0.045')) / Decimal('2.0')
        if sss_deduction > Decimal('675.00'):
            sss_deduction = Decimal('675.00')
        elif sss_deduction < Decimal('0.00'):
            sss_deduction = Decimal('0.00')

        # 2. PhilHealth Deduction: 2.5% of monthly salary, split per cutoff (capped at 500.00 per cutoff)
        philhealth_deduction = (monthly_salary * Decimal('0.025')) / Decimal('2.0')
        if philhealth_deduction > Decimal('500.00'):
            philhealth_deduction = Decimal('500.00')
        elif philhealth_deduction < Decimal('0.00'):
            philhealth_deduction = Decimal('0.00')

        # 3. Pag-IBIG Deduction: 100.00 flat deduction per semi-monthly cutoff
        pagibig_deduction = Decimal('100.00')
        # If monthly salary is extremely small, ensure Pag-IBIG does not exceed 2% of the basic monthly salary
        if monthly_salary < Decimal('5000.00'):
            pagibig_deduction = (monthly_salary * Decimal('0.02')) / Decimal('2.0')

        # 4. Withholding Tax: If basic monthly salary is above 20,833.33 (approx. 250k/year, tax-exempt under TRAIN Law)
        # Apply 15% on the excess amount, divided by 2 for semi-monthly.
        if monthly_salary > Decimal('20833.33'):
            monthly_tax = (monthly_salary - Decimal('20833.33')) * Decimal('0.15')
            tax_deduction = monthly_tax / Decimal('2.0')
        else:
            tax_deduction = Decimal('0.00')

        # Compile deductions (rounded to 2 decimal places for currency accuracy)
        DEDUCTIONS = {
            'sss': sss_deduction.quantize(Decimal('0.01')),
            'philhealth': philhealth_deduction.quantize(Decimal('0.01')),
            'pagibig': pagibig_deduction.quantize(Decimal('0.01')),
            'tax': tax_deduction.quantize(Decimal('0.01'))
        }

        # Calculate semi-monthly basic salary
        semi_monthly_salary = (monthly_salary / Decimal('2.0')).quantize(Decimal('0.01'))

        # Fetch active approved provident loan to deduct payment
        active_loan = ProvidentLoan.objects.filter(employee=employee, status='approved').first()
        loan_deduction = Decimal('0.00')
        
        if active_loan:
            standard_deduction = (active_loan.monthly_payment / Decimal('2.0')).quantize(Decimal('0.01'))
            remaining = active_loan.current_balance
            
            # Cap the deduction at the actual remaining balance
            loan_deduction = min(standard_deduction, remaining)

        # Check if payroll record already exists for the employee for this cutoff.
        # If it exists, update it to reflect the new generation; otherwise, create a new record.
        existing_payroll = Payroll.objects.filter(employee=employee, cutoff_period=cutoff).first()
        is_new_payroll = existing_payroll is None

        if existing_payroll:
            payroll = existing_payroll
            payroll.basic_salary = semi_monthly_salary
            payroll.loans = loan_deduction
            payroll.sss = DEDUCTIONS['sss']
            payroll.philhealth = DEDUCTIONS['philhealth']
            payroll.pagibig = DEDUCTIONS['pagibig']
            payroll.tax = DEDUCTIONS['tax']
            payroll.save()
        else:
            payroll = Payroll.objects.create(
                employee=employee,
                cutoff_period=cutoff,
                basic_salary=semi_monthly_salary,
                loans=loan_deduction,
                **DEDUCTIONS
            )

        # Automatic Loan Repayment Tracking (Only for new payroll periods to prevent duplicate deductions)
        if is_new_payroll and active_loan and loan_deduction > 0:
            LoanPayment.objects.create(loan=active_loan, amount_paid=loan_deduction)
            AuditLog.objects.create(
                user=request.user, 
                action=f"Auto loan deduction: {employee} (₱{loan_deduction})"
            )

        serializer = self.get_serializer(payroll)
        return Response(serializer.data, status=http_status.HTTP_201_CREATED)

