from rest_framework import viewsets, status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from decimal import Decimal
from ..models import Employee, ProvidentLoan, LoanPayment, Payroll, Role, AuditLog
from ..serializers import PayrollSerializer
from ..permissions import IsAdminOrHR

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

    @action(detail=False, methods=['POST'], permission_classes=[IsAdminOrHR])
    def generate(self, request):
        """Generates a payroll record for a specific employee."""
        employee_id = request.data.get('employee_id')
        if not employee_id:
            return Response({"detail": "employee_id is required."}, status=400)
            
        employee = get_object_or_404(Employee, id=employee_id)
        cutoff = request.data.get('cutoff', request.data.get('cutoff_period', 'Unknown Cutoff'))

        # Fixed statutory deductions for prototype
        DEDUCTIONS = {
            'sss': Decimal('675.00'),
            'philhealth': Decimal('500.00'),
            'pagibig': Decimal('100.00'),
            'tax': Decimal('1500.00')
        }

        # Calculation logic
        semi_monthly_salary = employee.salary / Decimal('2.0')
        active_loan = ProvidentLoan.objects.filter(employee=employee, status='approved').first()
        loan_deduction = (active_loan.monthly_payment / Decimal('2.0')) if active_loan else Decimal('0.00')

        payroll = Payroll.objects.create(
            employee=employee,
            cutoff_period=cutoff,
            basic_salary=semi_monthly_salary,
            loans=loan_deduction,
            **DEDUCTIONS
        )

        # Automatic Loan Repayment Tracking
        if active_loan and loan_deduction > 0:
            LoanPayment.objects.create(loan=active_loan, amount_paid=loan_deduction)
            AuditLog.objects.create(
                user=request.user, 
                action=f"Auto loan deduction: {employee} (₱{loan_deduction})"
            )

        serializer = self.get_serializer(payroll)
        return Response(serializer.data, status=http_status.HTTP_201_CREATED)

