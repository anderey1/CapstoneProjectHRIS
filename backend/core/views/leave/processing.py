from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from ...models import LeaveRequest, LeaveAction, AuditLog, Employee
from ...serializers import LeaveApprovalSerializer


class LeaveProcessingActions:
    @staticmethod
    def _record_action(leave, user, old_status, note):
        LeaveAction.objects.create(
            leave=leave, actor=user, actor_name=user.get_full_name() or user.username,
            from_status=old_status, to_status=leave.status, note=note,
            signature=leave.principal_signature.name if old_status == 'pending_supervisor' and leave.workflow == 'teaching' and leave.status == 'pending_records' else None,
        )
        AuditLog.objects.create(user=user, action=f'Leave #{leave.pk}: {note} ({old_status or "new"} -> {leave.status})')

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def approve(self, request, pk=None):
        visible_leave = self.get_object()
        leave = LeaveRequest.objects.select_for_update().select_related('employee__user').get(pk=visible_leave.pk)
        if leave.status in ('approved', 'rejected'):
            return Response({'detail': 'This request has already been finalized.'}, status=400)
        if not leave.can_process(request.user):
            raise PermissionDenied('You cannot process this request at its current stage.')
        payload = LeaveApprovalSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        if payload.validated_data.get('expected_status', leave.status) != leave.status:
            raise ValidationError('This application has moved to another stage. Refresh the queue before processing it.')
        old_status = leave.status
        days_deducted = None

        if leave.workflow == 'teaching':
            if old_status == 'pending_checking':
                leave.assigned_checker = request.user.employee_profile
                leave.status = 'pending_supervisor'
                message = 'Checked and forwarded to principal'
            elif old_status == 'pending_supervisor':
                signature = payload.validated_data.get('signature')
                if not signature or not payload.validated_data['signature_confirmed']:
                    raise ValidationError('Upload your signature image and confirm that you approve this application.')
                leave.principal_signature = signature
                leave.principal_signed_by = request.user
                leave.principal_signed_at = timezone.now()
                leave.status = 'pending_records'
                message = 'Approved and signed by principal; forwarded to Records Unit'
            elif old_status == 'pending_records':
                leave.records_reference = payload.validated_data.get('records_reference', '')
                leave.status = 'pending_hr'
                message = 'Received by Records Unit and forwarded to HR'
            elif old_status == 'pending_hr':
                days_deducted = self._deduct_balance(leave)
                leave.status = 'approved'
                leave.approved_days_with_pay = leave.working_days_applied
                message = 'Processing completed by HR'
        else:
            if old_status == 'pending_supervisor':
                leave.status = 'pending_hr'
                message = 'Leave request recommended to HR'
            elif old_status == 'pending_hr':
                leave.status = 'pending_superintendent'
                message = 'Leave request recommended and sent to Superintendent'
            elif old_status == 'pending_superintendent':
                days_deducted = self._deduct_balance(leave)
                leave.status = 'approved'
                leave.approved_days_with_pay = leave.working_days_applied
                message = 'Leave request approved'

        leave.save()
        self._record_action(leave, request.user, old_status, message)
        result = {'message': message, 'status': leave.status}
        if days_deducted is not None:
            result['days_deducted'] = float(days_deducted)
        return Response(result)

    @staticmethod
    def _deduct_balance(leave):
        employee = Employee.objects.select_for_update().get(pk=leave.employee_id)
        try:
            return employee.deduct_leave(leave.leave_type, leave.working_days_applied)
        except DjangoValidationError as error:
            raise ValidationError(error.messages) from error

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def reject(self, request, pk=None):
        visible_leave = self.get_object()
        leave = LeaveRequest.objects.select_for_update().get(pk=visible_leave.pk)
        if leave.status in ('approved', 'rejected'):
            return Response({'detail': 'This request has already been processed.'}, status=400)
        if not leave.can_process(request.user):
            raise PermissionDenied('You cannot disapprove this request at its current stage.')
        if leave.workflow == 'teaching' and leave.status in ('pending_checking', 'pending_records'):
            raise PermissionDenied('Checking and receiving staff can return an application for correction, rather than disapprove it.')
        reason = str(request.data.get('disapproval_reason', '')).strip()
        if not reason:
            raise ValidationError('A disapproval reason is required.')
        old_status = leave.status
        leave.rejection_stage = old_status
        leave.status = 'rejected'
        leave.disapproval_reason = reason
        leave.save()
        self._record_action(leave, request.user, old_status, reason)
        return Response({'message': 'Leave request rejected', 'status': leave.status})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], url_path='return-for-correction')
    @transaction.atomic
    def return_for_correction(self, request, pk=None):
        visible_leave = self.get_object()
        leave = LeaveRequest.objects.select_for_update().get(pk=visible_leave.pk)
        if leave.workflow != 'teaching' or not leave.can_process(request.user):
            raise PermissionDenied('You cannot return this application at its current stage.')
        reason = str(request.data.get('reason', '')).strip()
        if not reason:
            raise ValidationError('Explain what the applicant needs to correct.')
        old_status = leave.status
        leave.status = 'returned'
        leave.correction_reason = reason
        leave.principal_signature = None
        leave.principal_signed_by = None
        leave.principal_signed_at = None
        leave.records_reference = ''
        leave.save()
        self._record_action(leave, request.user, old_status, reason)
        return Response({'message': 'Application returned for correction', 'status': leave.status})
