# Role-Based Workflow Design - Accountant & Supervisor Roles

## Overview
Redesigning the HRIS workflow to enforce role-based access control, delegating specialized financial and operational tasks to new Accountant and Supervisor roles.

## Role Definitions

| Role | Core Responsibilities |
| :--- | :--- |
| **Accountant** | **NEW.** Payroll generation (based on DTR data), Loan money management (releasing funds), marking Loans as Paid. Read-only access to all DTR data. |
| **Supervisor** | **UPDATED.** Approval/Rejection of Loan Applications, setting School Geo-fencing parameters. |
| **HR Staff** | **UPDATED.** Employee profile maintenance, Leave management, Recruitment/Applicant tracking. |
| **Admin** | Full system access. |

## Workflow Changes

### 1. Loan Management
*   **Application:** Remains open (Employee/Admin/HR).
*   **Approval/Rejection:** Restricted to `SUPERVISOR` and `ADMIN`.
*   **Payment Tracking:** Managed by `ACCOUNTANT`.

### 2. Payroll Generation
*   **Trigger:** Automated based on DTR data.
*   **Generation/Processing:** Restricted to `ACCOUNTANT` and `ADMIN`.
*   **DTR Access:** `ACCOUNTANT` granted read-only access to DTR data for payroll calculation.

### 3. Attendance/Geo-fencing
*   **Parameters:** `SUPERVISOR` can set `School` coordinates and radius.

## Backend Technical Implementation

### Models
*   Update `backend/core/models/employee.py` to add `ACCOUNTANT` to `Role` choices.

### Permissions
*   Create new permission classes in `backend/core/permissions.py`:
    *   `IsAccountant`
    *   `IsSupervisor`
*   Update existing viewsets (`LoanViewSet`, `PayrollViewSet`, `AttendanceViewSet`) to utilize these new permission classes.

### ViewSets
*   `LoanViewSet`: Add logic to restrict approval/rejection actions.
*   `PayrollViewSet`: Restrict `generate` action to `IsAccountant`.
*   `SchoolViewSet`: Restrict editing school location data to `IsSupervisor`.
