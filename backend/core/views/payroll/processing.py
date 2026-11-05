from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from ...models import LoanPayment, Payroll, AuditLog
from ...permissions import IsAccountant, IsSuperintendent
from ...services.notification_updates import notify_employee


class PayrollProcessingActions:
    @action(detail=True, methods=['POST'], permission_classes=[IsSuperintendent])
    def approve(self, request, pk=None):
        """Approves a draft payroll record."""
        payroll = self.get_object()
        if payroll.status != 'draft':
            return Response({"detail": f"Cannot approve payroll in {payroll.status} status."}, status=400)

        payroll.status = 'approved'
        payroll.save()

        AuditLog.objects.create(user=request.user, action=f"Approved payroll: {payroll.employee} ({payroll.cutoff_period})")
        return Response({"message": "Payroll approved.", "status": "approved"})

    @action(detail=True, methods=['POST'], permission_classes=[IsAccountant], url_path='release')
    def release(self, request, pk=None):
        """Finalizes and releases payroll, recording loan deductions if any."""
        payroll = self.get_object()
        if payroll.status != 'approved':
            return Response({"detail": f"Cannot release payroll in {payroll.status} status. It must be approved first."}, status=400)

        with transaction.atomic():
            payroll = Payroll.objects.select_for_update().get(pk=payroll.pk)
            if payroll.status != 'approved':
                return Response({"detail": f"Cannot release payroll in {payroll.status} status. It must be approved first."}, status=400)

            payroll.status = 'released'
            payroll.date_released = timezone.now()
            payroll.save()
            notify_employee(payroll.employee, request.user, 'Payslip available', 'payroll', payroll.pk)

            # Record Loan Repayment if deduction was part of this payroll
            if payroll.loans > 0:
                payments = LoanPayment.allocate_payroll_deduction(
                    payroll.employee,
                    payroll.loans,
                    posted_by=request.user,
                )
                for payment in payments:
                    AuditLog.objects.create(
                        user=request.user,
                        action=f"Released payroll loan deduction: {payroll.employee} (₱{payment.amount_paid})"
                    )

            AuditLog.objects.create(user=request.user, action=f"Released payroll: {payroll.employee} ({payroll.cutoff_period})")

        return Response({"message": "Payroll released successfully.", "status": "released"})

    @action(detail=False, methods=['POST'], permission_classes=[IsSuperintendent])
    def bulk_approve(self, request):
        cutoff = request.data.get('cutoff', request.data.get('cutoff_period'))
        if not cutoff:
            return Response({"detail": "cutoff_period is required."}, status=400)

        draft_payrolls = Payroll.objects.filter(cutoff_period=cutoff, status='draft')
        if not draft_payrolls.exists():
            return Response({"detail": f"No draft payroll records found for cutoff: {cutoff}."}, status=400)

        count = draft_payrolls.count()
        with transaction.atomic():
            draft_payrolls.update(status='approved')
            AuditLog.objects.create(
                user=request.user,
                action=f"Bulk approved {count} payroll records for cutoff: {cutoff}"
            )

        return Response({
            "message": f"Successfully approved {count} payroll records.",
            "count": count
        }, status=200)

    @action(detail=False, methods=['POST'], permission_classes=[IsAccountant])
    def bulk_release(self, request):
        cutoff = request.data.get('cutoff', request.data.get('cutoff_period'))
        if not cutoff:
            return Response({"detail": "cutoff_period is required."}, status=400)

        if not Payroll.objects.filter(cutoff_period=cutoff, status='approved').exists():
            return Response({"detail": f"No approved payroll records found for cutoff: {cutoff}."}, status=400)

        with transaction.atomic():
            approved_payrolls = list(
                Payroll.objects.select_for_update().filter(
                    cutoff_period=cutoff,
                    status='approved',
                )
            )
            if not approved_payrolls:
                return Response({"detail": f"No approved payroll records found for cutoff: {cutoff}."}, status=400)

            count = len(approved_payrolls)
            for payroll in approved_payrolls:
                payroll.status = 'released'
                payroll.date_released = timezone.now()
                payroll.save()
                notify_employee(payroll.employee, request.user, 'Payslip available', 'payroll', payroll.pk)

                # Record Loan Repayment if deduction was part of this payroll
                if payroll.loans > 0:
                    payments = LoanPayment.allocate_payroll_deduction(
                        payroll.employee,
                        payroll.loans,
                        posted_by=request.user,
                    )
                    for payment in payments:
                        AuditLog.objects.create(
                            user=request.user,
                            action=f"Released payroll loan deduction: {payroll.employee} (₱{payment.amount_paid})"
                        )

            AuditLog.objects.create(
                user=request.user,
                action=f"Bulk released {count} payroll records for cutoff: {cutoff}"
            )

        return Response({
            "message": f"Successfully released {count} payroll records.",
            "count": count
        }, status=200)
