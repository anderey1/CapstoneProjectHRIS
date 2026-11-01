from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from ...models import Employee, ProvidentLoan, Role, AuditLog


class LoanApplicationActions:
    def perform_create(self, serializer):
        user = self.request.user
        employee_id = self.request.data.get('employee')
        # 1. Target Employee Identification
        if user.role in [Role.ADMINISTRATIVE, Role.HR] and employee_id:
            employee = get_object_or_404(Employee, id=employee_id)
        else:
            employee = Employee.objects.filter(user=user).first()
            if not employee:
                raise ValidationError({"detail": "You must have an employee profile."})

        # 2. Validation — no duplicate active loans
        if ProvidentLoan.objects.filter(employee=employee, status__in=['pending', 'verified', 'approved', 'released']).exists():
            raise ValidationError({"detail": "A pending, approved, or active loan already exists."})

        if serializer.validated_data.get('loan_amount', 0) <= 0:
            raise ValidationError({"detail": "Loan amount must be greater than zero."})

        instance = serializer.save(employee=employee)
        AuditLog.objects.create(
            user=user,
            action=f"Loan Applied for {employee}: ₱{instance.loan_amount} ({instance.get_purpose_display()})"
        )

    @action(detail=True, methods=['post'])
    def resubmit(self, request, pk=None):
        """Allows employee to update and resubmit a rejected loan."""
        loan = get_object_or_404(ProvidentLoan, pk=pk)
        if loan.employee.user != request.user and not request.user.is_superuser:
            return Response({"detail": "You can only resubmit your own rejected loans."}, status=status.HTTP_403_FORBIDDEN)
        if loan.status != 'rejected':
            return Response({"detail": "Only rejected loans can be resubmitted."}, status=status.HTTP_400_BAD_REQUEST)

        # Reset status and clear old remarks
        serializer = self.get_serializer(loan, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(status='pending', remarks='')

        AuditLog.objects.create(user=request.user, action=f"Resubmitted Loan #{loan.id}")
        return Response(serializer.data)
