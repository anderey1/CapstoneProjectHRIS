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
