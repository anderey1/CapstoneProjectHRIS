# API Endpoint Authentication & Authorization Matrix

**Project:** DepEd Lucena City Division HRIS  
**Date:** October 15, 2026  
**Auditor:** Senior Application Security Engineer  

This document provides a comprehensive route-by-route verification of all server-side endpoints, tracing requests through URL patterns, view dispatch, authentication requirements, role-based permissions, object-level ownership checks, and data sensitivity.

---

## 1. Authentication & System Endpoints (`config/urls.py`)

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/` | ALL | Session / Cookie | Django `is_staff` / `is_superuser` | Built-in Django Admin permissions | Direct database manipulation, superuser access | **PASS** — Standard Django admin security. |
| `/api/token/` | POST | None (`AllowAny`) | None | None | Issues JWT access and refresh tokens; accepts credentials | **PASS** — Protected by `AuthRateThrottle` (10/min); brute-force mitigated. |
| `/api/token/refresh/` | POST | None (`AllowAny`) | None | None | Refreshes expired access tokens via valid refresh token | **PARTIAL** — No token blacklisting or rotation. |
| `/media/<path>` | GET | None (Dev) / None (Web server) | None | None | CSC 212 PDS, medical certificates, e-signatures, IDs | **FAIL** — Unauthenticated direct file downloads; predictable paths. |

---

## 2. Core API Endpoints (`core/urls.py`)

### 2.1 Attendance (`/api/attendance/`)

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/attendance/` | GET | Yes | `IsAuthenticated` | Management sees all; Non-management filtered to `employee__user=user` | Personnel daily time records, timestamps, lat/long | **PASS** — Scoped correctly in `get_queryset()` (`core/views/attendance.py` lines 33-37). |
| `/api/attendance/` | POST | Yes | `IsAdminOrHR` | Scoped to HR/Admin | Manual attendance log insertion | **PASS** — Enforced by `get_permissions()` (line 31). |
| `/api/attendance/{id}/` | GET | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Specific DTR entry details | **PASS** — Non-management restricted to own record. |
| `/api/attendance/{id}/` | PUT/PATCH | Yes | `IsAdminOrHR` | Admin/HR | Modifies DTR punch times | **PASS** — Restricted to Admin/HR. |
| `/api/attendance/{id}/` | DELETE | Yes | `IsAdminOrHR` | Admin/HR | Deletes DTR entries | **PASS** — Restricted to Admin/HR. |
| `/api/attendance/scan/` | POST | Yes | `IsAuthenticated` | Bound to `request.user.employee_profile` | DTR punch recording, Geofence distance calculation | **PARTIAL** — Validates Haversine geofence distance; client supplies `lat` and `lng` (lines 40-75). |
| `/api/attendance/approve_dtr/` | POST | Yes | `IsAdminOrHRorSuperintendent` | Management approval | Batch monthly DTR approval (`is_dtr_approved=True`) | **PASS** — Restricted to management roles (lines 175-215). |
| `/api/attendance/dtr_pdf/` | GET | Yes | `IsAuthenticated` | Privilege, own profile, or subordinate supervisor check | Generates Form 48 DTR PDF export | **PASS** — Verified ownership & supervisor checks (lines 238-246). |

---

### 2.2 Provident Loans (`/api/loans/`)

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/loans/` | GET | Yes | `IsAuthenticated` | Management sees all; Employee sees only own loans | Loan amounts, payment histories, balances | **PASS** — Scoped in `get_queryset()` (`core/views/loan.py` lines 33-45). |
| `/api/loans/` | POST | Yes | `IsAuthenticated` | Binds to user's profile unless Admin/HR specifies target | Creates loan application | **PASS** — `interest_rate` is locked to read-only; server enforces 6.00% rate. |
| `/api/loans/{id}/` | GET | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Detailed loan docket | **PASS** — Scoped correctly. |
| `/api/loans/{id}/` | PUT/PATCH | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Modifies loan details | **PARTIAL** — No restriction against modifying pending loan fields. |
| `/api/loans/{id}/` | DELETE | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Deletes loan application | **PARTIAL** — Should only be allowed by HR/Admin or for pending loans. |
| `/api/loans/{id}/verify/` | POST | Yes | `IsAccountant \| IsSuperintendentOrAdmin` | Accountant / Executive | Verifies loan supporting documents | **PASS** — Enforced role check (`loan.py` line 70). |
| `/api/loans/{id}/approve/` | POST | Yes | `IsSuperintendentOrAdmin` | Superintendent / Admin | Executive sign-off for loan disbursement | **PASS** — Enforced role check (`loan.py` line 86). |
| `/api/loans/{id}/reject/` | POST | Yes | `IsSuperintendentOrAdmin \| IsAccountant` | Accountant / Executive | Rejection with mandatory remarks | **PASS** — Enforced role check (`loan.py` line 102). |
| `/api/loans/{id}/resubmit/` | POST | Yes | `IsAuthenticated` | Enforces `loan.employee.user == request.user` | Resubmits previously rejected loan | **PASS** — Ownership verified (`loan.py` line 129). |
| `/api/loans/{id}/release-funds/` | POST | Yes | `IsAccountant \| IsSuperintendentOrAdmin` | Accountant / Executive | Marks loan released, sets date granted | **PASS** — Wrapped in `transaction.atomic()` with `select_for_update()` (line 146). |
| `/api/loans/{id}/post-payment/` | POST | Yes | `IsAccountant \| IsAdminOrHR` | Accountant / HR | Manual payment credit towards balance | **PASS** — Atomic, prevents payment exceeding balance (lines 182-187). |
| `/api/loans/{id}/upload_document/` | POST | Yes | `IsAuthenticated` | Scoped via `get_object()` | Uploads loan supporting documents | **PASS** — Bounded by `LOAN_DOC_MAX_SIZE_MB=10` and `LOAN_DOC_ALLOWED_EXTENSIONS`. |
| `/api/loans/{id}/documents/` | GET | Yes | `IsAuthenticated` | Scoped via `get_object()` | Lists uploaded loan documents | **PASS** — Scoped correctly. |
| `/api/loans/{id}/documents/{doc_id}/file/` | GET | Yes | `IsAuthenticated` | Scoped via `get_object()` | Authenticated file streaming / download | **PASS** — Access controlled to loan applicant and management. |
| `/api/loans/{id}/checklist/` | GET | Yes | `IsAuthenticated` | Scoped via `get_object()` | Missing vs uploaded checklist status | **PASS** — Scoped correctly. |

---

### 2.3 Employees & User Accounts (`/api/employees/`)

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/employees/` | GET | Yes | `IsAuthenticated` | Management sees all; Non-management sees only self | PII, salary, SG, contact info, leave balances | **PASS** — Scoped in `get_queryset()` (`core/views/employee.py` lines 56-70). |
| `/api/employees/` | POST | Yes | `IsAdminOrHRorSuperintendent` | Management only | Creates new employee record & user account | **PASS** — Enforced by `get_permissions()` (line 54). |
| `/api/employees/{id}/` | GET | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Full employee profile data | **PASS** — Non-management restricted to self. |
| `/api/employees/{id}/` | PUT/PATCH | Yes | `IsAdminOrHRorSuperintendent` | Management only | Updates employment and compensation data | **PASS** — Restricted to management. |
| `/api/employees/{id}/` | DELETE | Yes | `IsAdminOrHRorSuperintendent` | Management only | Deletes employee record | **PASS** — Restricted to management. |
| `/api/employees/register-existing/` | POST | **No** (`AllowAny`) | None | None | Self-service registration for staff accounts | **FAIL** — No rate limit; password complexity bypassed; user enumeration (lines 83-138). |
| `/api/employees/pending-registrations/` | GET | Yes | `IsAdminOrHRorSuperintendent` | Management only | Lists unapproved pending accounts | **PASS** — Restricted to management (lines 139-143). |
| `/api/employees/{id}/approve-registration/` | POST | Yes | `IsAdminOrHRorSuperintendent` | Management only | Activates pending user account | **PASS** — Restricted to management (lines 145-161). |
| `/api/employees/{id}/reject-registration/` | POST | Yes | `IsAdminOrHRorSuperintendent` | Management only | Deletes pending employee and user | **PASS** — Restricted to management (lines 163-183). |
| `/api/employees/me/` | GET | Yes | `IsAuthenticated` | Scoped to `request.user` | Current user profile and balance data | **PASS** — Scoped to authenticated user (lines 185-247). |
| `/api/employees/me/` | PATCH | Yes | `IsAuthenticated` | Scoped to `request.user` | Self-service PDS profile updates | **PARTIAL** — Strict field whitelist, but permits modifying `agency_employee_no` (lines 225-234). |
| `/api/employees/award_yearly_credits/` | POST | Yes | `IsAdminOrHRorSuperintendent` | Management only | Bulk awards +15 VL / +15 SL to non-teaching staff | **PASS** — Restricted to management (lines 249-268). |
| `/api/employees/change-password/` | POST | Yes | `IsAuthenticated` | Scoped to `request.user` | Password change | **PASS** — Enforces Django `AUTH_PASSWORD_VALIDATORS` and `AuthRateThrottle` (10/min). |

---

### 2.4 Employee Documents (`/api/employee-documents/`)

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/employee-documents/` | GET | Yes | `IsAuthenticated` | Management sees all/filtered; Employee sees own | Diplomas, licenses, credentials | **PASS** — Scoped in `get_queryset()` (`employee.py` lines 306-322). |
| `/api/employee-documents/` | POST | Yes | `IsAuthenticated` | Employee profile of user, or management targets employee | Document upload | **FAIL** — Arbitrary file upload; no extension or size check (lines 324-350). |
| `/api/employee-documents/{id}/` | GET | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Document metadata & download URL | **PASS** — Scoped correctly. |
| `/api/employee-documents/{id}/file/` | GET | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Authenticated file streaming / download | **PASS** — Access controlled to owner and management; direct public media link bypassed. |
| `/api/employee-documents/{id}/` | PUT/PATCH | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Document metadata update | **PASS** — `verified` field is read-only; self-verification blocked. |
| `/api/employee-documents/{id}/DELETE/` | DELETE | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Deletes document | **PARTIAL** — Verified documents can be deleted by owner without management review. |
| `/api/employee-documents/{id}/verify/` | POST | Yes | `IsAdminOrHRorSuperintendent` | Management only | Sets `verified=True`, records verifier | **PASS** — Restricted to management (lines 352-364). |

---

### 2.5 Leave Requests (`/api/leaves/`)

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/leaves/` | GET | Yes | `IsAuthenticated` | HR/Superintendent see queue; Supervisor sees subordinates; Employee sees own | Leave applications, medical details, balances | **PASS** — Scoped in `get_queryset()` (`core/views/leave.py` lines 20-58). |
| `/api/leaves/` | POST | Yes | `IsAuthenticated` | Binds to `request.user.employee_profile` | Applies for statutory/CSC leave | **PARTIAL** — Rigorous advance filing & overlap validation, but file attachments lack type/size checks. |
| `/api/leaves/{id}/` | GET | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Full leave application details | **PASS** — Scoped correctly. |
| `/api/leaves/{id}/` | PUT/PATCH | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Modifies leave application | **PASS** — `perform_update` blocks tampering on approved/rejected leaves with HTTP 400. |
| `/api/leaves/{id}/` | DELETE | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Deletes leave application | **PASS** — `perform_destroy` blocks deletion of approved/rejected leaves with HTTP 400. |
| `/api/leaves/{id}/approve/` | POST | Yes | `IsAuthenticated` | `_can_process_stage` checks supervisor -> HR -> superintendent | Multi-stage recommendation and balance deduction | **PASS** — Stage gates verified; atomic balance deduction via `deduct_leave()` (lines 193-237). |
| `/api/leaves/{id}/reject/` | POST | Yes | `IsAuthenticated` | `_can_process_stage` checks stage-appropriate authority | Rejects application with reason | **PASS** — Stage-checked and logged (lines 238-255). |

---

### 2.6 Payroll (`/api/payroll/`)

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/payroll/` | GET | Yes | `IsAuthenticated` | Management sees all; Employee sees only own | Salaries, GSIS/PhilHealth/tax deductions, net pay | **PASS** — Scoped in `get_queryset()` (`core/views/payroll.py` lines 26-36). |
| `/api/payroll/` | POST | Yes | `IsAccountant \| IsSuperintendent` | Management only | Creates payroll record | **PASS** — Restricted by `get_permissions()` (line 23). |
| `/api/payroll/{id}/` | GET | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Payroll record breakdown | **PASS** — Scoped correctly. |
| `/api/payroll/{id}/` | PUT/PATCH | Yes | `IsAccountant \| IsSuperintendent` | Management only | Modifies payroll amounts | **PARTIAL** — `PayrollSerializer` has no `read_only_fields`; Accountant can overwrite computed numbers. |
| `/api/payroll/{id}/` | DELETE | Yes | `IsAccountant \| IsSuperintendent` | Management only | Deletes payroll record | **PASS** — Restricted to Accountant/Superintendent. |
| `/api/payroll/generate/` | POST | Yes | `IsAccountant` | Accountant only | Computes payroll via `PayrollCalculator` | **PASS** — Verifies approved DTR records; atomic (lines 45-100). |
| `/api/payroll/{id}/approve/` | POST | Yes | `IsSuperintendent` | Superintendent only | Executive sign-off for draft payroll | **PASS** — Role verified (lines 101-112). |
| `/api/payroll/{id}/release/` | POST | Yes | `IsAccountant` | Accountant only | Finalizes payout, allocates loan repayments | **PASS** — Wrapped in `transaction.atomic()` with `select_for_update()` (lines 114-145). |
| `/api/payroll/bulk_generate/` | POST | Yes | `IsAccountant` | Accountant only | Batch generation for active personnel | **PASS** — Atomic, skips unapproved DTRs (lines 147-220). |
| `/api/payroll/bulk_approve/` | POST | Yes | `IsSuperintendent` | Superintendent only | Batch approval of draft records | **PASS** — Atomic update (lines 222-243). |
| `/api/payroll/bulk_release/` | POST | Yes | `IsAccountant` | Accountant only | Batch release and loan allocation | **PASS** — Atomic update (lines 245-291). |
| `/api/payroll/export_payroll_sheet/` | GET | Yes | `IsAccountant \| IsSuperintendent \| IsAdminOrHR` | Management only | Generates General Payroll PDF | **PASS** — Restricted to management (lines 293-308). |
| `/api/payroll/export_disbursement_voucher/` | GET | Yes | `IsAccountant \| IsSuperintendent \| IsAdminOrHR` | Management only | Generates Disbursement Voucher PDF | **PASS** — Restricted to management (lines 310-325). |
| `/api/payroll/{id}/export_payslip/` | GET | Yes | `IsAuthenticated` | Management or `payroll.employee.user == request.user` | Generates official employee payslip PDF | **PASS** — Verified ownership check (lines 327-344). |

---

### 2.7 Performance Reviews (`/api/performance/`)

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/performance/` | GET | Yes | `IsAuthenticated` | Management sees all; Employee sees only own | IPCRF ratings, promotion eligibility, scores | **PASS** — Scoped in `get_queryset()` (`performance.py` lines 23-27). |
| `/api/performance/` | POST | Yes | `IsAuthenticated` | Non-management can only create for self | Submits IPCRF evaluation / upload | **PASS** — Enforces `employee == user_employee` for non-management (lines 33-42). |
| `/api/performance/{id}/` | GET | Yes | `IsAuthenticated` | Scoped via `get_queryset()` | Review breakdown & AI summary | **PASS** — Scoped correctly. |
| `/api/performance/{id}/` | PUT/PATCH | Yes | `IsHR \| IsSuperintendentOrAdmin` | Management only | Updates evaluation scores | **PASS** — Enforced by `get_permissions()` (lines 17-18). |
| `/api/performance/{id}/` | DELETE | Yes | `IsHR \| IsSuperintendentOrAdmin` | Management only | Deletes review | **PASS** — Restricted to management. |

---

### 2.8 Recruitment & Applicants (`/api/applicants/`)

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/applicants/` | GET | Yes | `IsAdminOrHRorSuperintendent` | Management only | Candidate PDS, scores, contact details, ranking | **PASS** — Restricted to management (`recruitment.py` line 39). |
| `/api/applicants/` | POST | **No** (`AllowAny`) | None | None | Public job application & document submission | **PASS** — Enforces `validate_applicant_file` (10MB limit, `.pdf/.jpg/.jpeg/.png`), throttled via `AuthRateThrottle` (10/min) (`recruitment.py`). |
| `/api/applicants/{id}/` | GET | Yes | `IsAdminOrHRorSuperintendent` | Management only | Candidate docket | **PASS** — Restricted to management. |
| `/api/applicants/{id}/` | PUT/PATCH | Yes | `IsAdminOrHRorSuperintendent` | Management only | Updates applicant data & evaluation scores | **PASS** — Restricted to management. |
| `/api/applicants/{id}/` | DELETE | Yes | `IsAdminOrHRorSuperintendent` | Management only | Deletes applicant | **PASS** — Restricted to management. |
| `/api/applicants/{id}/change-status/` | POST | Yes | `IsAdminOrHRorSuperintendent` | Management only | Transitions hiring status; auto-provisions account | **PASS** — Temporary password omitted from API response, emailed directly to candidate. |

---

### 2.9 System Administration & Metadata

| Endpoint | Method | Auth Required | Required Role / Permission | Ownership / Scope Check | Sensitive Operations / Data Handled | Status & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/audit-logs/` | GET | Yes | `IsAuthenticated, IsManagement` | Management only | System audit trail | **PASS** — Restricted to management (`audit.py` lines 10-16). |
| `/api/schools/` | GET | Yes | `IsAuthenticated` | None (Public to all employees) | School names, GPS coordinates, geofence radius | **PARTIAL** — Exposes GPS coordinates to all staff, aiding spoofing (`employee.py` line 29). |
| `/api/schools/` | POST/PUT/DELETE | Yes | `IsAdminOrHRorSuperintendent` | Management only | Creates/edits division schools and geofences | **PASS** — Restricted to management (line 31). |
| `/api/salary-grades/` | GET | Yes | `IsAuthenticated` | None | SSL salary grade schedule | **PASS** — Read-only public schedule for authenticated staff (line 20). |
| `/api/salary-grades/` | POST/PUT/DELETE | Yes | `IsAdminOrHRorSuperintendent` | Management only | Modifies salary grades & base amounts | **PASS** — Restricted to management (line 21). |
| `/api/pds/extract/` | POST | Yes | `IsAuthenticated, IsHR` | HR only | Uploads PDS PDF for AI OCR extraction | **PASS** — Restricted to HR; validates PDF extension, MIME, and size (`pds.py` lines 18-35). |
| `/api/dashboard/` | GET | Yes | `IsAuthenticated, IsManagement` | Management only | Division-wide aggregated statistics & KPIs | **PASS** — Restricted to management (`analytics.py` line 11). |
| `/api/dashboard/summary/` | GET | Yes | `IsAuthenticated, IsManagement` | Management only | AI-generated executive workforce summary | **PASS** — Restricted to management (line 118). |
| `/api/analytics/<str:metric>/` | GET | Yes | `IsAuthenticated, IsManagement` | Management only | Granular reporting data (attendance, payroll, loans) | **PASS** — Restricted to management (line 137). |
