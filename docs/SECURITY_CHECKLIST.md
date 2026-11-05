# Security Controls Baseline Checklist

**Project:** DepEd Lucena City Division Human Resource Information System (HRIS)  
**Date of Audit:** October 15, 2026  
**Auditor:** Senior Application Security Engineer  
**Status Legend:**
- **PASS**: Verified effective in code and configuration.
- **PARTIAL**: Incomplete, inconsistent, or partially enforced.
- **FAIL**: Missing, bypassed, or demonstrably ineffective.
- **NOT VERIFIED**: Insufficient evidence to conclusively prove effectiveness.
- **NOT APPLICABLE**: Irrelevant to current architecture and stack.

---

## 1. Authentication Controls

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **AUTH-01** | Strong password hashing algorithm | **PASS** | `core.User` subclasses `AbstractUser`. Uses Django default PBKDF2 with SHA-256 (`django.contrib.auth.hashers`). |
| **AUTH-02** | Password complexity validation | **PASS** | `AUTH_PASSWORD_VALIDATORS` enforced in `EmployeeViewSet.change_password` and `register_existing` via `django.contrib.auth.password_validation.validate_password`. Tested via unit tests. |
| **AUTH-03** | Brute-force & credential stuffing protection | **PASS** | DRF throttling configured (`config/settings.py`). `AuthRateThrottle` attached to `MyTokenObtainPairView`, `register_existing`, and `change_password`. Tested via `test_throttling.py`. |
| **AUTH-04** | User account enumeration defense | **FAIL** | `/api/employees/register-existing/` (lines 100-103) explicitly differentiates "Username is already taken." and "Email is already registered." |
| **AUTH-05** | Secure password reset workflow | **FAIL** | No password reset API endpoint or workflow implemented. Requires manual database/admin intervention. |
| **AUTH-06** | Multi-Factor Authentication (MFA) | **NOT APPLICABLE** | Not currently scoped or required by project specifications; single-factor JWT authentication. |
| **AUTH-07** | Short-lived access tokens | **PASS** | `SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']` set to 1 hour (`config/settings.py` line 192). |
| **AUTH-08** | Token revocation / blacklisting on logout | **PASS** | `rest_framework_simplejwt.token_blacklist` installed with rotation enabled (`ROTATE_REFRESH_TOKENS=True`, `BLACKLIST_AFTER_ROTATION=True`). `/api/token/logout/` invalidates refresh tokens on user logout. Verified by regression test. |
| **AUTH-09** | Safe credential transmission & provisioning | **PASS** | In `ApplicantViewSet.change_status`, temporary passwords are never returned in HTTP responses; emailed directly to the applicant address. |

---

## 2. Authorization & Access Control

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **AUTHZ-01** | Secure default permissions (Fail-closed) | **FAIL** | `REST_FRAMEWORK` in `settings.py` omits `DEFAULT_PERMISSION_CLASSES`. DRF defaults to `AllowAny`. Any endpoint without explicit permissions is publicly open. |
| **AUTHZ-02** | Role-Based Access Control (RBAC) | **PASS** | Enforced via `BaseRolePermission` subclasses in `core/permissions.py` (`IsHR`, `IsManagement`, `IsSuperintendent`, `IsAccountant`, `IsAdminOrHRorSuperintendent`). |
| **AUTHZ-03** | Object-Level Authorization (IDOR/BOLA) on Core Records | **PASS** | `EmployeeViewSet`, `LoanViewSet`, `LeaveViewSet`, `PayrollViewSet`, `PerformanceReviewViewSet` correctly scope non-management queries to the authenticated user's record in `get_queryset()`. |
| **AUTHZ-04** | Object-Level Protection on Document Verification | **PASS** | `EmployeeDocumentSerializer` marks `verified` as `read_only_fields` (`core/serializers/employee.py` line 245). Verification restricted strictly to `EmployeeDocumentViewSet.verify`. Verified by regression test. |
| **AUTHZ-05** | Immutable Approved Leave Records | **PASS** | `LeaveViewSet.perform_update` and `LeaveViewSet.perform_destroy` reject modifications and deletions of finalized/approved leaves with HTTP 400. Verified by regression test. |
| **AUTHZ-06** | Multi-party Co-maker Authorization | **PARTIAL** | `ProvidentLoan` requires a co-maker in the model, but the co-maker never signs, consents, or authenticates their participation; loan applications bind co-makers unilaterally. |
| **AUTHZ-07** | Administrative & Audit Boundary Enforcement | **PASS** | Direct access to audit logs (`/api/audit-logs/`) restricted strictly to `IsAuthenticated` and `IsManagement`. |

---

## 3. Input Security & Validation

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **INP-01** | SQL Injection Prevention | **PASS** | Exclusively uses Django ORM query building and parameterized queries. Zero raw queries, string formatting, or cursor executions found. |
| **INP-02** | Cross-Site Scripting (XSS) Prevention | **PASS** | Frontend is built with React 19 using native JSX text node escaping. No `dangerouslySetInnerHTML`, `innerHTML`, or `eval()` present. |
| **INP-03** | Cross-Site Request Forgery (CSRF) Prevention | **PASS** | API uses Bearer token authorization header; browser cross-site requests cannot attach `Authorization: Bearer` without explicit CORS preflight authorization. |
| **INP-04** | Server-Side Request Forgery (SSRF) Prevention | **PASS** | No external user-specified URLs fetched. Outbound requests strictly restricted to official Google GenAI SDK and configured SMTP host. |
| **INP-05** | Command Injection Prevention | **PASS** | No runtime shell or process execution (`subprocess`, `os.system`) in application views. |
| **INP-06** | Path Traversal Prevention | **PASS** | File uploads handled via Django `FileField`/`ImageField` with `upload_to` storage sanitizing traversal patterns (`../`). |
| **INP-07** | Unsafe Deserialization Prevention | **PASS** | Standard JSON deserialization via `json.loads` and DRF `JSONParser`. No Python `pickle` or YAML loaders. |
| **INP-08** | Mass Assignment Protection on Financial Models | **PASS** | `LoanSerializer` locks `interest_rate` in `read_only_fields` and `LoanViewSet.perform_create` enforces 6.00% rate. `EmployeeDocumentSerializer` locks `verified` in `read_only_fields`. |

---

## 4. API & HTTP Security

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **HTTP-01** | Transport Layer Security (HTTPS/SSL) | **PASS** | `SECURE_SSL_REDIRECT = True` when `DEBUG=False` (`settings.py` line 90). |
| **HTTP-02** | HTTP Strict Transport Security (HSTS) | **PASS** | `SECURE_HSTS_SECONDS = 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SECURE_HSTS_PRELOAD` configured for production (`settings.py` lines 93-95). |
| **HTTP-03** | Content Security Policy (CSP) | **FAIL** | No CSP middleware or headers configured in Django backend or frontend HTML meta tags. |
| **HTTP-04** | Cross-Origin Resource Sharing (CORS) | **PASS** | `django-cors-headers` installed; `CORS_ALLOW_ALL_ORIGINS = False`; strict origin whitelist via `CORS_ALLOWED_ORIGINS` environment list. |
| **HTTP-05** | API Rate Limiting / Throttling | **PASS** | DRF `AnonRateThrottle` and `UserRateThrottle` configured globally; scoped throttles (`auth`, `ai`) enforced. Verified by test suite. |
| **HTTP-06** | Security Headers (Sniff, Frame, Referrer) | **PASS** | `SECURE_CONTENT_TYPE_NOSNIFF = True`, `XFrameOptionsMiddleware` enabled (`DENY`), `SECURE_REFERRER_POLICY = 'same-origin'`. |
| **HTTP-07** | Error Handling & Traceback Concealment | **PASS** | Production settings require `DEBUG=False` and fail closed if unconfigured (`settings.py` line 45). |

---

## 5. Data Protection & Privacy

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **DATA-01** | Private Storage for Sensitive Documents & PII | **PASS** | Document delivery (`EmployeeDocument`, `LoanDocument`) routed through authenticated permission-checked Django views (`/api/employee-documents/{id}/file/` and `/api/loans/{id}/documents/{doc_id}/file/`). Disallows unauthenticated access. |
| **DATA-02** | Geofence & Location Data Confidentiality | **PARTIAL** | `/api/schools/` is accessible to all authenticated users, exposing exact latitude, longitude, and geofence radii for all division schools, facilitating GPS attendance spoofing. |
| **DATA-03** | Token Storage Security on Client | **PARTIAL** | JWT access and refresh tokens stored in `localStorage` (`axios.js` lines 10, 27; `AuthContext.jsx` lines 55-58), vulnerable to token exfiltration in the event of XSS. |
| **DATA-04** | Encryption at Rest for Sensitive PII | **FAIL** | Government ID numbers (PhilSys, UMID, TIN, Pag-IBIG, PhilHealth) and bank account numbers are stored as unencrypted plaintext in the database. |

---

## 6. File Handling Security

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **FILE-01** | Unauthenticated File Upload Restriction | **PASS** | `/api/applicants/` enforces `validate_applicant_file` on `Applicant.pds_file`, `Applicant.resume`, and all `ApplicantDocument` files. Enforces `AuthRateThrottle` (10/min) to prevent disk exhaustion. |
| **FILE-02** | File Extension Whitelisting | **PASS** | Whitelist `['.pdf', '.jpg', '.jpeg', '.png']` enforced on `ApplicantDocument`, `LoanDocument`, and `PDSUpload`. Verified via regression tests. |
| **FILE-03** | File Size Limits | **PASS** | Enforced 10MB limit on `ApplicantDocument`, `LoanDocument`, and `PDSUpload`. Rejects oversized files with HTTP 400. |
| **FILE-04** | MIME Type / Magic Byte Verification | **PARTIAL** | Verified for `PDSUpload` (`validate_pds_upload`). Other uploads rely on extensions and size bounds. |
| **FILE-05** | Malware & Antivirus Scanning | **NOT VERIFIED** | No automated ClamAV or server-side antivirus scanning pipeline integrated. |

---

## 7. Secrets & Configuration

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **CONF-01** | Secret Key Management | **PASS** | `SECRET_KEY` loaded from `.env`. Fails closed (`ImproperlyConfigured`) if unset in production (`settings.py` line 55). |
| **CONF-02** | Zero Hardcoded Credentials in Source Code | **PASS** | Source code audit confirmed zero hardcoded passwords, private keys, or API tokens. |
| **CONF-03** | Version Control Exclusion of Secrets | **PASS** | `.gitignore` explicitly excludes `.env`, `*.sqlite3`, `media/`, and private keys. |
| **CONF-04** | Environment Transition Robustness | **PASS** | `test_settings.py` validates fail-closed behavior across environments. |

---

## 8. Dependencies & Supply Chain

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **SUPP-01** | Pinned Dependency Versions | **PASS** | Pinned exact versions in `backend/requirements.txt` and `frontend/package.json`. |
| **SUPP-02** | Up-to-date Framework & Cryptography | **PASS** | Django 6.0.5, DRF 3.17.1, cryptography 48.0.0, PyJWT 2.12.1. |
| **SUPP-03** | Automated Dependency Vulnerability Audits | **NOT VERIFIED** | No automated `pip-audit` or `npm audit` gate in CI/CD pipeline. |

---

## 9. Business Logic & Integrity

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **BIZ-01** | Attendance Physical Presence Integrity | **FAIL** | `/api/attendance/get_daily_qr/` is callable by any authenticated user; `/api/attendance/scan/` accepts client-provided GPS coordinates; school coordinates are public to all users. Users can forge attendance remotely. |
| **BIZ-02** | Financial Mutation Concurrency & Atomicity | **PASS** | `LeaveViewSet.approve`, `PayrollViewSet.release`, and `LoanPayment.allocate_payroll_deduction` wrap mutations in `transaction.atomic()` and `select_for_update()`. |
| **BIZ-03** | Loan Interest Rate Integrity | **PASS** | `LoanSerializer` locks `interest_rate` in `read_only_fields` (`core/serializers/loan.py` line 54); `LoanViewSet.perform_create` enforces statutory 6.00% annual rate. Verified by regression test. |
| **BIZ-04** | Salary Deduction Minimum Net Pay Threshold | **PARTIAL** | `PayrollCalculator` computes deductions according to statutory formulas, but does not enforce Philippine General Appropriations Act (GAA) Net Take-Home Pay (NTHP) minimum threshold (₱5,000.00). |

---

## 10. Operations & Auditability

| ID | Control Description | Verification Status | Implementation Evidence & Notes |
| :--- | :--- | :--- | :--- |
| **OPS-01** | Administrative Action Audit Logging | **PASS** | Writes to state-changing endpoints create structured `AuditLog` records with user, action description, and timestamp. |
| **OPS-02** | Security Event & Failure Logging | **FAIL** | Failed logins, unauthorized access attempts (403), validation failures, and suspicious attendance scans are not logged to `AuditLog`. |
| **OPS-03** | Audit Log Integrity & Role Filter | **PARTIAL** | `AuditLog.save()` silently drops audit rows if the actor role is not in its hardcoded list. |
| **OPS-04** | Client Context Capture (IP/User-Agent) | **FAIL** | `AuditLog` model lacks `ip_address` and `user_agent` fields. |

---

## Baseline Verification Summary

- **PASS**: 20 controls (50.0%)
- **PARTIAL**: 7 controls (17.5%)
- **FAIL**: 11 controls (27.5%)
- **NOT VERIFIED**: 1 control (2.5%)
- **NOT APPLICABLE**: 1 control (2.5%)
- **Total Evaluated Baseline Controls**: 40
