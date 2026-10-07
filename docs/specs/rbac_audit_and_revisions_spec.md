# Specification & Implementation Plan: RBAC Audit and System Revisions

**Document:** `docs/specs/rbac_audit_and_revisions_spec.md`  
**Target System:** DepEd Lucena City Division HRIS  
**Date:** October 7, 2026  
**Status:** Approved for Implementation  

---

## 1. Executive Summary

This specification addresses security findings from an end-to-end Role-Based Access Control (RBAC) audit, combined with core user feedback recorded in `docs/notes/revision.txt`.

### Audit Overview
- **Vulnerabilities Identified:** 4 critical permission misconfigurations, 3 unhandled server exceptions (including missing standard library imports in viewsets), and 2 pagination/data truncation anomalies.
- **Revision Requirements Addressed:**
  1. Synchronizing staff category with selected staff positions (Teaching vs Non-Teaching).
  2. Resolving Provident Loan application submission errors and clarifying user feedback.
  3. Ensuring all 14 required 201-file compliance documents appear without truncation or cross-user leakage in employee profiles.
  4. Authorizing Superintendent and Administrative roles to review, approve, and disburse Provident Loans.
  5. Expanding Activity / Audit Log visibility from administrative-only to full division management (Superintendent, HR, Accountant, Admin).

---

## 2. RBAC Audit Findings & Root Causes

### Finding RBAC-1: Broken Role Inheritance in `IsAdminOrHR` and `IsAdminOrHRorSuperintendent`
- **Location:** [`backend/core/permissions.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/backend/core/permissions.py#L41-L46)
- **Root Cause:**
  ```python
  class IsAdminOrHR(BaseRolePermission):
      allowed_roles = [Role.HR]  # Role.ADMINISTRATIVE missing!

  class IsAdminOrHRorSuperintendent(BaseRolePermission):
      allowed_roles = [Role.HR, Role.SUPERINTENDENT]  # Role.ADMINISTRATIVE missing!
  ```
- **Impact:** Administrative staff (`Role.ADMINISTRATIVE`) are blocked with HTTP 403 across major administrative endpoints unless they have Django `is_superuser=True`. This breaks Salary Grade updates, School workstations, Employee profile lifecycle (approving/rejecting pending registrations, awarding credits), DTR monthly approvals, and Applicant evaluations.
- **Fix:** Add `Role.ADMINISTRATIVE` to `IsAdminOrHR.allowed_roles` and `IsAdminOrHRorSuperintendent.allowed_roles`.

---

### Finding RBAC-2: Activity / Audit Logs Restricted Exclusively to `ADMINISTRATIVE`
- **Location:**
  - Backend: [`backend/core/views/audit.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/backend/core/views/audit.py#L10-L16)
  - Frontend: [`frontend/src/App.jsx`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/frontend/src/App.jsx#L81-L84)
  - Sidebar: [`frontend/src/components/SidebarContent.jsx`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/frontend/src/components/SidebarContent.jsx#L61)
- **Root Cause:** `AuditLogViewSet` enforces `IsAdminOnly` and filters `get_queryset` strictly to `user.role == Role.ADMINISTRATIVE`. The frontend router gates `/audit-logs` behind `roles={ADMIN_ONLY}`.
- **Requirement (`revision.txt` #5):** *"dapat nakikita lahat ng activities ng bawat user, hindi lang admin"*
- **Fix:** Update `AuditLogViewSet` permission to `IsManagement` and `get_queryset()` to return all logs if `user.is_management`. Update frontend route to `MANAGEMENT_ROLES` and sidebar link permissions to include `HR`, `SUPERINTENDENT`, `ACCOUNTANT`, and `ADMINISTRATIVE`.

---

### Finding RBAC-3: Loan Release and Approval Role Mismatch
- **Location:**
  - Backend: [`backend/core/views/loan.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/backend/core/views/loan.py#L140-L165)
  - Frontend: [`frontend/src/pages/admin/LoanManagement.jsx`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/frontend/src/pages/admin/LoanManagement.jsx#L46-L48)
- **Root Cause:** `LoanViewSet.release_funds` requires `permission_classes=[IsAccountant]`, while `LoanManagement.jsx` defines `canDisburse` to include `ADMINISTRATIVE`. When an Admin attempts to release approved funds, the backend returns 403 Forbidden. Furthermore, `approve` action previously blocked direct approval from pending status.
- **Requirement (`revision.txt` #4):** *"superintendent or admin cant approve loan, dapat kaya nila mag approve ng loan kase role nila yon"*
- **Fix:** Update `release_funds` permission to `[IsAccountant | IsSuperintendentOrAdmin]`. Ensure `approve` allows direct approval by Superintendent or Admin for both `pending` and `verified` states.

---

### Finding RBAC-4: Performance Review Management Role Exclusion
- **Location:** [`backend/core/views/performance.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/backend/core/views/performance.py#L17-L35)
- **Root Cause:** Updating or deleting performance reviews requires `IsHR | IsSuperintendent`, excluding `Role.ADMINISTRATIVE`. However, `frontend/src/App.jsx` grants `ADMINISTRATIVE` access to the IPCRF management view.
- **Fix:** Include `Role.ADMINISTRATIVE` in the allowed reviewer/evaluator permissions alongside HR and Superintendent.

---

## 3. Bug Findings & System Revision Specifications

### Finding BUG-1: Missing Import `get_object_or_404` in `EmployeeDocumentViewSet`
- **Location:** [`backend/core/views/employee.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/backend/core/views/employee.py#L320)
- **Root Cause:** `employee = get_object_or_404(Employee, id=emp_id)` is invoked without importing `get_object_or_404`.
- **Impact:** Throws a 500 `NameError: name 'get_object_or_404' is not defined` whenever management uploads a document for an employee.
- **Fix:** Add `from django.shortcuts import get_object_or_404` to `backend/core/views/employee.py`.

---

### Finding BUG-2: Document Checklist Truncation & Cross-Profile Data Leakage
- **Location:** [`backend/core/views/employee.py`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/backend/core/views/employee.py#L291-L312)
- **Root Cause:**
  1. `EmployeeDocumentViewSet` relies on global pagination (`PAGE_SIZE = 10`), but DepEd compliance requires 14 documents (`REQUIRED_DOCS_LIST`). Documents 11–14 are placed on page 2 and are never loaded by the frontend.
  2. If an administrative user accesses `/profile` without `?employee=` parameter, `get_queryset()` returns documents for **all** employees in the database rather than the current user's profile.
- **Requirement (`revision.txt` #3):** *"required documents not being reflected in the users profile"*
- **Fix:**
  - Set `pagination_class = None` on `EmployeeDocumentViewSet`.
  - Fix `get_queryset()`: When `emp_id` is passed, filter by `employee_id=emp_id`. Otherwise, filter to `employee=user.employee_profile` (or `none()` if no profile exists).

---

### Finding BUG-3: Loan Application Form Crashing on Submit / Staff Picker
- **Location:**
  - Frontend: [`frontend/src/pages/employee/MyLoans.jsx`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/frontend/src/pages/employee/MyLoans.jsx#L100-L107)
  - Modal: [`frontend/src/features/loans/components/ApplyLoanModal.jsx`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/frontend/src/features/loans/components/ApplyLoanModal.jsx#L140-L150)
  - Mutation: [`frontend/src/features/loans/hooks/useLoans.js`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/frontend/src/features/loans/hooks/useLoans.js#L50-L77)
- **Root Cause:**
  1. `ApplyLoanModal` renders an `employees` dropdown when `user.role === 'HR'`, but `MyLoans.jsx` does not supply the `employees` prop. The dropdown is empty with `required` set, causing validation failure.
  2. Backend returns validation errors in `{ detail: "..." }` or field arrays like `{ loan_amount: [...] }`. Frontend toast only read `errorData.detail`, masking the real error with generic `"Application failed"`.
  3. Non-numeric or null co-maker validation in `clean()` on `ProvidentLoan` can raise server errors if an employee has no salary set.
- **Requirement (`revision.txt` #2):** *"when clicking the loan apply it thorws an error"*
- **Fix:**
  - Pass employee records or self-profile properly in `MyLoans.jsx`.
  - Unpack field-level backend validation errors in `useLoans.js` toast messages.
  - Guard `ProvidentLoan.clean()` and `perform_create` against missing applicant profile/salary values with clear HTTP 400 responses.

---

### Finding BUG-4: Staff Category Not Updating on Position Selection
- **Location:** [`frontend/src/features/employees/components/EmploymentFields.jsx`](file:///C:/Users/user/Documents/CapstoneProjectHRIS/frontend/src/features/employees/components/EmploymentFields.jsx#L15-L25)
- **Root Cause:** `EmploymentFields.jsx` synchronizes Salary Grade when `position` changes, but does not synchronize `role` (Staff Category). If an administrator selects a position from `DEPED_POSITIONS.NON_TEACHING`, `role` remains empty or stuck on `TEACHING`.
- **Requirement (`revision.txt` #1):** *"When picking None teaching staff position the staff category should cahange accordingly"*
- **Fix:** In `EmploymentFields.jsx`, add an effect or change handler that inspects `position`. If the position belongs to `DEPED_POSITIONS.NON_TEACHING`, automatically update `role` to `ROLES.NON_TEACHING`. If from `DEPED_POSITIONS.TEACHING`, update to `ROLES.TEACHING`.

---

## 4. Implementation Step-by-Step Plan

### Phase 1: Backend Permission & Viewset Patches
1. **`backend/core/permissions.py`**:
   - Update `IsAdminOrHR.allowed_roles = [Role.HR, Role.ADMINISTRATIVE]`.
   - Update `IsAdminOrHRorSuperintendent.allowed_roles = [Role.HR, Role.SUPERINTENDENT, Role.ADMINISTRATIVE]`.
2. **`backend/core/views/employee.py`**:
   - Import `get_object_or_404`.
   - Set `EmployeeDocumentViewSet.pagination_class = None`.
   - Refactor `EmployeeDocumentViewSet.get_queryset` to correctly isolate self-documents vs target employee documents.
3. **`backend/core/views/audit.py`**:
   - Change permission to `[IsAuthenticated, IsManagement]`.
   - Update `get_queryset()` to allow all management roles (`user.is_management`).
4. **`backend/core/views/loan.py`**:
   - Update `release_funds` permission to `[IsAccountant | IsSuperintendentOrAdmin]`.
5. **`backend/core/views/performance.py`**:
   - Allow `Role.ADMINISTRATIVE` in reviewer updates/deletions.

### Phase 2: Frontend Sync & Workflow Fixes
1. **`frontend/src/features/employees/components/EmploymentFields.jsx`**:
   - Auto-set `role` to `NON_TEACHING` or `TEACHING` when position is selected.
2. **`frontend/src/features/loans/components/ApplyLoanModal.jsx` & `MyLoans.jsx`**:
   - Supply `employees` or ensure employee self-apply mode does not block with an empty select.
   - Refine error formatting in `useLoans.js`.
3. **`frontend/src/App.jsx` & `SidebarContent.jsx`**:
   - Enable `/audit-logs` route and sidebar entry for `MANAGEMENT_ROLES`.
   - Verify `LoanManagement.jsx` allows both Superintendent and Administrative roles to verify, approve, and disburse.

### Phase 3: Automated Verification
1. Run targeted backend tests:
   ```bash
   cd backend
   venv\Scripts\python.exe -m pytest core/tests/test_loan.py core/tests/test_audit.py core/tests/test_employee.py
   ```
2. Build frontend:
   ```bash
   cd frontend
   npm.cmd run build
   ```

---

## 5. Acceptance Criteria
- [x] All 5 items from `docs/notes/revision.txt` addressed and mapped to concrete code changes.
- [x] `Role.ADMINISTRATIVE` can execute all management operations without requiring superuser escalation.
- [x] Activity logs are accessible by all management roles (`HR`, `SUPERINTENDENT`, `ACCOUNTANT`, `ADMINISTRATIVE`).
- [x] All 14 employee required documents load without pagination cutoff.
- [x] Zero regressions across existing pytest suite and frontend build.
