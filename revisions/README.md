# DepEd HRIS Revisions Tracker

This directory contains standalone, detailed technical specifications for each targeted revision. Each specification is self-contained with exact files, code changes, acceptance criteria, and verification steps so that revisions can be implemented and verified one at a time.

---

## Revision Index & Execution Roadmap

| ID | Specification File | Focus Area | Status |
| :---: | :--- | :--- | :---: |
| **REV-01** | [`REV-01-TIMEZONE-AND-ATTENDANCE.md`](./REV-01-TIMEZONE-AND-ATTENDANCE.md) | Timezone PST (`Asia/Manila`) & QR Scan Slots | ✅ Completed |
| **REV-02** | [`REV-02-MODEL-SYNTAX-AND-DEPENDENCIES.md`](./REV-02-MODEL-SYNTAX-AND-DEPENDENCIES.md) | Employee Model Syntax & `reportlab` Package | ✅ Completed |
| **REV-03** | [`REV-03-CSC-FORM-6-LEAVE-RULES.md`](./REV-03-CSC-FORM-6-LEAVE-RULES.md) | CSC Form 6 Retrospective Sick/Calamity Filing | ✅ Completed |
| **REV-04** | [`REV-04-DEPED-RECRUITMENT-RUBRIC.md`](./REV-04-DEPED-RECRUITMENT-RUBRIC.md) | DepEd Order 7, s. 2023 100-pt RQA Rubric | ✅ Completed |
| **REV-05** | [`REV-05-GSIS-PAYROLL-AND-SERVICE.md`](./REV-05-GSIS-PAYROLL-AND-SERVICE.md) | GSIS 9% Deduction & `PayrollCalculator` Service | ✅ Completed |
| **REV-06** | [`REV-06-SECURITY-CORS-AND-PERMISSIONS.md`](./REV-06-SECURITY-CORS-AND-PERMISSIONS.md) | CORS Middleware Order, Admin Role Sync & JWT Claims | ✅ Completed |
| **REV-07** | [`REV-07-MYLEAVES-FRONTEND-MODULARIZATION.md`](./REV-07-MYLEAVES-FRONTEND-MODULARIZATION.md) | `MyLeaves.jsx` Component Decomposition (1,295 lines) | ✅ Completed |
| **REV-08** | [`REV-08-DATABASE-INDEXING-AND-PERFORMANCE.md`](./REV-08-DATABASE-INDEXING-AND-PERFORMANCE.md) | DB Query Indexing & Atomic `F()` Leave Accrual | ✅ Completed |
| **REV-09** | [`REV-09-AUTOMATED-TESTING-SUITE.md`](./REV-09-AUTOMATED-TESTING-SUITE.md) | Pytest Backend Test Suites | ✅ Completed |
| **REV-10** | [`REV-10-ANTISLOP-UI-DESIGN-SYSTEM.md`](./REV-10-ANTISLOP-UI-DESIGN-SYSTEM.md) | Anti-AI-Slop Design System Harmonization | ✅ Completed |

---

## Guidelines for Execution

1. **One Revision at a Time:** Complete implementation and verification of one spec before moving to the next.
2. **Acceptance Criteria Verification:** Every revision includes precise automated or manual test steps that must pass before marking the revision complete.
3. **Audit Trail:** Maintain database migrations and commit changes incrementally per revision ID.
