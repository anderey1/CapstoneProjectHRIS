# Code organization

The backend remains one Django application named `core`. Model identities, database tables, migrations, roles, routes, serializers, and response formats remain unchanged by the modularization.

## Backend ownership

| Location | Responsibility |
| --- | --- |
| `backend/core/views/employee/viewset.py` | Personnel records, self profile, and record visibility |
| `backend/core/views/employee/accounts.py` | Registration review and password changes |
| `backend/core/views/employee/documents.py` | Employee document storage and verification |
| `backend/core/views/employee/reference.py` | School and salary reference endpoints |
| `backend/core/views/employee/leave_credits.py` | Existing annual credit award endpoint |
| `backend/core/views/leave/viewset.py` | Leave record visibility and endpoint configuration |
| `backend/core/views/leave/applications.py` | Filing validation and correction submissions |
| `backend/core/views/leave/processing.py` | Stage transitions, action history, and final credit deduction |
| `backend/core/views/loan/viewset.py` | Loan record visibility and endpoint configuration |
| `backend/core/views/loan/applications.py` | Applications and resubmissions |
| `backend/core/views/loan/processing.py` | Verification, approval, rejection, and release |
| `backend/core/views/loan/payments.py` | Repayment posting and paid status |
| `backend/core/views/loan/documents.py` | Document requirements and application readouts |
| `backend/core/views/payroll/viewset.py` | Payroll record visibility and endpoint configuration |
| `backend/core/views/payroll/generation.py` | Individual and bulk draft generation |
| `backend/core/views/payroll/processing.py` | Individual and bulk approval and release |
| `backend/core/views/payroll/exports.py` | Payroll, voucher, and payslip PDFs |
| `backend/core/services/payroll.py` | Existing payroll calculation rules |
| `backend/core/services/onboarding.py` | Coordinate creation of a hired applicant's account and personnel records |
| `backend/core/services/applicant_records.py` | Copy extracted PDS records and applicant documents |
| `backend/core/views/recruitment.py` | Applicant status changes, notifications, and API responses |

Each feature package exports the same ViewSet names through `__init__.py`. Existing imports such as `from core.views.payroll import PayrollViewSet` still work. HTTP action mixins share the configured ViewSet and its `get_object()` and permission handling; they are not independent services.

Attendance, performance, authentication, analytics, audit, and PDS endpoint modules retain their existing locations. Already focused files need no additional layers.

## Utilities

`core.utils` remains the public import location. Its implementation now lives in `attendance.py` (attendance status), `dates.py` (working days and payroll cutoffs), `pds.py` (extraction), and `summaries.py` (AI summaries). Existing PDF modules retain their locations.

## Frontend ownership

The existing `useLoans` and `usePayroll` hooks remain the public interfaces used by pages. Their return values, API paths, query keys, notifications, and cache invalidation behavior remain unchanged.

| Hook | Responsibility |
| --- | --- |
| `useLoansQueries` | Loan lists, selected checklist, and selected documents |
| `useLoansMutations` | Loan writes, attachment submission, notifications, and invalidation |
| `useLoans` | Compose data and actions; derive status groups and totals |
| `usePayrollQueries` | Employee and payroll lists |
| `usePayrollMutations` | Generation, approval, release, notifications, and invalidation |
| `usePayrollExports` | PDF download handlers |
| `usePayroll` | Selected cutoff, composition, and cutoff totals |

## Change boundaries

Keep transaction decorators and row locking with the operations they protect. Payroll release and loan deduction posting must still commit or roll back together. Hiring must still roll back newly created account and personnel records if record transfer fails.

Keep policy changes separate from file organization. Existing access checks and workflow exceptions are preserved, including the current loan screen permission issue documented in the verification report.

Run the targeted tests for an operation and its connected workflows. Use `scripts/verify_modularization.py` to compare the extracted functions and router against the original revision, as documented in [the verification report](reviews/modularization-verification.md).

Biometric Excel/CSV decoding lives in `backend/core/services/attendance_files.py`; DTR slot validation lives in `backend/core/services/attendance_import.py`. Attendance import actions and employee ID mappings remain on `AttendanceViewSet`. See [attendance integration](attendance-integration.md) for the template contract and HR workflow.
