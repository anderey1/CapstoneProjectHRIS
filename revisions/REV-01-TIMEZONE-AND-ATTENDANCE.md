# Revision Specification: REV-01
## Title: Timezone Alignment (Asia/Manila) & Attendance Slot Correction

### 1. Objective & Problem Statement
The backend is currently configured with `TIME_ZONE = 'UTC'`. Because the Philippines operates under Philippine Standard Time (PST, UTC+8), `timezone.now().time()` evaluates to 00:00:00 when an employee scans at 8:00 AM local time. Consequently, morning attendance scans fail the AM window check (`05:00 <= current_time < 12:00`), failing to record `am_in`.

### 2. Files to Modify
- [`backend/config/settings.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/config/settings.py)
- [`backend/core/utils/__init__.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/utils/__init__.py)
- [`backend/core/views/attendance.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/views/attendance.py)

### 3. Step-by-Step Implementation Instructions

#### Step 1: Update Django Settings Timezone
In `backend/config/settings.py`:
```python
# Change from:
# TIME_ZONE = 'UTC'
# To:
TIME_ZONE = 'Asia/Manila'
USE_TZ = True
```

#### Step 2: Fix `get_attendance_status` in `core/utils/__init__.py`
Update `get_attendance_status` to ensure localized comparison against 8:00 AM:
```python
def get_attendance_status(check_in_time):
    """
    Determines if check-in is 'present' or 'late'.
    Standard DepEd cut-off is 8:00 AM Philippine Standard Time.
    """
    from django.utils import timezone
    local_time = timezone.localtime(check_in_time)
    cutoff = local_time.replace(hour=8, minute=0, second=0, microsecond=0)
    return 'late' if local_time > cutoff else 'present'
```

#### Step 3: Fix `AttendanceViewSet.scan` in `core/views/attendance.py`
In `AttendanceViewSet.scan()`:
1. Replace `now = timezone.now()` with `now = timezone.localtime(timezone.now())`.
2. Extract `today = now.date()` and `current_time = now.time()`.
3. Verify that the slot windows correctly recognize:
   - **AM IN:** `05:00` to `11:59`
   - **AM OUT:** `11:30` to `12:59`
   - **PM IN:** `12:00` to `13:30`
   - **PM OUT:** `16:30` to `19:00`
   - **OT IN / OUT:** `17:00` onwards

### 4. Verification & Acceptance Criteria
1. At 8:00 AM Manila Time, scanning the daily QR code must map to `attendance.am_in`.
2. A check-in at 8:05 AM Manila Time must mark `attendance.status = 'late'`.
3. A check-in at 7:45 AM Manila Time must mark `attendance.status = 'present'`.
4. Generated Form 48 DTR must display records in local Philippine dates and times.
