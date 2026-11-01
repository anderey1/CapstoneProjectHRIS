from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from decimal import Decimal, InvalidOperation
from ...models import ProvidentLoan, LoanPayment, AuditLog
from ...serializers import LoanSerializer, LoanPaymentSerializer
from ...permissions import IsAdminOrHR, IsHR, IsAccountant


class LoanPaymentActions:
    @action(detail=True, methods=['post'], permission_classes=[IsAccountant | IsAdminOrHR], url_path='post-payment')
    def post_payment(self, request, pk=None):
        """Allows manual posting of a loan deduction/payment by Accountant or Admin/HR."""
        loan = self.get_object()
        if loan.status not in ['released', 'paid']:
            return Response({"detail": "Payments can only be posted for released/active loans."}, status=status.HTTP_400_BAD_REQUEST)

        amount_paid = request.data.get('amount_paid')
        if not amount_paid:
            return Response({"detail": "amount_paid is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount_paid = Decimal(str(amount_paid))
        except (InvalidOperation, TypeError, ValueError):
            return Response({"detail": "Invalid amount format."}, status=status.HTTP_400_BAD_REQUEST)

        if not amount_paid.is_finite() or amount_paid <= 0:
            return Response({"detail": "Amount paid must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            loan = ProvidentLoan.objects.select_for_update().get(pk=loan.pk)
            if loan.status not in ['released', 'paid']:
                return Response({"detail": "Payments can only be posted for released/active loans."}, status=status.HTTP_400_BAD_REQUEST)
            if amount_paid > max(loan.current_balance, Decimal('0.00')):
                return Response({"detail": "Amount paid cannot exceed the loan's current balance."}, status=status.HTTP_400_BAD_REQUEST)

            payment = LoanPayment.objects.create(
                loan=loan,
                amount_paid=amount_paid,
                posted_by=request.user
            )

        AuditLog.objects.create(
            user=request.user,
            action=f"Manually posted payment of ₱{amount_paid} for Loan #{loan.id} ({loan.employee})"
        )

        serializer = LoanSerializer(loan, context={'request': request})
        return Response({
            "message": "Payment posted successfully.",
            "payment": LoanPaymentSerializer(payment).data,
            "loan": serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsHR])
    def pay(self, request, pk=None):
        loan = self.get_object()
        loan.status = 'paid'
        loan.save()
        AuditLog.objects.create(user=request.user, action=f"Paid Loan: {loan.employee}")
        return Response({"message": "Marked as paid."})
