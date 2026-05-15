from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q
from datetime import datetime
from ..models import Attendance, LeaveRequest, Role, AuditLog
from ..serializers import AttendanceSerializer, LeaveRequestSerializer
from ..permissions import IsAdminOrHR
from ..utils import validate_attendance_geo, get_attendance_status, generate_daily_qr_token

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR]:
            return Attendance.objects.all()
        return Attendance.objects.filter(employee__user=user)

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])

    def get_daily_qr(self, request):
        try:
            token = generate_daily_qr_token()
            return Response({"token": token, "date": timezone.now().date()})
        except Exception as e:
            print(f"ERROR generating QR: {e}")
            return Response({"detail": "Failed to generate QR code."}, status=400)

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def scan(self, request):
        """Processes a QR scan for Time In/Out with Geo-validation."""
        user = request.user
        if not hasattr(user, 'employee_profile'):
            return Response({"detail": "User account is not registered as an employee."}, status=400)
        
        employee = user.employee_profile
        token = request.data.get('qr_token')
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        if lat is None or lng is None:
            return Response({"detail": "GPS coordinates are required."}, status=400)

        # 1. Validate QR Token
        if token != generate_daily_qr_token():
            return Response({"detail": "Invalid or expired QR code."}, status=400)

        if not employee.school:
            return Response({"detail": "Profile has no assigned school workstation."}, status=400)

        # 2. Geo-Validation
        is_valid, distance = validate_attendance_geo(
            lat, lng, employee.school.latitude, employee.school.longitude, employee.school.radius_meters
        )

        if not is_valid:
            return Response({
                "detail": f"Check-in failed. You are {round(distance, 1)}m away from your workstation.",
                "distance": round(distance, 2)
            }, status=400)

        # 3. Process Attendance Logic
        today = timezone.now().date()
        attendance = Attendance.objects.filter(employee=employee, date=today).first()

        if attendance:
            if attendance.time_out:
                return Response({"detail": "Attendance already completed for today."}, status=400)
            
            # Cooldown check (10s)
            now = timezone.now()
            time_in_dt = timezone.make_aware(datetime.combine(today, attendance.time_in))
            if (now - time_in_dt).total_seconds() < 10:
                return Response({"detail": "Cooldown active. Please wait 10s after Time In."}, status=400)

            # Record Time Out
            attendance.time_out = now.time()
            attendance.save()
            return Response({
                "message": "Time Out recorded successfully.",
                "status": attendance.status,
                "time_out": attendance.time_out,
                "distance": round(distance, 2)
            })

        # Record Time In
        attendance = Attendance.objects.create(
            employee=employee,
            time_in=timezone.now().time(),
            status=get_attendance_status(timezone.now()),
            latitude=lat,
            longitude=lng
        )

        return Response({
            "message": "Time In recorded successfully.",
            "status": attendance.status,
            "time_in": attendance.time_in,
            "distance": round(distance, 2)
        })


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

