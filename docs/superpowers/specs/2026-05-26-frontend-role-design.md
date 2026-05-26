# Role-Based Frontend Design Specification

## Overview
Implement strict role-based navigation and role-specific dashboard summaries to support the new Accountant and Supervisor workflows in the HRIS prototype.

## 1. Role-Based Navigation (Strict Filtering)
Navigation menus (`SidebarContent.jsx`, `MobileBottomNav.jsx`) will dynamically filter items based on the user's role from `AuthContext`.

| Role | Navigation Access |
| :--- | :--- |
| **Accountant** | Payroll, Loans |
| **Supervisor** | Loan Approval, Attendance Management (incl. Geo-settings) |
| **HR Staff** | Employees, Leave Management, Recruitment |
| **Admin** | Full access |

## 2. Dashboard Summaries
Role-specific dashboards providing immediate access to relevant metrics and pending actions.

### Accountant Dashboard
*   **Payroll Summary Card:** Total processed in current cutoff, pending actions.
*   **Loan Health Card:** Pending loan applications (for payment), active loan summary.

### Supervisor Dashboard
*   **Loan Approval Card:** Pending loan applications (for approval).
*   **Attendance Alerts:** Flagged attendance records (geo-fencing).

## 3. Implementation Approach
*   **AuthContext:** Ensure `role` is included in the user state.
*   **Navigation Components:** Implement role-based visibility checks (`{user.role === 'ACCOUNTANT' && <MenuItem ... />}`).
*   **Dashboard Components:** Create new dashboard components or conditional rendering in `Dashboard.jsx` based on `user.role`.
