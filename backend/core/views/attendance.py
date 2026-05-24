from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime
from ..models import Attendance, Role
from ..serializers import AttendanceSerializer
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
                "detail": f"Workstation check-in failed. You are {round(distance, 1)}m away from your workstation.",
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


