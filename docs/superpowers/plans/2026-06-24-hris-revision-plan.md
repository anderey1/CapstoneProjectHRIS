# HRIS Revision & Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the codebase by removing geofencing and facial recognition, standardizing the RBAC system on Employee/HR/Superintendent/Accountant, enforcing Superintendent approvals, implementing bulk payroll generation, yearly leave accumulation, and dual leave pie charts on the dashboard.

**Architecture:** Django Backend API (REST framework permissions & viewset method restrictions) & React Vite Frontend (routing guards, component state checks).

**Tech Stack:** Django 6.x, DRF, React, Tailwind CSS + DaisyUI.

---

### Task 1: Standardize Roles and Permission Classes

**Files:**
- Modify: `backend/core/models/employee.py`
- Modify: `backend/core/permissions.py`

- [ ] **Step 1: Check/Verify Role Enum in `employee.py`**
  Ensure the `Role` enum matches the design:
  ```python
  class Role(models.TextChoices):
      ADMIN = 'ADMIN', 'Administrator'
      HR = 'HR', 'HR Staff'
      ACCOUNTANT = 'ACCOUNTANT', 'Accountant'
      SUPERINTENDENT = 'SUPERINTENDENT', 'Superintendent'
      TEACHING = 'TEACHING', 'Teaching Staff'
      NON_TEACHING = 'NON_TEACHING', 'Non-Teaching Staff'
      ADMINISTRATIVE = 'ADMINISTRATIVE', 'Administrative Staff'  # Deprecating
  ```

- [ ] **Step 2: Update Permission Checks in `permissions.py`**
  Update permission classes:
  * Remove `ADMINISTRATIVE` from general access.
  * Define strict checks:
    ```python
    class IsSuperintendent(BaseRolePermission):
        allowed_roles = [Role.SUPERINTENDENT]

    class IsAccountant(BaseRolePermission):
        allowed_roles = [Role.ACCOUNTANT]

    class IsHR(BaseRolePermission):
        allowed_roles = [Role.HR]
    ```

- [ ] **Step 3: Commit Changes**
  ```bash
  git add backend/core/models/employee.py backend/core/permissions.py
  git commit -m "feat(roles): standardize RBAC roles and permissions check"
  ```

---

### Task 2: Restrict Audit Logging in Backend Views

**Files:**
- Modify: `backend/core/views/attendance.py`
- Modify: `backend/core/views/leave.py`
- Modify: `backend/core/views/loan.py`
- Modify: `backend/core/views/payroll.py`

- [ ] **Step 1: Implement conditional AuditLog creation**
  Wrap or check role before creating an AuditLog entry:
  ```python
  allowed_log_roles = [Role.TEACHING, Role.NON_TEACHING, Role.HR, Role.SUPERINTENDENT, Role.ACCOUNTANT]
  if request.user.role in allowed_log_roles:
      AuditLog.objects.create(user=request.user, action=...)
  ```
  Apply this pattern across all ViewSets.

- [ ] **Step 2: Commit Changes**
  ```bash
  git add backend/core/views/
  git commit -m "refactor(audit): restrict AuditLog entries to target roles only"
  ```

---

### Task 3: Revise Leave Approval & Yearly Accumulation

**Files:**
- Modify: `backend/core/views/leave.py`
- Modify: `backend/core/models/employee.py`

- [ ] **Step 1: Superintendent Leave Approval**
  Update `LeaveViewSet.approve` and `LeaveViewSet.reject` permissions to check `IsSuperintendent`.

- [ ] **Step 2: Balance Accumulation & Award Endpoint**
  * Leave credits shouldn't reset. Accumulation is default behavior (running balance).
  * Add a custom action `award_yearly_credits` to `EmployeeViewSet` or `LeaveViewSet` allowing HR or Superintendent to add `+15` credits to all active employees.

- [ ] **Step 3: Commit Changes**
  ```bash
  git add backend/core/views/leave.py
  git commit -m "feat(leaves): implement superintendent approval and yearly credit accrual action"
  ```

---

### Task 4: Revise Loan Approval & Disbursement Workflows

**Files:**
- Modify: `backend/core/views/loan.py`

- [ ] **Step 1: Set Loan Approver strictly to Superintendent**
  Update `approve` and `reject` actions to use `permission_classes=[IsSuperintendent]`.

- [ ] **Step 2: Set Loan Disburser strictly to Accountant**
  Update `release_funds` action to use `permission_classes=[IsAccountant]`.

- [ ] **Step 3: Commit Changes**
  ```bash
  git add backend/core/views/loan.py
  git commit -m "feat(loans): route loan approvals to Superintendent and release to Accountant"
  ```

---

### Task 5: Implement Bulk Payroll Generation and Release

**Files:**
- Modify: `backend/core/views/payroll.py`

- [ ] **Step 1: Create Bulk Payroll Generation Endpoint**
  Add `bulk_generate` POST action to `PayrollViewSet` accessible by HR/Accountant:
  ```python
  @action(detail=False, methods=['POST'], permission_classes=[IsHR | IsAccountant])
  def bulk_generate(self, request):
      # Cutoff parameter
      cutoff = request.data.get('cutoff_period')
      # Loop through active employees and calculate/save draft payroll records
  ```

- [ ] **Step 2: Superintendent Approval and Accountant Release**
  * Update `PayrollViewSet.approve` permission to `IsSuperintendent`.
  * Update `PayrollViewSet.release` permission to `IsAccountant`.

- [ ] **Step 3: Commit Changes**
  ```bash
  git add backend/core/views/payroll.py
  git commit -m "feat(payroll): implement bulk generate, superintendent approval, and accountant release"
  ```

---

### Task 6: Remove Facial Recognition and Geofencing (Maps)

**Files:**
- Modify: `backend/core/views/attendance.py`
- Modify: `frontend/src/pages/shared/Attendance.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/SidebarContent.jsx`

- [ ] **Step 1: Disable Backend Distance Check & Biometric Descriptor**
  * In `AttendanceViewSet.perform_create`, bypass location radius verification. Save scans as present without setting `is_geo_flagged=True`.
  * Delete/bypass any model saving for facial descriptors.

- [ ] **Step 2: Simplify Clock-in UI in React**
  * Open `Attendance.jsx` and delete imports of `face-api.js` and Leaflet map components.
  * Design a card layout containing a status message ("AM In recorded", etc.) and a big clean button to Clock In/Out.

- [ ] **Step 3: Remove Geofencing Mapping Pages**
  * Remove `LocationTracking.jsx` and `SchoolManagement.jsx` page files from routing (`App.jsx` and sidebar menu links).

- [ ] **Step 4: Commit Changes**
  ```bash
  git add backend/core/views/attendance.py frontend/
  git commit -m "refactor(cleanup): remove face-api and Leaflet maps, simplify clock-in flow"
  ```

---

### Task 7: Dual Segmented Leave Pie Charts & Applicant Form

**Files:**
- Modify: `backend/core/views/analytics.py`
- Modify: `frontend/src/pages/admin/AdminDashboard.jsx`
- Modify: `frontend/src/components/features/recruitment/AddApplicantModal.jsx`

- [ ] **Step 1: Segregated Leave Analytics Endpoint**
  Update the analytics views to return leave counts segregated by Teaching vs. Non-Teaching employee categories.

- [ ] **Step 2: Render Dual Pie Charts**
  In `AdminDashboard.jsx`, add two side-by-side Recharts `PieChart` components for "Teaching Leaves" and "Non-Teaching Leaves".

- [ ] **Step 3: Ensure Email on Applicant Form**
  Verify/add email input in `AddApplicantModal.jsx` matching applicant model constraints.

- [ ] **Step 4: Commit Changes**
  ```bash
  git add backend/core/views/analytics.py frontend/src/
  git commit -m "feat(dashboard): add dual leave pie charts and integrate applicant email field"
  ```
