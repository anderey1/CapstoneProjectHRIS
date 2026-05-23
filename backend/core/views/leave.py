from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime
from ..models import LeaveRequest, Role, AuditLog
from ..serializers import LeaveRequestSerializer
from ..permissions import IsAdminOrHR

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
        if not hasattr(user, 'employee_profile'):
            raise ValidationError("You must have an employee profile to file a leave.")
            
        employee = user.employee_profile
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        leave_type = serializer.validated_data['leave_type']
        
        # 1. Validation
        if start_date > end_date:
            raise ValidationError("Start date cannot be after end date.")

        if leave_type == 'vacation' and start_date < timezone.now().date():
            raise ValidationError("Vacation leave must be applied for in advance.")

        # 2. Overlap Check
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=['pending', 'approved'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        
        if overlapping:
            raise ValidationError("An overlapping leave request already exists.")

        # 3. Balance Check
        duration = (end_date - start_date).days + 1
        if leave_type == 'sick' and employee.sick_leave_balance < duration:
            raise ValidationError(f"Insufficient Sick Leave ({employee.sick_leave_balance} left).")
        
        if leave_type == 'vacation' and employee.vacation_leave_balance < duration:
            raise ValidationError(f"Insufficient Vacation Leave ({employee.vacation_leave_balance} left).")

        instance = serializer.save(employee=employee)
        AuditLog.objects.create(user=user, action=f"Filed {instance.leave_type} leave: {start_date} to {end_date}")

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({"detail": "This request has already been processed."}, status=400)
            
        employee = leave.employee
        duration = (leave.end_date - leave.start_date).days + 1
        
        # Deduction logic
        if leave.leave_type == 'sick':
            if employee.sick_leave_balance < duration:
                return Response({"detail": "Insufficient balance."}, status=400)
            employee.sick_leave_balance -= duration
        elif leave.leave_type == 'vacation':
            if employee.vacation_leave_balance < duration:
                return Response({"detail": "Insufficient balance."}, status=400)
            employee.vacation_leave_balance -= duration
            
        employee.save()
        leave.status = 'approved'
        leave.save()
        
        AuditLog.objects.create(user=request.user, action=f"Approved leave for {leave.employee} ({duration} days)")
        return Response({"message": "Leave request approved", "days_deducted": duration})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'rejected'
        leave.save()
        AuditLog.objects.create(user=request.user, action=f"Rejected leave for {leave.employee}")
        return Response({"message": "Leave request rejected"})
