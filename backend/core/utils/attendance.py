from django.utils import timezone
from datetime import datetime


def get_attendance_status(check_in_time):
    """
    Determines if check-in is 'present' or 'late'.
    Standard DepEd cut-off is 8:00 AM Philippine Standard Time.
    """
    local_time = timezone.localtime(check_in_time)
    cutoff_time = local_time.replace(hour=8, minute=0, second=0, microsecond=0)
    if local_time > cutoff_time:
        return 'late'
    return 'present'


def generate_daily_qr_token():
    """
    Generates a unique token for the current day.
    In a real app, use a more secure rotating hash.
    """
    from django.conf import settings
    import hashlib

    today = timezone.localdate().isoformat()
    # Simple hash of date + secret key
    seed = f"{today}-{settings.SECRET_KEY}"
    return hashlib.md5(seed.encode()).hexdigest()[:12].upper()


class AttendanceSlotError(Exception):
    def __init__(self, detail, requires_ot_confirmation=False):
        super().__init__(detail)
        self.detail = detail
        self.requires_ot_confirmation = requires_ot_confirmation


def resolve_attendance_slot(attendance, current_time, is_ot=False):
    """
    Evaluates current_time against DepEd slot windows and assigns the matching slot on `attendance`.
    Returns (slot_mapped, message).
    Raises AttendanceSlotError if invalid slot, window closed, or OT confirmation needed.
    """
    def t(time_str):
        return datetime.strptime(time_str, "%H:%M").time()

    slot_mapped = None
    message = ""

    # AM IN: 5:00 - 11:59 (AM IN allowed before 11:00 AM)
    if t("05:00") <= current_time < t("12:00"):
        if not attendance.am_in and current_time < t("11:00"):
            attendance.am_in = current_time
            slot_mapped = "am_in"
            message = "AM IN recorded."
        elif attendance.am_in and not attendance.am_out and current_time >= t("10:00"):
            attendance.am_out = current_time
            slot_mapped = "am_out"
            message = "AM OUT recorded."
        elif not attendance.am_in and current_time >= t("11:00"):
            raise AttendanceSlotError(
                "Morning check-in closed after 11:00 AM. Please check in at 12:00 PM for the afternoon (PM) session."
            )

    # AM OUT / PM IN overlap: 12:00 - 13:00
    if not slot_mapped and t("12:00") <= current_time < t("13:00"):
        if attendance.am_in and not attendance.am_out:
            attendance.am_out = current_time
            slot_mapped = "am_out"
            message = "AM OUT recorded."
        elif not attendance.pm_in:
            attendance.pm_in = current_time
            slot_mapped = "pm_in"
            message = "PM IN recorded."
        elif not attendance.am_out:
            attendance.am_out = current_time
            slot_mapped = "am_out"
            message = "AM OUT recorded."

    # PM IN / PM OUT: 13:00 - 23:59 (PM IN only allowed before 4:00 PM)
    if not slot_mapped and t("13:00") <= current_time <= t("23:59"):
        if not attendance.pm_in and current_time < t("16:00"):
            attendance.pm_in = current_time
            slot_mapped = "pm_in"
            message = "PM IN recorded."
        elif current_time >= t("15:00") and not attendance.pm_out:
            attendance.pm_out = current_time
            slot_mapped = "pm_out"
            message = "PM OUT recorded."
        elif attendance.pm_out:
            if not is_ot:
                raise AttendanceSlotError(
                    "Your regular hours for today are already complete (PM OUT recorded). To log overtime, please confirm.",
                    requires_ot_confirmation=True
                )
            if not attendance.ot_in:
                attendance.ot_in = current_time
                slot_mapped = "ot_in"
                message = "OT IN recorded."
            elif not attendance.ot_out:
                attendance.ot_out = current_time
                slot_mapped = "ot_out"
                message = "OT OUT recorded."

    if not slot_mapped:
        raise AttendanceSlotError(
            f"No valid slot available for this time ({current_time.strftime('%H:%M')}) or attendance already completed."
        )

    return slot_mapped, message
