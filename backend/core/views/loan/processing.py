from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from ...models import ProvidentLoan, AuditLog
from ...permissions import IsAccountant, IsSuperintendentOrAdmin
from ...services.notification_updates import notify_employee


class LoanProcessingActions:
    @action(detail=True, methods=['post'], permission_classes=[IsAccountant | IsSuperintendentOrAdmin])
    @transaction.atomic
    def verify(self, request, pk=None):
        """Accountant/Admin/Superintendent action to verify documents and mark as ready for approval."""
        loan = self.get_object()
        if loan.status != 'pending':
            return Response({"detail": "Only pending loans can be verified."}, status=status.HTTP_400_BAD_REQUEST)

        loan.status = 'verified'
        loan.save()
        notify_employee(loan.employee, request.user, f'Loan #{loan.pk}: verified', 'loan', loan.pk)

        AuditLog.objects.create(
            user=request.user,
            action=f"Verified loan documents for Loan #{loan.id} ({loan.employee})"
        )
        return Response({"message": "Loan documents verified. Sent for executive approval.", "status": "verified"})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperintendentOrAdmin])
    @transaction.atomic
    def approve(self, request, pk=None):
        """Superintendent or Admin action to approve a loan."""
        loan = self.get_object()
        if loan.status not in ['pending', 'verified']:
            return Response({"detail": "Only pending or verified loans can be approved."}, status=status.HTTP_400_BAD_REQUEST)

        loan.status = 'approved'
        loan.remarks = request.data.get('remarks', '')
        loan.reviewed_by = request.user
        loan.reviewed_at = timezone.now()
        loan.save()
        notify_employee(loan.employee, request.user, f'Loan #{loan.pk}: approved', 'loan', loan.pk)

        AuditLog.objects.create(user=request.user, action=f"Approved Loan: {loan.employee}")
        return Response({"message": "Loan approved.", "status": "approved"})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperintendentOrAdmin | IsAccountant])
    @transaction.atomic
    def reject(self, request, pk=None):
        """Rejects a loan. Accountant, Superintendent, or Admin can reject pending or verified loans."""
        loan = self.get_object()
        if loan.status not in ['pending', 'verified']:
            return Response({"detail": "Only pending or verified loans can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

        remarks = request.data.get('remarks', '')
        if not remarks:
            return Response(
                {"detail": "Remarks are required when rejecting a loan."},
                status=status.HTTP_400_BAD_REQUEST
            )

        loan.status = 'rejected'
        loan.remarks = remarks
        loan.reviewed_by = request.user
        loan.reviewed_at = timezone.now()
        loan.save()
        notify_employee(loan.employee, request.user, f'Loan #{loan.pk}: rejected', 'loan', loan.pk)

        AuditLog.objects.create(user=request.user, action=f"Rejected Loan #{loan.id}: {loan.employee}")
        return Response({"message": "Loan rejected.", "status": "rejected"})

    @action(detail=True, methods=['post'], permission_classes=[IsAccountant | IsSuperintendentOrAdmin], url_path='release-funds')
    def release_funds(self, request, pk=None):
        """Accountant action to release money after superintendent approval."""
        loan = self.get_object()
        with transaction.atomic():
            loan = ProvidentLoan.objects.select_for_update().get(pk=loan.pk)
            if loan.status != 'approved':
                return Response({"detail": "Only approved loans can be released."}, status=status.HTTP_400_BAD_REQUEST)

            loan.status = 'released'
            loan.date_granted = timezone.localdate()

            # Pull station code from employee school if blank
            if not loan.station_code and loan.employee.school:
                loan.station_code = loan.employee.school.name

            loan.save()
            notify_employee(loan.employee, request.user, f'Loan #{loan.pk}: released', 'loan', loan.pk)

        AuditLog.objects.create(user=request.user, action=f"Released Funds for Loan #{loan.id} ({loan.employee})")
        return Response({"message": "Loan funds released successfully.", "status": "released"})
