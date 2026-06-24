# Design Spec: HRIS Core Features Revision & Codebase Cleanup
**Date:** 2026-06-24  
**Project:** DepEd Lucena City HRIS  
**Status:** Approved for Implementation  

---

## 1. Overview & Objectives
Based on panel feedback, the project requires aligning the codebase strictly with the core Human Resource Information System (HRIS) requirements. This spec details the cleanup and modifications to:
1. Standardize and restrict system actions based on four primary roles: **Employee (Teaching/Non-Teaching)**, **HR**, **Superintendent**, and **Accountant**.
2. Revise core workflows (Leaves, Loans, and Payroll) to enforce proper authorization boundaries.
3. Remove the premium/non-core features (Facial Recognition and Geo-Fencing) temporarily, deferring them to Chapters 4 and 5.
4. Implement requested enhancements: Email fields, bulk payroll generation, leave credit carry-over, and segmented leave pie charts.

---

## 2. Roles, Permissions, and Audit Logs

### A. Role Standardization
We will deprecate the general administrative roles (`Role.ADMINISTRATIVE`) and focus access levels on:
* **Employee (Teaching/Non-Teaching):** Can file leaves/loans, view their own DTR logs, and download individual payslips.
* **HR Staff:** Can view all personnel records, manage hiring/applicants, and view the global attendance logs.
* **Superintendent:** Serves as the executive authority. Approves all leaves, loans, payroll cutoffs, and applicant appointments.
* **Accountant:** Handles disbursement of released loans and processes/disburses payroll cutoff records.

### B. Access Control Mapping (RBAC)
* **Leaves:**
  * Application: Employee
  * Approval/Rejection: Superintendent (strictly `IsSuperintendent`)
* **Provident Loans:**
  * Application: Employee
  * Review/Approval: Superintendent (strictly `IsSuperintendent`)
  * Disbursement: Accountant (strictly `IsAccountant`)
* **Payroll:**
  * Generation (Bulk): HR or Accountant (creates `draft` state)
  * Approval: Superintendent (strictly `IsSuperintendent`)
  * Release/Disbursement: Accountant (strictly `IsAccountant`)
* **Hiring/Applicant Tracking:**
  * Screen/Update: HR
  * Final Appointment Approval: Superintendent (moves applicant to `hired` state and provisions Employee profile)

### C. Audit Log Restriction
* Update the AuditLog writing routine. The system will only write to the `AuditLog` table when the action is executed by a user with role `TEACHING`, `NON_TEACHING`, `HR`, `SUPERINTENDENT`, or `ACCOUNTANT`.
* Actions performed by superusers (`ADMIN`) or external system jobs will be skipped to keep the log audit-focused.

---

## 3. Core Workflows Revision

### A. Leave Credit Accumulation
* The existing `vacation_leave_balance` and `sick_leave_balance` will accumulate indefinitely without automatic reset at the end of the calendar year.
* We will add a backend action/utility for HR to award `+15` yearly leave credits, which adds directly to the running balances.

### B. Bulk Payroll Generation
* Modify the `PayrollViewSet` to support a `/api/payroll/bulk-generate/` POST endpoint.
* HR or Accountant selects a cutoff period. The backend loops through all active employees, calculates their basic salary from their linked Salary Grade and active attendance records, computes statutory deductions (SSS, PhilHealth, Pag-IBIG, Tax), subtracts any active loan payments, and creates a `draft` payroll record for each employee.
* Employees can only view/download their individual payslips once the Superintendent approves and the Accountant releases them.

---

## 4. Feature Removal & UI Re-layout

### A. Facial Recognition & Geo-Fencing Cleanups
* **Backend:**
  * Disable coordinates calculation (Haversine distance checks) in `AttendanceViewSet`. Scans will record coordinates if passed, but will never flag `is_geo_flagged` or block clock-ins.
  * Disable facial recognition descriptor matching and delete biometric registration views.
* **Frontend:**
  * **Attendance Page (`Attendance.jsx`):** Remove Leaflet Maps and the camera/facial scanning viewport. Replace it with a clean, high-contrast dashboard card containing a simple **Clock In** and **Clock Out** action button.
  * **Management Views:** Hide/remove the "School Geofencing" mapping tools page and coordinates setup files.

### B. Segmented Leave Pie Charts
* In the management/executive dashboard, replace the single leave chart with two distinct Pie Charts:
  1. **Teaching Staff Leaves:** Slices representing Vacation, Sick, and Emergency leaves for active Teaching employees.
  2. **Non-Teaching Staff Leaves:** Slices representing Vacation, Sick, and Emergency leaves for active Non-Teaching employees.
* Add support in the backend dashboard analytics endpoints to split current leaves by the employee's role category.

### C. Email Integration
* Verify and ensure the applicant email field is present and required in the frontend application modal (`AddApplicantModal.jsx`) and is saved correctly in the backend database.

---

## 5. System Safety & Error Handling
* Add fallback variables so that if attendance records are missing during bulk payroll generation, the system assumes standard full-month working days (11 days per semi-monthly cutoff) rather than throwing validation exceptions.
* Secure all financial and status update transactions (releasing loans, releasing payroll) with Django's `transaction.atomic()` to prevent partial database writes.
