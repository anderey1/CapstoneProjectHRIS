from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from ..permissions import IsAdminOrHR, IsAccountant, IsAdminOrHRorSuperintendent
from ..models import Attendance, Employee, Role
from ..serializers import AttendanceSerializer
from ..utils import (
    validate_attendance_geo,
    get_attendance_status,
    generate_daily_qr_token,
    resolve_attendance_slot,
    AttendanceSlotError,
)
from ..utils.pdf_generator import generate_form_48
from django.http import HttpResponse

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ['GET'] or self.action == 'scan':
            return [IsAuthenticated()]
        return [IsAdminOrHR()]

    def get_queryset(self):
        user = self.request.user
        if user.is_management:
            return Attendance.objects.all()
        return Attendance.objects.filter(employee__user=user)

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])

    def get_daily_qr(self, request):
        try:
            token = generate_daily_qr_token()
            return Response({"token": token, "date": timezone.localdate()})
        except Exception as e:
            print(f"ERROR generating QR: {e}")
            return Response({"detail": "Failed to generate QR code."}, status=400)

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def scan(self, request):
        """Processes a QR scan for DTR slot mapping with Geo-validation."""
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

        # 2. Geo-Validation (Bypassed for Core HRIS)
        is_in_zone, distance = True, 0.0

        # 3. Slot-Based Logic
        now = timezone.localtime(timezone.now())
        today = now.date()
        current_time = now.time()
        
        attendance, created = Attendance.objects.get_or_create(
            employee=employee, 
            date=today
        )

        # Anti-spam logic: enforce a minimum 2-minute cooldown between logs
        times = [t for t in [attendance.am_in, attendance.am_out, attendance.pm_in, attendance.pm_out, attendance.ot_in, attendance.ot_out] if t is not None]
        if times:
            latest_time = max(times)
            latest_dt = datetime.combine(today, latest_time)
            current_dt = datetime.combine(today, current_time)
            if current_dt - latest_dt < timedelta(minutes=2):
                diff = timedelta(minutes=2) - (current_dt - latest_dt)
                remaining_sec = int(diff.total_seconds())
                remaining_min = (remaining_sec // 60) + 1
                return Response({
                    "detail": f"Please wait {remaining_min} minute(s) before logging attendance again to prevent duplicate logs."
                }, status=400)

        # Update status if it's currently 'present' and we detect a 'late' condition
        current_status = get_attendance_status(now)
        if attendance.status == 'present' and current_status == 'late':
            attendance.status = 'late'

        try:
            slot_mapped, message = resolve_attendance_slot(
                attendance=attendance,
                current_time=current_time,
                is_ot=request.data.get('is_ot', False)
            )
        except AttendanceSlotError as e:
            err_payload = {"detail": e.detail}
            if e.requires_ot_confirmation:
                err_payload["requires_ot_confirmation"] = True
            return Response(err_payload, status=400)

        # Update Geo data
        attendance.latitude = lat
        attendance.longitude = lng
        if not is_in_zone:
            attendance.is_geo_flagged = True
        
        attendance.save()

        if not is_in_zone:
            message += f" (Note: Outside zone - {round(distance, 1)}m away)"

        return Response({
            "message": message,
            "slot": slot_mapped,
            "time": current_time,
            "status": attendance.status,
            "is_geo_flagged": attendance.is_geo_flagged,
            "distance": round(distance, 2)
        })

    @action(detail=False, methods=['POST'], permission_classes=[IsAdminOrHRorSuperintendent])
    def approve_dtr(self, request):
        """Approves all attendance records for an employee within a specific month."""
        employee_id = request.data.get('employee_id')
        month = request.data.get('month') # Expected format: YYYY-MM
        
        if not employee_id or not month:
            return Response({"detail": "employee_id and month (YYYY-MM) are required."}, status=400)
            
        try:
            year, month_num = map(int, month.split('-'))
        except ValueError:
            return Response({"detail": "Invalid month format. Use YYYY-MM."}, status=400)
            
        records = Attendance.objects.filter(
            employee_id=employee_id,
            date__year=year,
            date__month=month_num
        )
        
        if not records.exists():
            return Response({"detail": "No attendance records found for this month."}, status=404)
            
        count = records.update(
            is_dtr_approved=True,
            dtr_approved_by=request.user,
            dtr_approved_at=timezone.now()
        )
        
        return Response({
            "message": f"Successfully approved {count} DTR records.",
            "employee_id": employee_id,
            "month": month
        })

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def dtr_pdf(self, request):
        """Generates a Form 48 compliant DTR PDF for a specific month."""
        user = request.user
        employee_id = request.query_params.get('employee_id')
        month = request.query_params.get('month') # YYYY-MM
        
        if not month:
            return Response({"detail": "month (YYYY-MM) is required."}, status=400)
            
        # Allow HR/admin to export for a selected employee when provided;
        # otherwise fall back to the logged-in user's own profile.
        if employee_id:
            is_privileged = user.is_management
            target_employee = get_object_or_404(Employee, id=employee_id)
            is_own_profile = hasattr(user, 'employee_profile') and target_employee.id == user.employee_profile.id
            is_supervisor = hasattr(user, 'employee_profile') and target_employee.supervisor_id == user.employee_profile.id

            if not (is_privileged or is_own_profile or is_supervisor):
                return Response({"detail": "You do not have permission to view this employee's DTR."}, status=403)
            employee = target_employee
        else:
            employee = getattr(user, 'employee_profile', None)
            if not employee:
                return Response(
                    {"detail": "No employee profile is linked to this account."},
                    status=400
                )
            
        try:
            year, month_num = map(int, month.split('-'))
        except ValueError:
            return Response({"detail": "Invalid month format. Use YYYY-MM."}, status=400)
            
        records = Attendance.objects.filter(
            employee=employee,
            date__year=year,
            date__month=month_num
        ).order_by('date')
        
        cutoff = request.query_params.get('cutoff') # '1', '2', or 'split'
        
        pdf_content = generate_form_48(employee, month, records, cutoff=cutoff)
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"DTR_{employee.last_name}_{month}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response


