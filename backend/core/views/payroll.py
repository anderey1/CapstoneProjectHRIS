from rest_framework import viewsets, status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from ..models import Employee, ProvidentLoan, LoanPayment, Payroll, Role, AuditLog, Attendance
from ..serializers import PayrollSerializer
from ..permissions import IsAdminOrHR, IsAccountant, IsAdmin
from ..utils import parse_cutoff_dates

class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.all().order_by('-date_generated')
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR, Role.ACCOUNTANT]:
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
        
        # Validation: Employee must have a salary set
        if employee.salary is None:
            return Response({
                "detail": f"Employee {employee} has no salary set. Please set a salary in their profile before generating payroll."
            }, status=400)

        cutoff = request.data.get('cutoff', request.data.get('cutoff_period', 'Unknown Cutoff'))
        
        # Calculate Days Worked from Attendance
        start_date, end_date = parse_cutoff_dates(cutoff)
        days_worked = Decimal('11.0') # Default for semi-monthly if no attendance data found
        
        if start_date and end_date:
            # Count distinct days present/late in the range
            present_days = Attendance.objects.filter(
                employee=employee,
                date__range=(start_date, end_date),
                status__in=['present', 'late']
            ).values('date').distinct().count()
            
            # If we found attendance records, use that count. 
            # Otherwise, assume full attendance (standard for many gov roles unless flagged)
            if present_days > 0:
                days_worked = Decimal(str(present_days))

        # Get employee's basic monthly salary to calculate dynamic deductions
        monthly_salary = employee.salary
        
        # Calculate semi-monthly basic salary based on attendance
        # Formula: (Monthly Salary / 22 standard working days) * days_worked
        daily_rate = monthly_salary / Decimal('22.0')
        calculated_salary = (daily_rate * days_worked).quantize(Decimal('0.01'))

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

        # Fetch active released provident loan to deduct payment
        active_loan = ProvidentLoan.objects.filter(employee=employee, status='released').first()
        loan_deduction = Decimal('0.00')
        
        if active_loan:
            standard_deduction = (active_loan.monthly_payment / Decimal('2.0')).quantize(Decimal('0.01'))
            remaining = active_loan.current_balance
            
            # Cap the deduction at the actual remaining balance
            loan_deduction = min(standard_deduction, remaining)

        # Check if payroll record already exists for the employee for this cutoff.
        # If it exists, update it to reflect the new generation; otherwise, create a new record.
        existing_payroll = Payroll.objects.filter(employee=employee, cutoff_period=cutoff).first()

        if existing_payroll:
            # Only allow re-generating if in draft
            if existing_payroll.status != 'draft':
                return Response({"detail": f"Cannot re-generate payroll in {existing_payroll.status} status."}, status=400)
            
            payroll = existing_payroll
            payroll.days_worked = days_worked
            payroll.basic_salary = calculated_salary
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
                days_worked=days_worked,
                basic_salary=calculated_salary,
                loans=loan_deduction,
                **DEDUCTIONS
            )

        serializer = self.get_serializer(payroll)
        return Response(serializer.data, status=http_status.HTTP_201_CREATED)

    @action(detail=True, methods=['POST'], permission_classes=[IsAdminOrHR])
    def approve(self, request, pk=None):
        """Approves a draft payroll record."""
        payroll = self.get_object()
        if payroll.status != 'draft':
            return Response({"detail": f"Cannot approve payroll in {payroll.status} status."}, status=400)
            
        payroll.status = 'approved'
        payroll.save()
        
        AuditLog.objects.create(user=request.user, action=f"Approved payroll: {payroll.employee} ({payroll.cutoff_period})")
        return Response({"message": "Payroll approved.", "status": "approved"})

    @action(detail=True, methods=['POST'], permission_classes=[IsAdmin | IsAccountant], url_path='release')
    def release(self, request, pk=None):
        """Finalizes and releases payroll, recording loan deductions if any."""
        payroll = self.get_object()
        if payroll.status != 'approved':
            return Response({"detail": f"Cannot release payroll in {payroll.status} status. It must be approved first."}, status=400)
            
        with transaction.atomic():
            payroll.status = 'released'
            payroll.date_released = timezone.now()
            payroll.save()

            # Record Loan Repayment if deduction was part of this payroll
            if payroll.loans > 0:
                # Important: We only deduct from 'released' loans (funds already disbursed)
                active_loan = ProvidentLoan.objects.filter(employee=payroll.employee, status='released').first()
                if active_loan:
                    LoanPayment.objects.create(loan=active_loan, amount_paid=payroll.loans)
                    AuditLog.objects.create(
                        user=request.user, 
                        action=f"Released payroll loan deduction: {payroll.employee} (₱{payroll.loans})"
                    )
            
            AuditLog.objects.create(user=request.user, action=f"Released payroll: {payroll.employee} ({payroll.cutoff_period})")
            
        return Response({"message": "Payroll released successfully.", "status": "released"})
