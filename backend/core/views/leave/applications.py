from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db import transaction
from django.utils import timezone
from ...models import LeaveRequest, Role
from ...services.leave_calendar import count_leave_working_days


class LeaveApplicationActions:
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

        if start_date == today or end_date == today:
            raise ValidationError("Today's date cannot be selected as the start or end date. Choose another date.")

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
            duration = count_leave_working_days(start_date, end_date)
            if duration == 0:
                raise ValidationError("Leave duration cannot be 0 working days. Weekends and public non-working holidays are excluded.")

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
            principal = employee.supervisor
            if not principal or not principal.user_id or not principal.user.is_active:
                raise ValidationError('Ask HR to assign a principal with an active account before filing.')
            if principal.pk == employee.pk:
                raise ValidationError('The applicant cannot be their own principal.')
            assignments = {'assigned_checker': None, 'assigned_principal': principal}
            initial_status = 'pending_supervisor'

        old_status = serializer.instance.status if serializer.instance else ''
        leave = serializer.save(employee=employee, working_days_applied=duration,
                                status=initial_status, workflow=workflow,
                                correction_reason='', **assignments)
        self._record_action(leave, user, old_status, 'Application resubmitted' if old_status else 'Application submitted')

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
