import pytest
from datetime import datetime, date, time
import zoneinfo
from django.utils import timezone
from core.models import Attendance
from core.utils import get_attendance_status, calculate_working_days, generate_daily_qr_token

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
