# Revision Specification: REV-08
## Title: Database Query Optimization, Indexing, and Atomic Leave Accrual

### 1. Objective & Problem Statement
1. In `backend/core/views/employee.py`, `award_yearly_credits` runs an iterative Python loop executing `emp.save()` for every employee in the system (N+1 database update query).
2. Frequently filtered fields (`Attendance.is_dtr_approved`, `Payroll.cutoff_period`, `Payroll.status`, `LeaveRequest.status`) lack B-tree database indexes, causing full table scans during report generation.
3. Teaching staff are incorrectly awarded 15 Vacation / 15 Sick leave credits; in DepEd, teachers earn Service Credits instead of annual VL/SL credits.

### 2. Files to Modify
- [`backend/core/models/attendance.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/models/attendance.py)
- [`backend/core/models/payroll.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/models/payroll.py)
- [`backend/core/models/leave.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/models/leave.py)
- [`backend/core/views/employee.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS_jerwin/backend/core/views/employee.py)

### 3. Step-by-Step Implementation Instructions

#### Step 1: Add Database Indexes to Models
1. In `Attendance` model:
   ```python
   is_dtr_approved = models.BooleanField(default=False, db_index=True)
   status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present', db_index=True)
   ```
2. In `Payroll` model:
   ```python
   cutoff_period = models.CharField(max_length=50, default="May 1-15, 2026", db_index=True)
   status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', db_index=True)
   ```
3. In `LeaveRequest` model:
   ```python
   status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending_supervisor', db_index=True)
   leave_type = models.CharField(max_length=50, choices=TYPE_CHOICES, db_index=True)
   ```

#### Step 2: Refactor `award_yearly_credits` with Atomic `F()` Expressions
In `backend/core/views/employee.py`:
```python
@action(detail=False, methods=['POST'], permission_classes=[IsAdminOrHRorSuperintendent])
def award_yearly_credits(self, request):
    from django.db.models import F
    from decimal import Decimal

    # DepEd Rule: Only Non-Teaching & Administrative personnel earn standard 15 VL / 15 SL credits.
    # Teaching staff are under Teacher's Leave Basis (PVP) and earn Service Credits.
    non_teaching_employees = Employee.objects.filter(
        user__role__in=[Role.NON_TEACHING, Role.ADMINISTRATIVE, Role.HR, Role.ACCOUNTANT]
    )
    count = non_teaching_employees.count()

    # Perform atomic single SQL UPDATE
    non_teaching_employees.update(
        vacation_leave_balance=F('vacation_leave_balance') + Decimal('15.0'),
        sick_leave_balance=F('sick_leave_balance') + Decimal('15.0')
    )

    AuditLog.objects.create(
        user=request.user, 
        action=f"Awarded yearly leave credits (+15 days) to {count} eligible non-teaching personnel."
    )
    return Response({"message": f"Successfully awarded 15 leave credits to {count} non-teaching personnel."})
```

#### Step 3: Run Database Migrations
```bash
python manage.py makemigrations core
python manage.py migrate
```

### 4. Verification & Acceptance Criteria
1. Migrations apply indexes to SQLite / PostgreSQL schema successfully.
2. Executing `award_yearly_credits` completes in a single SQL statement (verified via Django Debug Toolbar or SQL query logging).
3. Teaching staff leave balances remain unchanged while non-teaching staff balances increase by 15.0.
