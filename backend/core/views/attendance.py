from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime
from ..permissions import IsAdminOrHR, IsAccountant
from ..models import Attendance, Role
from ..serializers import AttendanceSerializer
from ..utils import validate_attendance_geo, get_attendance_status, generate_daily_qr_token
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
        if user.role in [Role.ADMIN, Role.HR, Role.ACCOUNTANT, Role.SUPERVISOR]:
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

        # 2. Geo-Validation
        is_in_zone, distance = validate_attendance_geo(
            lat, lng, employee.school.latitude, employee.school.longitude, employee.school.radius_meters
        )

        # 3. Slot-Based Logic
        now = timezone.now()
        today = now.date()
        current_time = now.time()
        
        attendance, created = Attendance.objects.get_or_create(
            employee=employee, 
            date=today,
            defaults={'status': get_attendance_status(now)}
        )

        slot_mapped = None
        message = ""

        # Slot Windows (Strict Chronological Check)
        # AM IN: 6:00 - 11:59
        if current_time >= datetime.strptime("06:00", "%H:%M").time() and current_time < datetime.strptime("12:00", "%H:%M").time():
            if not attendance.am_in:
                attendance.am_in = current_time
                slot_mapped = "am_in"
                message = "AM IN recorded."
            elif current_time >= datetime.strptime("11:00", "%H:%M").time() and not attendance.am_out:
                attendance.am_out = current_time
                slot_mapped = "am_out"
                message = "AM OUT recorded."

        # AM OUT / PM IN overlap: 12:00 - 13:00
        if not slot_mapped and current_time >= datetime.strptime("12:00", "%H:%M").time() and current_time < datetime.strptime("13:00", "%H:%M").time():
            if not attendance.am_out:
                attendance.am_out = current_time
                slot_mapped = "am_out"
                message = "AM OUT recorded."
            elif not attendance.pm_in:
                attendance.pm_in = current_time
                slot_mapped = "pm_in"
                message = "PM IN recorded."

        # PM IN / PM OUT: 13:00 - 20:00
        if not slot_mapped and current_time >= datetime.strptime("13:00", "%H:%M").time() and current_time < datetime.strptime("20:00", "%H:%M").time():
            if not attendance.pm_in:
                attendance.pm_in = current_time
                slot_mapped = "pm_in"
                message = "PM IN recorded."
            elif current_time >= datetime.strptime("16:00", "%H:%M").time() and not attendance.pm_out:
                attendance.pm_out = current_time
                slot_mapped = "pm_out"
                message = "PM OUT recorded."

        # OT: After PM OUT is filled or after 17:00
        if not slot_mapped and current_time >= datetime.strptime("17:00", "%H:%M").time():
            if attendance.pm_out:
                if not attendance.ot_in:
                    attendance.ot_in = current_time
                    slot_mapped = "ot_in"
                    message = "OT IN recorded."
                elif not attendance.ot_out:
                    attendance.ot_out = current_time
                    slot_mapped = "ot_out"
                    message = "OT OUT recorded."
            elif not attendance.pm_out and current_time >= datetime.strptime("16:00", "%H:%M").time():
                 # Fallback for late PM OUT
                attendance.pm_out = current_time
                slot_mapped = "pm_out"
                message = "PM OUT recorded."

        if not slot_mapped:
            return Response({"detail": "No valid slot available for this time or attendance already completed."}, status=400)

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

    @action(detail=False, methods=['POST'], permission_classes=[IsAdminOrHR])
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
            
        # Role-based access: Employees only see their own DTR
        if user.role not in [Role.ADMIN, Role.HR, Role.ACCOUNTANT]:
            if not hasattr(user, 'employee_profile'):
                return Response({"detail": "User has no employee profile."}, status=400)
            employee = user.employee_profile
        else:
            if not employee_id:
                return Response({"detail": "employee_id is required for administrative staff."}, status=400)
            employee = get_object_or_404(Employee, id=employee_id)
            
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


