import pytest
from datetime import datetime, date, time
from decimal import Decimal
import zoneinfo
from django.utils import timezone
from core.models import Attendance
from core.utils import (
    get_attendance_status,
    calculate_working_days,
    generate_daily_qr_token,
    resolve_attendance_slot,
    AttendanceSlotError,
    validate_attendance_geo,
)

class TestAttendanceTimekeeping:
    def test_status_present_before_cutoff(self):
        """Check-in at or before 8:00 AM Manila time is 'present'."""
        pst = zoneinfo.ZoneInfo("Asia/Manila")
        # 7:45 AM Manila time
        early_time = datetime(2026, 5, 4, 7, 45, 0, tzinfo=pst)
        assert get_attendance_status(early_time) == 'present'

    def test_status_late_after_cutoff(self):
        """Check-in after 8:00 AM Manila time is 'late'."""
        pst = zoneinfo.ZoneInfo("Asia/Manila")
        # 8:05 AM Manila time
        late_time = datetime(2026, 5, 4, 8, 5, 0, tzinfo=pst)
        assert get_attendance_status(late_time) == 'late'

    def test_calculate_working_days_excludes_weekends(self):
        """Mon to Sun should count only 5 working days."""
        monday = date(2026, 5, 4)
        sunday = date(2026, 5, 10)
        assert calculate_working_days(monday, sunday) == 5

    def test_calculate_working_days_same_day_weekday(self):
        """A single weekday counts as 1 day."""
        wednesday = date(2026, 5, 6)
        assert calculate_working_days(wednesday, wednesday) == 1

    def test_calculate_working_days_weekend_only(self):
        """Saturday to Sunday counts as 0 working days."""
        saturday = date(2026, 5, 9)
        sunday = date(2026, 5, 10)
        assert calculate_working_days(saturday, sunday) == 0

    def test_daily_qr_token_structure(self):
        """QR token is a deterministic uppercase 12-char hexadecimal string."""
        token = generate_daily_qr_token()
        assert len(token) == 12
        assert token.isalnum()
        assert token.isupper()

@pytest.mark.django_db
class TestAttendanceModel:
    def test_attendance_creation_and_slots(self, teacher_employee):
        """Attendance record stores am_in, pm_in and status."""
        today = timezone.localdate()
        record = Attendance.objects.create(
            employee=teacher_employee,
            date=today,
            am_in=time(7, 50),
            am_out=time(12, 0),
            pm_in=time(12, 55),
            pm_out=time(17, 0),
            status='present'
        )
        assert record.am_in == time(7, 50)
        assert record.status == 'present'
        assert record.is_dtr_approved is False


@pytest.fixture
def client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def teaching_user(teacher_employee):
    return teacher_employee.user


@pytest.fixture
def other_employee(non_teaching_employee):
    return non_teaching_employee


@pytest.mark.django_db
def test_unauthorized_employee_cannot_export_other_dtr(client, teaching_user, other_employee):
    """Regular teaching staff cannot download another employee's Form 48 DTR PDF."""
    client.force_authenticate(user=teaching_user)
    response = client.get(f'/api/attendance/dtr_pdf/?employee_id={other_employee.id}&month=2026-03')
    assert response.status_code == 403


@pytest.mark.django_db
def test_management_user_can_export_other_dtr(client, hr_user, other_employee):
    """Management user (e.g. HR) can download any employee's Form 48 DTR PDF."""
    client.force_authenticate(user=hr_user)
    response = client.get(f'/api/attendance/dtr_pdf/?employee_id={other_employee.id}&month=2026-03')
    assert response.status_code == 200
    assert response['Content-Type'] == 'application/pdf'


@pytest.mark.django_db
class TestAttendanceScanGeo:
    @staticmethod
    def freeze_scan_time(monkeypatch):
        fixed_now = datetime(
            2026, 5, 4, 7, 45, tzinfo=zoneinfo.ZoneInfo("Asia/Manila")
        )
        monkeypatch.setattr(timezone, "now", lambda: fixed_now)

    def test_scan_inside_school_geofence_persists_coordinates(self, client, teacher_employee, monkeypatch):
        self.freeze_scan_time(monkeypatch)
        client.force_authenticate(user=teacher_employee.user)
        school = teacher_employee.school

        response = client.post('/api/attendance/scan/', {
            "qr_token": generate_daily_qr_token(),
            "lat": str(school.latitude),
            "lng": str(school.longitude),
        }, format='json')

        assert response.status_code == 200
        assert response.data["is_geo_flagged"] is False
        assert response.data["distance"] == 0
        attendance = Attendance.objects.get(employee=teacher_employee)
        assert attendance.latitude == school.latitude
        assert attendance.longitude == school.longitude

    def test_scan_outside_school_geofence_is_flagged_and_persists_distance(
        self, client, teacher_employee, monkeypatch
    ):
        self.freeze_scan_time(monkeypatch)
        client.force_authenticate(user=teacher_employee.user)
        school = teacher_employee.school
        lat = school.latitude + Decimal("0.01")
        lng = school.longitude
        expected_in_zone, expected_distance = validate_attendance_geo(
            lat, lng, school.latitude, school.longitude, school.radius_meters
        )

        response = client.post('/api/attendance/scan/', {
            "qr_token": generate_daily_qr_token(),
            "lat": str(lat),
            "lng": str(lng),
        }, format='json')

        assert response.status_code == 200
        assert expected_in_zone is False
        assert response.data["is_geo_flagged"] is True
        assert response.data["distance"] == round(expected_distance, 2)
        attendance = Attendance.objects.get(employee=teacher_employee)
        assert attendance.latitude == lat
        assert attendance.longitude == lng
        assert attendance.is_geo_flagged is True

    def test_scan_without_school_is_rejected_without_attendance_record(
        self, client, teacher_employee, monkeypatch
    ):
        self.freeze_scan_time(monkeypatch)
        teacher_employee.school = None
        teacher_employee.save(update_fields=["school"])
        client.force_authenticate(user=teacher_employee.user)

        response = client.post('/api/attendance/scan/', {
            "qr_token": generate_daily_qr_token(),
            "lat": "13.937200",
            "lng": "121.617200",
        }, format='json')

        assert response.status_code == 400
        assert "no assigned school" in response.data["detail"].lower()
        assert not Attendance.objects.filter(employee=teacher_employee).exists()

    @pytest.mark.parametrize(
        ("lat", "lng"),
        [
            ("not-a-number", "121.617200"),
            ("91", "121.617200"),
            ("13.937200", "181"),
        ],
    )
    def test_scan_with_invalid_coordinates_is_rejected_without_attendance_record(
        self, client, teacher_employee, monkeypatch, lat, lng
    ):
        self.freeze_scan_time(monkeypatch)
        client.force_authenticate(user=teacher_employee.user)

        response = client.post('/api/attendance/scan/', {
            "qr_token": generate_daily_qr_token(),
            "lat": lat,
            "lng": lng,
        }, format='json')

        assert response.status_code == 400
        assert "numeric" in response.data["detail"]
        assert not Attendance.objects.filter(employee=teacher_employee).exists()


@pytest.mark.django_db
class TestResolveAttendanceSlot:
    def test_am_in_recorded_before_cutoff(self, teacher_employee):
        att = Attendance.objects.create(employee=teacher_employee, date=timezone.localdate())
        slot, msg = resolve_attendance_slot(att, time(7, 45))
        assert slot == "am_in"
        assert att.am_in == time(7, 45)
        assert "AM IN recorded" in msg

    def test_am_in_closed_after_eleven(self, teacher_employee):
        att = Attendance.objects.create(employee=teacher_employee, date=timezone.localdate())
        with pytest.raises(AttendanceSlotError) as exc_info:
            resolve_attendance_slot(att, time(11, 15))
        assert "Morning check-in closed" in exc_info.value.detail
        assert exc_info.value.requires_ot_confirmation is False

    def test_am_out_recorded_at_noon(self, teacher_employee):
        att = Attendance.objects.create(
            employee=teacher_employee,
            date=timezone.localdate(),
            am_in=time(7, 50)
        )
        slot, msg = resolve_attendance_slot(att, time(12, 1))
        assert slot == "am_out"
        assert att.am_out == time(12, 1)

    def test_pm_in_recorded_after_noon_without_morning(self, teacher_employee):
        att = Attendance.objects.create(employee=teacher_employee, date=timezone.localdate())
        slot, msg = resolve_attendance_slot(att, time(12, 30))
        assert slot == "pm_in"
        assert att.pm_in == time(12, 30)

    def test_ot_confirmation_prompt_when_day_complete(self, teacher_employee):
        att = Attendance.objects.create(
            employee=teacher_employee,
            date=timezone.localdate(),
            am_in=time(7, 50),
            am_out=time(12, 0),
            pm_in=time(13, 0),
            pm_out=time(17, 0)
        )
        with pytest.raises(AttendanceSlotError) as exc_info:
            resolve_attendance_slot(att, time(17, 30), is_ot=False)
        assert exc_info.value.requires_ot_confirmation is True

    def test_ot_in_recorded_when_confirmed(self, teacher_employee):
        att = Attendance.objects.create(
            employee=teacher_employee,
            date=timezone.localdate(),
            am_in=time(7, 50),
            am_out=time(12, 0),
            pm_in=time(13, 0),
            pm_out=time(17, 0)
        )
        slot, msg = resolve_attendance_slot(att, time(17, 30), is_ot=True)
        assert slot == "ot_in"
        assert att.ot_in == time(17, 30)
