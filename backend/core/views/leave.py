from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from ..models import LeaveRequest, LeaveAction, Role, AuditLog, Employee
from ..serializers import LeaveRequestSerializer, LeaveApprovalSerializer
from ..utils import calculate_working_days

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-date_applied')
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        base_qs = LeaveRequest.objects.select_related(
            'employee',
            'employee__user',
            'employee__school', 'assigned_checker', 'assigned_principal', 'principal_signed_by'
        ).prefetch_related('actions').order_by('-date_applied')

        if user.is_superuser:
            return base_qs.all()
            
        role = user.role
        employee_profile = getattr(user, 'employee_profile', None)
        
        if role == Role.HR:
            # HR sees all leaves to validate and manage the queue
            return base_qs.all()
            
        elif role == Role.SUPERINTENDENT:
            # Superintendent only sees leaves forwarded to them, or already approved,
            # or rejected at the Superintendent stage.
            return base_qs.filter(
                Q(status='pending_superintendent') |
                Q(status='approved') |
                Q(status='rejected', rejection_stage='pending_superintendent')
            )
            
        # For other roles (TEACHING, NON_TEACHING, ADMINISTRATIVE, ACCOUNTANT):
        # They can see their own leaves.
        # If they are a supervisor (Principal/Head Teacher), they can also see leaves of their subordinates.
        if employee_profile:
            scope = (
                Q(employee__user=user) | 
                Q(employee__supervisor=employee_profile, workflow='standard') |
                Q(assigned_checker=employee_profile) |
                Q(assigned_principal=employee_profile) |
                Q(actions__actor=user)
            )
            if employee_profile.leave_duty == 'records':
                scope |= Q(workflow='teaching', status='pending_records')
            if employee_profile.leave_duty == 'checker' and employee_profile.school_id:
                scope |= Q(workflow='teaching', status='pending_checking', assigned_checker__isnull=True,
                           employee__school_id=employee_profile.school_id)
            return base_qs.filter(scope).distinct()
            
        return base_qs.filter(employee__user=user)

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        employee = getattr(user, 'employee_profile', None)

        if not employee:
            raise ValidationError("You must have an employee profile to file a leave.")
            
        data = {field.name: getattr(serializer.instance, field.name) for field in LeaveRequest._meta.fields} if serializer.instance else {}
        data.update(serializer.validated_data)
        start_date = data['start_date']
        end_date = data['end_date']
        leave_type = data['leave_type']
        today = timezone.localdate()
        
        # 1. Basic Validation
        if start_date > end_date:
            raise ValidationError("Start date cannot be after end date.")

        # Retrospective leaves (CSC Form 6: Sick, Calamity/Emergency, Rehabilitation)
        RETROSPECTIVE_LEAVES = ['sick', 'emergency', 'rehabilitation']

        if leave_type not in RETROSPECTIVE_LEAVES:
            if start_date < today:
                raise ValidationError("Advance filing required. Start date cannot be in the past.")
            if end_date < today:
                raise ValidationError("End date cannot be in the past.")
        else:
            # Retrospective leaves allowed up to 30 calendar days upon return
            if (today - start_date).days > 30:
                raise ValidationError("Sick or Emergency leave must be filed within 30 calendar days of occurrence.")

        # 2. Advance Filing Rules (CSC Form 6)
        if leave_type == 'vacation' and (start_date - today).days < 5:
            raise ValidationError("Vacation leave must be filed 5 days in advance.")
        
        if leave_type == 'special_privilege' and (start_date - today).days < 7:
            pass 

        if leave_type == 'solo_parent' and (start_date - today).days < 5:
            raise ValidationError("Solo Parent leave must be filed 5 days in advance.")

        # 3. Overlap Check
        overlapping = LeaveRequest.objects.exclude(pk=serializer.instance.pk if serializer.instance else None).filter(
            employee=employee,
            status__in=['pending_checking', 'pending_supervisor', 'pending_records', 'pending_hr', 'pending_superintendent', 'approved'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        
        if overlapping:
            raise ValidationError("An overlapping leave request already exists.")

        # 4. Duration and Balance Check
        # Calendar-day statutory leaves vs working-day leaves
        CALENDAR_DAY_LEAVES = ['maternity', 'adoption']
        if leave_type in CALENDAR_DAY_LEAVES:
            duration = (end_date - start_date).days + 1
        else:
            duration = calculate_working_days(start_date, end_date)
            if duration == 0:
                raise ValidationError("Leave duration cannot be 0 working days.")

        # Balance check: Only leaves that consume leave credits (Vacation, Forced, Sick)
        # CSC MC No. 41, s. 1998 / Omnibus Rules on Leave
        if leave_type == 'sick':
            total_balance = employee.sick_leave_balance + employee.vacation_leave_balance
            if total_balance < duration:
                raise ValidationError(f"Insufficient leave balance (Total: {total_balance}).")
        elif leave_type in ['vacation', 'forced']:
            if employee.vacation_leave_balance < duration:
                raise ValidationError(f"Insufficient vacation leave balance ({employee.vacation_leave_balance}).")

        # 5. Leave Document Requirements Check
        if leave_type in ['vacation', 'special_privilege']:
            is_within_philippines = data.get('is_within_philippines', True)
            if not is_within_philippines or duration >= 30:
                travel_auth = data.get('travel_authority_document')
                clearance = data.get('clearance_document')
                if not travel_auth or not clearance:
                    raise ValidationError("Travel Authority and Clearance documents are required for vacation/special privilege leave abroad or for 30+ days.")

        elif leave_type == 'maternity':
            if not data.get('supporting_document'):
                raise ValidationError("Proof of pregnancy (ultrasound or doctor's certificate) is required.")

        elif leave_type == 'paternity':
            delivery_proof = data.get('supporting_document')
            marriage_contract = data.get('paternity_marriage_contract')
            if not delivery_proof or not marriage_contract:
                raise ValidationError("Both Proof of Child's Delivery and Marriage Contract are required for paternity leave.")

        elif leave_type == 'vawc':
            protection_order = data.get('supporting_document')
            med_cert = data.get('vawc_medical_cert')
            if not protection_order or not med_cert:
                raise ValidationError("Both BPO/TPO/PPO/Police Report and Medical Certificate are required for VAWC leave.")

        elif leave_type == 'rehabilitation':
            med_cert = data.get('supporting_document')
            letter_req = data.get('rehab_letter_request')
            police_rep = data.get('rehab_police_report')
            concurrence = data.get('rehab_concurrence')
            if not med_cert or not letter_req or not police_rep or not concurrence:
                raise ValidationError("Letter Request, Police Report, Medical Certificate, and Written Concurrence of Govt Physician are all required for rehabilitation privilege.")

        elif leave_type == 'women_special':
            med_cert = data.get('supporting_document')
            histopath = data.get('women_special_histopath')
            op_technique = data.get('women_special_operative_technique')
            if not med_cert or not histopath or not op_technique:
                raise ValidationError("Medical Certificate/Clinical Summary, Histopathology Report, and Operative Technique are all required for special leave benefits for women.")

        elif leave_type == 'sick':
            if duration > 5 and not data.get('supporting_document'):
                raise ValidationError("A Medical Certificate (CS Form 41 / Physician Cert) is required for sick leave exceeding 5 days.")

        workflow = 'teaching' if employee.user.role == Role.TEACHING else 'standard'
        assignments = {}
        initial_status = 'pending_hr'
        if workflow == 'teaching':
            checker = employee.leave_checker
            principal = employee.supervisor
            if not principal or not principal.user_id or not principal.user.is_active:
                raise ValidationError('Ask HR to assign a principal with an active account before filing.')
            if checker and (checker.leave_duty != 'checker' or not checker.user_id or not checker.user.is_active
                            or checker.pk in (employee.pk, principal.pk)):
                checker = None
            if principal.pk == employee.pk:
                raise ValidationError('The applicant cannot be their own principal.')
            assignments = {'assigned_checker': checker, 'assigned_principal': principal}
            initial_status = 'pending_checking'

        old_status = serializer.instance.status if serializer.instance else ''
        leave = serializer.save(employee=employee, working_days_applied=duration,
                                status=initial_status, workflow=workflow,
                                correction_reason='', **assignments)
        self._record_action(leave, user, old_status, 'Application resubmitted' if old_status else 'Application submitted')

    @staticmethod
    def _record_action(leave, user, old_status, note):
        LeaveAction.objects.create(
            leave=leave, actor=user, actor_name=user.get_full_name() or user.username,
            from_status=old_status, to_status=leave.status, note=note,
            signature=leave.principal_signature.name if old_status == 'pending_supervisor' and leave.workflow == 'teaching' and leave.status == 'pending_records' else None,
        )
        AuditLog.objects.create(user=user, action=f'Leave #{leave.pk}: {note} ({old_status or "new"} -> {leave.status})')

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        leave = self.get_object()
        locked = LeaveRequest.objects.select_for_update().get(pk=leave.pk)
        if locked.workflow != 'teaching' or locked.status != 'returned' or locked.employee.user_id != request.user.pk:
            raise PermissionDenied('Only the applicant can edit an application returned for correction.')
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        self.perform_create(serializer)

    def destroy(self, request, *args, **kwargs):
        raise PermissionDenied('Filed leave applications are retained as records and cannot be deleted.')

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
