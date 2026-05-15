# Refactoring and Modularization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modularize the backend and frontend to improve maintainability, following the "1 file = 1 purpose" rule and other project mandates.

**Architecture:** 
- Backend: Move from monolithic `models.py`, `views.py`, and `serializers.py` to directory-based modules (`core/models/`, `core/views/`, `core/serializers/`). 
- Frontend: Decompose components >100 lines into smaller sub-components.

**Tech Stack:** Django (DRF), React (Vite, TanStack Query), DaisyUI.

---

### Task 1: Backend Models Modularization

**Files:**
- Create: `backend/core/models/__init__.py`
- Create: `backend/core/models/employee.py`
- Create: `backend/core/models/attendance.py`
- Create: `backend/core/models/loan.py`
- Create: `backend/core/models/payroll.py`
- Create: `backend/core/models/recruitment.py`
- Create: `backend/core/models/audit.py`
- Modify: `backend/core/models.py` (eventually empty or deleted)

- [x] **Step 1: Create `backend/core/models/` directory and `__init__.py`**
- [x] **Step 2: Migrate Employee and School models to `models/employee.py`**
- [x] **Step 3: Migrate Attendance model to `models/attendance.py`**
- [x] **Step 4: Migrate ProvidentLoan and LoanPayment models to `models/loan.py`**
- [x] **Step 5: Migrate Payroll model to `models/payroll.py`**
- [x] **Step 6: Migrate Applicant model to `models/recruitment.py`**
- [x] **Step 7: Migrate PerformanceReview model to `models/performance.py`**
- [x] **Step 8: Migrate AuditLog model to `models/audit.py`**
- [x] **Step 9: Update `backend/core/models/__init__.py` to export all models**
- [x] **Step 10: Update imports in views, serializers, and admin**
- [x] **Step 11: Verify with `python manage.py check`**

### Task 2: Backend Views Modularization

**Files:**
- Create: `backend/core/views/__init__.py`
- Create: `backend/core/views/employee.py`
- Create: `backend/core/views/attendance.py`
- Create: `backend/core/views/loan.py`
- Create: `backend/core/views/payroll.py`
- Create: `backend/core/views/recruitment.py`
- Create: `backend/core/views/performance.py`
- Create: `backend/core/views/analytics.py`
- Create: `backend/core/views/auth.py` (merge `auth_views.py`)
- Modify: `backend/core/views.py` (eventually empty or deleted)

- [x] **Step 1: Create `backend/core/views/` directory and `__init__.py`**
- [x] **Step 2: Move ViewSets and FBVs from `views.py` to their respective files**
- [x] **Step 3: Merge `auth_views.py` into `views/auth.py`**
- [x] **Step 4: Update `backend/core/views/__init__.py`**
- [x] **Step 5: Update `backend/core/urls.py` imports**
- [x] **Step 6: Verify API endpoints still work**

### Task 3: Backend Serializers Modularization & Logic Cleanup

**Files:**
- Create: `backend/core/serializers/__init__.py`
- Create: `backend/core/serializers/employee.py`
- Create: `backend/core/serializers/attendance.py` (merge `serializers_attendance.py`)
- ... similar for other domains
- Modify: `backend/core/serializers.py`

- [x] **Step 1: Create `backend/core/serializers/` directory**
- [x] **Step 2: Move serializers to domain files**
- [x] **Step 3: CLEANUP: Move `EmployeeSerializer.create` logic to `Employee.objects.create_user` (custom manager) or a service**
- [x] **Step 4: Update `backend/core/serializers/__init__.py`**
- [x] **Step 5: Update imports in views**

### Task 4: Frontend Component Decomposition - PersonnelFormModal

**Files:**
- Create: `frontend/src/components/features/employees/PersonalFields.jsx`
- Create: `frontend/src/components/features/employees/EmploymentFields.jsx`
- Modify: `frontend/src/components/features/employees/PersonnelFormModal.jsx`

- [x] **Step 1: Extract personal info fields to `PersonalFields.jsx`**
- [x] **Step 2: Extract employment fields to `EmploymentFields.jsx`**
- [x] **Step 3: Refactor `PersonnelFormModal.jsx` to use these sub-components**
- [x] **Step 4: Verify form still works and validation is intact**

### Task 5: Frontend Component Decomposition - AttendanceManagement

**Files:**
- Create: `frontend/src/components/features/attendance/AttendanceMap.jsx`
- Create: `frontend/src/components/features/attendance/AttendanceStats.jsx`
- Create: `frontend/src/components/features/attendance/AttendanceTable.jsx`
- Modify: `frontend/src/pages/admin/AttendanceManagement.jsx`

- [x] **Step 1: Extract Leaflet map logic to `AttendanceMap.jsx`**
- [x] **Step 2: Extract stats widgets to `AttendanceStats.jsx`**
- [x] **Step 3: Extract list table to `AttendanceTable.jsx`**
- [x] **Step 4: Refactor `AttendanceManagement.jsx` to be a clean orchestrator**
- [x] **Step 5: Verify map markers and real-time updates still work**
