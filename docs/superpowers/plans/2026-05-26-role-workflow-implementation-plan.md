# Role-Based Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Accountant and Supervisor roles with restricted access to loans, payroll, and school geofencing.

**Architecture:** Update Django `Role` enum, implement custom DRF permissions, and update ViewSet method-level restrictions.

**Tech Stack:** Django, DRF, Python.

---

### Task 1: Add ACCOUNTANT Role

**Files:**
- Modify: `backend/core/models/employee.py`

- [ ] **Step 1: Add ACCOUNTANT to Role Enum**

```python
# backend/core/models/employee.py

class Role(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    HR = 'HR', 'HR Staff'
    SUPERVISOR = 'SUPERVISOR', 'Supervisor'
    ACCOUNTANT = 'ACCOUNTANT', 'Accountant'  # Add this
    EMPLOYEE = 'EMPLOYEE', 'Employee'
```

- [ ] **Step 2: Commit**

```bash
git add backend/core/models/employee.py
git commit -m "feat(roles): add ACCOUNTANT role"
```

### Task 2: Define Custom Permissions

**Files:**
- Modify: `backend/core/permissions.py`

- [ ] **Step 1: Add IsAccountant and IsSupervisor**

```python
# backend/core/permissions.py
from rest_framework import permissions
from .models import Role

class IsAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.ACCOUNTANT

class IsSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.SUPERVISOR
```

- [ ] **Step 2: Commit**

```bash
git add backend/core/permissions.py
git commit -m "feat(permissions): add IsAccountant and IsSupervisor"
```

### Task 3: Update LoanViewSet

**Files:**
- Modify: `backend/core/views/loan.py`

- [ ] **Step 1: Update approve/reject permissions**

```python
# backend/core/views/loan.py
from ..permissions import IsAdminOrHR, IsHR, IsSupervisor # Add IsSupervisor

# ... inside LoanViewSet

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR | IsSupervisor]) # Allow Supervisor
    def approve(self, request, pk=None):
        # ...

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR | IsSupervisor]) # Allow Supervisor
    def reject(self, request, pk=None):
        # ...
```

- [ ] **Step 2: Commit**

```bash
git add backend/core/views/loan.py
git commit -m "fix(loans): allow supervisor to approve/reject"
```

### Task 4: Update PayrollViewSet

**Files:**
- Modify: `backend/core/views/payroll.py`

- [ ] **Step 1: Restrict Payroll to Accountant/Admin**

```python
# backend/core/views/payroll.py
from ..permissions import IsAdminOrHR, IsAccountant # Add IsAccountant

# ... inside PayrollViewSet

    @action(detail=False, methods=['POST'], permission_classes=[IsAdminOrHR | IsAccountant])
    def generate(self, request):
        # ...
```

- [ ] **Step 2: Commit**

```bash
git add backend/core/views/payroll.py
git commit -m "fix(payroll): restrict generation to Accountant/Admin"
```

### Task 5: Restrict School Geofencing (Supervisor)

**Files:**
- Modify: `backend/core/views/...` (Need to locate where SchoolViewSet is, likely `backend/core/views/employee.py` or a new file if it doesn't exist).

*(Assuming `School` management might be in `backend/core/views/employee.py` based on folder structure)*

- [ ] **Step 1: Locate and update SchoolViewSet**

*(Search for SchoolViewSet...)*

- [ ] **Step 2: Implement permission restriction**

```python
# Assuming SchoolViewSet location...
from ..permissions import IsAdminOrHR, IsSupervisor

class SchoolViewSet(viewsets.ModelViewSet):
    # ...
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrHR() | IsSupervisor()]
        return [IsAuthenticated()]
```

- [ ] **Step 3: Commit**

```bash
git add backend/core/views/employee.py
git commit -m "fix(school): restrict geofencing settings to Supervisor"
```

### Task 6: Grant Accountant DTR Access

**Files:**
- Modify: `backend/core/views/attendance.py`

- [ ] **Step 1: Allow Accountant to view DTR data**

```python
# backend/core/views/attendance.py
from ..permissions import IsAdminOrHR, IsAccountant

class AttendanceViewSet(viewsets.ModelViewSet):
    # ...
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ['GET']:
            return [IsAuthenticated()] # Accountant needs GET
        return [IsAdminOrHR()]
```

- [ ] **Step 2: Commit**

```bash
git add backend/core/views/attendance.py
git commit -m "feat(attendance): grant Accountant read access"
```
