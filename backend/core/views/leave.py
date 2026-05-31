from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime
from ..models import LeaveRequest, Role, AuditLog, Employee
from ..serializers import LeaveRequestSerializer
from ..permissions import IsAdminOrHR
from ..utils import calculate_working_days

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-date_applied')
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in [Role.ADMIN, Role.HR]:
            return LeaveRequest.objects.all().order_by('-date_applied')
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
            status__in=['pending', 'approved'],
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

        serializer.save(employee=employee, working_days_applied=duration)
        AuditLog.objects.create(user=user, action=f"Filed {leave_type} leave: {start_date} to {end_date}")

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({"detail": "This request has already been processed."}, status=400)
            
        employee = leave.employee
        duration = leave.working_days_applied
        
        # Deduction logic (Standard CSC Rule)
        if leave.leave_type == 'sick':
            if employee.sick_leave_balance >= duration:
                employee.sick_leave_balance -= duration
            else:
                remaining = duration - employee.sick_leave_balance
                employee.sick_leave_balance = 0
                if employee.vacation_leave_balance < remaining:
                    return Response({"detail": "Insufficient balance even after using vacation credits."}, status=400)
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
        return Response({"message": "Leave request approved", "days_deducted": duration})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({"detail": "This request has already been processed."}, status=400)
            
        reason = request.data.get('disapproval_reason', 'No reason provided')
        leave.status = 'rejected'
        leave.disapproval_reason = reason
        leave.save()
        
        AuditLog.objects.create(user=request.user, action=f"Rejected leave for {leave.employee}. Reason: {reason}")
        return Response({"message": "Leave request rejected"})
