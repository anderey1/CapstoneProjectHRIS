# Frontend Institutional De-Slop Execution Checklist

> **Target Standard**: DepEd SDO Lucena City & Civil Service Commission (CSC) Institutional Design.
> Strict compliance with `DESIGN.md` (ENERGY 1 / RHYTHM 1 / MOTION 1, `#0038A8` DepEd Blue, Slate neutrals, Tabular Monospace figures, zero decorative AI card slop).
> Quality Gate: `npm.cmd run lint` (0 errors), `npm.cmd run build` (0 Vite errors).

---

## Progress Overview

| Phase | Module Domain | Status | Target Deliverables / Commit |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Authentication & Public Portals | **COMPLETED** | `Login.jsx`, `RegisterExisting.jsx`, `Apply.jsx` ([`e246d06`](https://github.com/anderey1/CapstoneProjectHRIS/commit/e246d06)) |
| **Phase 2** | Administrative Personnel Operations | **COMPLETED** | `Employees.jsx`, `Recruitment.jsx` ([`9984bac`](https://github.com/anderey1/CapstoneProjectHRIS/commit/9984bac)) |
| **Phase 3** | Attendance, Timekeeping & CSC Form 48 | **COMPLETED** | `AttendanceManagement.jsx`, `StaffDTRManagement.jsx`, `Attendance.jsx`, `DTR.jsx` ([`a12d81f`](https://github.com/anderey1/CapstoneProjectHRIS/commit/a12d81f)) |
| **Phase 4** | Leave Administration & CSC Form No. 6 | **COMPLETED** | `LeaveManagement.jsx`, `MyLeaves.jsx`, leave subcomponents ([`823f4c0`](https://github.com/anderey1/CapstoneProjectHRIS/commit/823f4c0)) |
| **Phase 5** | Performance (RPMS/IPCRF) & System Audit | **COMPLETED** | `IPCRFManagement.jsx`, `MyIPCRF.jsx`, `AuditLogs.jsx` |
| **Phase 6** | Executive Dashboards & Portals | **COMPLETED** | `AdminDashboard.jsx`, `EmployeeDashboard.jsx`, `MyPayroll.jsx`, role dashboards |

---

## Detailed Task Breakdown

### Completed Work

- [x] **Phase 1: Authentication & Public Portals**
  - [x] De-slop `frontend/src/pages/Login.jsx` (institutional DepEd seal header, compact form fields, keyboard focus).
  - [x] De-slop `frontend/src/pages/RegisterExisting.jsx` (DepEd division employee onboarding ledger).
  - [x] De-slop `frontend/src/pages/Apply.jsx` (DepEd Order No. 007, s. 2023 public applicant submission portal).
  - [x] Master specification written in `docs/specs/frontend_deslop_master_plan.md`.

- [x] **Phase 2: Personnel Operations**
  - [x] De-slop `frontend/src/pages/admin/Employees.jsx` (Plantilla roster table, search/station filter, quick actions).
  - [x] De-slop `frontend/src/pages/admin/Recruitment.jsx` (Replaced Trello-style kanban cards with DepEd Comparative Assessment Result [CAR] tabular matrix with rubric computation).
  - [x] Verified zero lint regressions and successful production build.

- [x] **Phase 3: Time, Attendance & DTR Compliance**
  - [x] De-slop `frontend/src/pages/admin/AttendanceManagement.jsx` (Division attendance stream, status indicators, monospace timestamps).
  - [x] De-slop `frontend/src/pages/admin/StaffDTRManagement.jsx` (CSC Form 48 Master Certification console with cutoff selection and signature blocks).
  - [x] De-slop `frontend/src/pages/shared/Attendance.jsx` (Utilitarian employee time-clock station with 7-day log ledger).
  - [x] De-slop `frontend/src/pages/shared/DTR.jsx` (Personal CSC Form 48 electronic view matching printed form layout).

- [x] **Phase 4: Leave & Benefits Administration**
  - [x] De-slop `frontend/src/pages/admin/LeaveManagement.jsx` (Replaced 3-column card grid with CSC Form No. 6 Division Processing Docket table and official review modal).
  - [x] De-slop `frontend/src/features/leaves/components/LeaveBalanceCards.jsx` (Compact Sec 7.B credit balance strip for VL/SL).
  - [x] De-slop `frontend/src/features/leaves/components/LeaveHistorySection.jsx` (Structured application audit table).
  - [x] De-slop `frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx` (Subordinate endorsement docket table).
  - [x] De-slop `frontend/src/pages/employee/MyLeaves.jsx` (Clean CSC Form 6 employee self-service orchestrator).
  - [x] Ran backend leave test suite (`test_leave.py`, 11 passed) and frontend build.

- [x] **Phase 5: Performance Evaluation & System Audit Trail**
  - [x] De-slop `frontend/src/pages/admin/IPCRFManagement.jsx` (RPMS / IPCRF Division Master Ledger with DepEd Order No. 2, s. 2015 scoring matrix, 4-metric strip, filter toolbar, docket view).
  - [x] De-slop `frontend/src/components/features/performance/IPCRFFormModal.jsx` (DepEd RPMS evaluation modal with real-time weighted composite score calculation: Quality 40%, Efficiency 30%, Timeliness 30%).
  - [x] De-slop `frontend/src/components/features/performance/IPCRFDetailsModal.jsx` (Official IPCRF evaluation docket summary with dimension matrix, printable view, and signed document download).
  - [x] De-slop `frontend/src/pages/employee/MyIPCRF.jsx` (Personal RPMS portfolio table replacing 3-column floating cards with chronological records, promotion standing, and docket modal).
  - [x] De-slop `frontend/src/pages/admin/AuditLogs.jsx` (Dense security event ledger with monospace timestamps, module resolution, actor role badges, and date/category filters).
  - [x] Built shared utility `frontend/src/utils/performance.js` for RPMS weight computations and CSC adjectival ratings.
  - [x] Passed frontend lint check (0 errors) and production build. Ran backend audit tests (2 passed).

- [x] **Phase 6: Executive & Employee Portals**
  - [x] De-slop `frontend/src/pages/admin/AdminDashboard.jsx` (Executive operations cockpit with 4-metric operational summary strip, high-priority approval action docket, station deployment matrix, clean DepEd Blue/Slate distribution charts, and RQA recruitment funnel).
  - [x] De-slop `frontend/src/pages/employee/EmployeeDashboard.jsx` (Calm institutional personal workstation with employee service credentials, personal VL/SL balances, 5-day Form 48 recent attendance ledger, compensation summary, and quick action shortcuts).
  - [x] De-slop `frontend/src/pages/employee/MyPayroll.jsx` (High-density semi-monthly payslip ledger with itemized earnings [Basic, PERA] and statutory deductions [GSIS, PhilHealth, Pag-IBIG, TRAIN Tax, Loans], net take-home callout, and PDF export).
  - [x] De-slop `frontend/src/pages/employee/MyLoans.jsx` & `ApplyLoanModal.jsx` (Replaced cards with high-density personal loan master ledger table, 4-metric strip, Subsidiary Ledger modal inspection docket, and clean application form).
  - [x] Patched `/api/dashboard/` endpoint routes in `AccountantDashboardPage.jsx` and `SuperintendentDashboardPage.jsx`.
  - [x] Passed frontend lint check (0 errors, 0 warnings on modified files) and production build. Ran backend payroll test suite (`test_payroll.py`, 14 passed) and loan test suite (`test_loan.py`, 6 passed).

---

## Verification Commands Quick Reference

```bash
# Frontend lint check (0 errors required)
cd frontend
npm.cmd run lint

# Frontend production bundle
npm.cmd run build

# Targeted backend test execution
cd ../backend
venv\Scripts\python.exe -m pytest core/tests/test_leave.py
venv\Scripts\python.exe -m pytest core/tests/test_attendance.py
venv\Scripts\python.exe -m pytest core/tests/test_payroll.py
```
