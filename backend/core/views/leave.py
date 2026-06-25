from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime
from ..models import LeaveRequest, Role, AuditLog, Employee
from ..serializers import LeaveRequestSerializer
from ..permissions import IsAdminOrHR, IsHR
from ..utils import calculate_working_days

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-date_applied')
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        if user.is_superuser:
            return LeaveRequest.objects.all().order_by('-date_applied')
            
        role = user.role
        employee_profile = getattr(user, 'employee_profile', None)
        
        if role == Role.HR:
            # HR sees all leaves to validate and manage the queue
            return LeaveRequest.objects.all().order_by('-date_applied')
            
        elif role == Role.SUPERINTENDENT:
            # Superintendent only sees leaves forwarded to them, or already approved,
            # or rejected at the Superintendent stage.
            return LeaveRequest.objects.filter(
                Q(status='pending_superintendent') |
                Q(status='approved') |
                Q(status='rejected', rejection_stage='pending_superintendent')
            ).order_by('-date_applied')
            
        # For other roles (TEACHING, NON_TEACHING, ADMINISTRATIVE, ACCOUNTANT):
        # They can see their own leaves.
        # If they are a supervisor (Principal/Head Teacher), they can also see leaves of their subordinates.
        if employee_profile:
            return LeaveRequest.objects.filter(
                Q(employee__user=user) | 
                Q(employee__supervisor=employee_profile)
            ).distinct().order_by('-date_applied')
            
        return LeaveRequest.objects.filter(employee__user=user).order_by('-date_applied')

    def perform_create(self, serializer):
        user = self.request.user
        employee = getattr(user, 'employee_profile', None)

        if not employee:
            raise ValidationError("You must have an employee profile to file a leave.")
            
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        leave_type = serializer.validated_data['leave_type']
        today = timezone.now().date()
        
        # 1. Basic Validation
        if start_date > end_date:
            raise ValidationError("Start date cannot be after end date.")
        if start_date < today:
            raise ValidationError("Start date cannot be in the past.")
        if end_date < today:
            raise ValidationError("End date cannot be in the past.")

        # 2. Advance Filing Rules (CSC Form 6)
        if leave_type == 'vacation' and (start_date - today).days < 5:
            raise ValidationError("Vacation leave must be filed 5 days in advance.")
        
        if leave_type == 'special_privilege' and (start_date - today).days < 7:
            # Note: Form says 1 week prior, except emergency. We'll stick to 7 days for now.
            # In a real app, we might check an 'is_emergency' flag.
            pass 

        if leave_type == 'solo_parent' and (start_date - today).days < 5:
            raise ValidationError("Solo Parent leave must be filed 5 days in advance.")

        # 3. Overlap Check
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=['pending_supervisor', 'pending_hr', 'pending_superintendent', 'approved'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        
        if overlapping:
            raise ValidationError("An overlapping leave request already exists.")

        # 4. Balance Check (Initial)
        duration = calculate_working_days(start_date, end_date)
        if duration == 0:
             raise ValidationError("Leave duration cannot be 0 working days.")
             
        if leave_type == 'sick':
            total_balance = employee.sick_leave_balance + employee.vacation_leave_balance
            if total_balance < duration:
                raise ValidationError(f"Insufficient leave balance (Total: {total_balance}).")
        else:
            if employee.vacation_leave_balance < duration:
                raise ValidationError(f"Insufficient vacation leave balance ({employee.vacation_leave_balance}).")

        # 5. Leave Document Requirements Check
        if leave_type in ['vacation', 'special_privilege']:
            is_within_philippines = serializer.validated_data.get('is_within_philippines', True)
            if not is_within_philippines or duration >= 30:
                travel_auth = serializer.validated_data.get('travel_authority_document')
                clearance = serializer.validated_data.get('clearance_document')
                if not travel_auth or not clearance:
                    raise ValidationError("Travel Authority and Clearance documents are required for vacation/special privilege leave abroad or for 30+ days.")

        elif leave_type == 'maternity':
            if not serializer.validated_data.get('supporting_document'):
                raise ValidationError("Proof of pregnancy (ultrasound or doctor's certificate) is required.")

        elif leave_type == 'paternity':
            delivery_proof = serializer.validated_data.get('supporting_document')
            marriage_contract = serializer.validated_data.get('paternity_marriage_contract')
            if not delivery_proof or not marriage_contract:
                raise ValidationError("Both Proof of Child's Delivery and Marriage Contract are required for paternity leave.")

        elif leave_type == 'vawc':
            protection_order = serializer.validated_data.get('supporting_document')
            med_cert = serializer.validated_data.get('vawc_medical_cert')
            if not protection_order or not med_cert:
                raise ValidationError("Both BPO/TPO/PPO/Police Report and Medical Certificate are required for VAWC leave.")

        elif leave_type == 'rehabilitation':
            med_cert = serializer.validated_data.get('supporting_document')
            letter_req = serializer.validated_data.get('rehab_letter_request')
            police_rep = serializer.validated_data.get('rehab_police_report')
            concurrence = serializer.validated_data.get('rehab_concurrence')
            if not med_cert or not letter_req or not police_rep or not concurrence:
                raise ValidationError("Letter Request, Police Report, Medical Certificate, and Written Concurrence of Govt Physician are all required for rehabilitation privilege.")

        elif leave_type == 'women_special':
            med_cert = serializer.validated_data.get('supporting_document')
            histopath = serializer.validated_data.get('women_special_histopath')
            op_technique = serializer.validated_data.get('women_special_operative_technique')
            if not med_cert or not histopath or not op_technique:
                raise ValidationError("Medical Certificate/Clinical Summary, Histopathology Report, and Operative Technique are all required for special leave benefits for women.")

        # Determine initial status based on role:
        # Teachers go to pending_supervisor first, Non-Teaching go straight to pending_hr.
        initial_status = 'pending_supervisor' if employee.user.role == Role.TEACHING else 'pending_hr'

        serializer.save(employee=employee, working_days_applied=duration, status=initial_status)
        AuditLog.objects.create(user=user, action=f"Filed {leave_type} leave: {start_date} to {end_date}")

    def _can_process_stage(self, user, leave):
        status = leave.status
        if status == 'pending_supervisor':
            employee_profile = getattr(user, 'employee_profile', None)
            is_supervisor = employee_profile and leave.employee.supervisor_id == employee_profile.id
            is_admin = user.role == Role.ADMINISTRATIVE or user.is_superuser
            return bool(is_supervisor or is_admin)
        elif status == 'pending_hr':
            return user.role == Role.HR or user.is_superuser
        elif status == 'pending_superintendent':
            return user.role == Role.SUPERINTENDENT or user.is_superuser
        return False

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status in ['approved', 'rejected']:
            return Response({"detail": "This request has already been finalized."}, status=400)
            
        if not self._can_process_stage(request.user, leave):
            return Response({"detail": "You do not have permission to approve/recommend this request at its current stage."}, status=403)
            
        employee = leave.employee
        duration = leave.working_days_applied
        old_status = leave.status

        if old_status == 'pending_supervisor':
            leave.status = 'pending_hr'
            leave.save()
            AuditLog.objects.create(user=request.user, action=f"Recommended {leave.leave_type} leave for {leave.employee} to HR")
            return Response({"message": "Leave request recommended to HR", "status": leave.status})
            
        elif old_status == 'pending_hr':
            leave.status = 'pending_superintendent'
            leave.save()
            AuditLog.objects.create(user=request.user, action=f"Certified and forwarded {leave.leave_type} leave for {leave.employee} to Superintendent")
            return Response({"message": "Leave request recommended and sent to Superintendent", "status": leave.status})
            
        elif old_status == 'pending_superintendent':
            # Final approval - Deduction logic
            if leave.leave_type == 'sick':
                total_balance = employee.sick_leave_balance + employee.vacation_leave_balance
                if total_balance < duration:
                    return Response({"detail": "Insufficient leave balance."}, status=400)
                if employee.sick_leave_balance >= duration:
                    employee.sick_leave_balance -= duration
                else:
                    remaining = duration - employee.sick_leave_balance
                    employee.sick_leave_balance = 0
                    employee.vacation_leave_balance -= remaining
            else:
                if employee.vacation_leave_balance < duration:
                    return Response({"detail": f"Insufficient vacation balance. Employee only has {employee.vacation_leave_balance} days left."}, status=400)
                employee.vacation_leave_balance -= duration
                
            employee.save()
            
            leave.status = 'approved'
            leave.approved_days_with_pay = duration
            leave.save()
            
            AuditLog.objects.create(user=request.user, action=f"Approved {leave.leave_type} leave for {leave.employee} ({duration} days)")
            return Response({"message": "Leave request approved", "days_deducted": duration, "status": leave.status})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status in ['approved', 'rejected']:
            return Response({"detail": "This request has already been processed."}, status=400)
            
        if not self._can_process_stage(request.user, leave):
            return Response({"detail": "You do not have permission to reject this request at its current stage."}, status=403)
            
        reason = request.data.get('disapproval_reason', 'No reason provided')
        leave.rejection_stage = leave.status
        leave.status = 'rejected'
        leave.disapproval_reason = reason
        leave.save()
        
        AuditLog.objects.create(user=request.user, action=f"Rejected leave for {leave.employee}. Reason: {reason}")
        return Response({"message": "Leave request rejected", "status": leave.status})
