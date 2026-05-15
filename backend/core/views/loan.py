from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from ..models import Employee, ProvidentLoan, Role, AuditLog
from ..serializers import LoanSerializer
from ..permissions import IsAdminOrHR, IsHR

class LoanViewSet(viewsets.ModelViewSet):
    queryset = ProvidentLoan.objects.all().order_by('-date_applied')
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR]:
            return ProvidentLoan.objects.all().order_by('-date_applied')
        return ProvidentLoan.objects.filter(employee__user=user).order_by('-date_applied')

    def perform_create(self, serializer):
        user = self.request.user
        employee_id = self.request.data.get('employee')
        # 1. Target Employee Identification
        if user.role in [Role.ADMIN, Role.HR] and employee_id:
            employee = get_object_or_404(Employee, id=employee_id)
        else:
            employee = Employee.objects.filter(user=user).first()
            if not employee:
                raise ValidationError("You must have an employee profile.")
        
        # 2. Validation
        if ProvidentLoan.objects.filter(employee=employee, status__in=['pending', 'approved']).exists():
            raise ValidationError("A pending or active loan already exists.")

        if serializer.validated_data.get('loan_amount', 0) <= 0:
            raise ValidationError("Loan amount must be greater than zero.")

        instance = serializer.save(employee=employee)
        AuditLog.objects.create(user=user, action=f"Loan Applied for {employee}: {instance.loan_amount}")

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def approve(self, request, pk=None):
        loan = self.get_object()
        if loan.status != 'pending':
            return Response({"detail": "Already processed."}, status=400)
            
        loan.status = 'approved'
        loan.save()
        AuditLog.objects.create(user=request.user, action=f"Approved Loan: {loan.employee}")
        return Response({"message": "Approved."})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def reject(self, request, pk=None):
        loan = self.get_object()
        if loan.status != 'pending':
            return Response({"detail": "Already processed."}, status=400)
            
        loan.status = 'rejected'
        loan.save()
        AuditLog.objects.create(user=request.user, action=f"Rejected Loan: {loan.employee}")
        return Response({"message": "Rejected."})

    @action(detail=True, methods=['get'])
    def amortization(self, request, pk=None):
        loan = self.get_object()
        monthly = float(loan.monthly_payment)
        schedule = [
            {"installment_no": i, "amount": monthly, "status": "upcoming" if loan.status == 'approved' else "projected"}
            for i in range(1, loan.term_months + 1)
        ]
        return Response({
            "loan_amount": loan.loan_amount,
            "total_repayable": loan.total_amount,
            "monthly_amortization": loan.monthly_payment,
            "schedule": schedule
        })

    @action(detail=True, methods=['post'], permission_classes=[IsHR])
    def pay(self, request, pk=None):
        loan = self.get_object()
        loan.status = 'paid'
        loan.save()
        AuditLog.objects.create(user=request.user, action=f"Paid Loan: {loan.employee}")
        return Response({"message": "Marked as paid."})

