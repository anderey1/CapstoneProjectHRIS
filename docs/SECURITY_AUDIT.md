# DepEd Lucena City Division HRIS — Comprehensive Security Audit Report

**Date of Audit:** October 15, 2026  
**Auditor:** Senior Application Security Engineer  
**Target Codebase:** DepEd Lucena City Division HRIS (Full-Stack Django REST API & React 19 Frontend)  
**Classification:** STRICTLY CONFIDENTIAL — FOR INTERNAL USE ONLY  

---

## 1. Executive Summary

A comprehensive application security audit was conducted on the DepEd Lucena City Division Human Resource Information System (HRIS). The system manages personnel records, Civil Service Form 212 Personal Data Sheets (PDS), biometric and geofenced attendance logs (Civil Service Form 48), statutory leave dockets (CSC Form 6), Provident Loan fund allocations, and semi-monthly payroll processing.

The audit evaluated the repository across ten standard domain areas: Authentication, Authorization, Input Security, API/HTTP Controls, Data Protection, File Handling, Secrets/Configuration, Dependencies/Supply Chain, Business Logic, and Operations/Auditability.

### Overall Posture Assessment
The application demonstrates strong architectural discipline in core relational modeling, atomicity in financial deductions (`transaction.atomic()` with `select_for_update()`), and defensive SQL handling (exclusive reliance on Django ORM parameterization with zero raw SQL injection vectors). Furthermore, the production environment settings fail closed when misconfigured.

However, **critical security vulnerabilities were identified in public file handling, access control enforcement on document verification, media storage confidentiality, and rate limiting.** Specifically:
1. Unauthenticated users can upload arbitrary files of any extension and unlimited size via the public recruitment portal.
2. Authenticated users can exploit a broken object-level access control / mass assignment flaw to self-verify their own unverified documents and credentials.
3. Media storage lacks authorization barriers, exposing highly sensitive personal, financial, and medical documents to unauthorized access.
4. Absence of rate limiting leaves authentication and public registration endpoints vulnerable to automated credential stuffing and resource exhaustion.
5. The daily attendance QR code and GPS coordinates can be forged, allowing staff to remotely clock in without physical presence.

Production deployment should be withheld until all Critical and High severity findings are remediated.

---

## 2. Audit Scope & Methodology

### 2.1 Scope
The audit inspected the complete codebase, including:
- **Backend**: Django 6.0.5, Django REST Framework 3.17.1, SimpleJWT 5.5.1, ReportLab PDF generators, Google Gemini integration, and database models located in `backend/`.
- **Frontend**: React 19.2.5, Vite 8, Tailwind CSS v4, Axios API client, routing guards, and context providers located in `frontend/`.
- **Configuration & Infrastructure Assets**: Environment configurations, `.gitignore`, Docker/deployment configurations, settings definitions, and static assets.

### 2.2 Methodology
- **Static Source Code Inspection**: Manual source code walkthrough and request tracing from routing dispatch (`urls.py`) through middleware, authentication handlers, permission classes, view actions, serializers, business services, and database queries.
- **Negative Control Verification**: Assessment of boundary conditions, role hierarchy escalation paths, parameter tampering vectors, and mass-assignment possibilities.
- **Data Flow & Storage Analysis**: Verification of file persistence, media delivery configurations, and credential handling lifecycles.

---

## 3. Findings by Severity

| Severity | Count | Summary of Primary Vulnerabilities |
| :--- | :---: | :--- |
| **CRITICAL** | **3** | Unauthenticated arbitrary file upload; document verification mass assignment; unprotected sensitive media file exposure. |
| **HIGH** | **3** | Attendance geofence and QR spoofing; loan interest rate mass assignment; total lack of API throttling/rate limiting. |
| **MEDIUM** | **3** | Insecure token revocation lifecycle; password validator bypass in account flows; post-approval leave record tampering. |
| **LOW** | **3** | Plaintext credential exposure in API response; registration user enumeration; missing Content Security Policy (CSP). |
| **INFORMATIONAL** | **2** | Unencrypted plaintext PII storage; hardcoded localhost URLs in notification templates. |
| **TOTAL** | **14** | |

---

## 4. In-Depth Vulnerability Details

### SEC-01: Unauthenticated Arbitrary File Upload & Disk Exhaustion via Public Recruitment Portal
- **Severity:** **CRITICAL**
- **CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type), CWE-400 (Uncontrolled Resource Consumption)
- **Affected File:** `backend/core/views/recruitment.py` (lines 37-56), `backend/core/models/recruitment.py` (lines 64-65, 95-100)
- **Affected Endpoint:** `POST /api/applicants/`
- **Evidence:**
  In `ApplicantViewSet`, permission for the `create` action is explicitly set to `AllowAny`:
  ```python
  def get_permissions(self):
      if self.action == 'create':
          return [AllowAny()]
      return [IsAuthenticated(), IsAdminOrHRorSuperintendent()]

  def perform_create(self, serializer):
      applicant = serializer.save()
      for file_key in self.request.FILES:
          ...
          files = self.request.FILES.getlist(file_key)
          for f in files:
              ApplicantDocument.objects.create(
                  applicant=applicant,
                  document_type=clean_type,
                  file=f,
                  filename=f.name
              )
  ```
  Neither `ApplicantSerializer`, `ApplicantDocument`, nor `Applicant` validate file extensions, MIME types, or file size limits.
- **Attack Scenario:**
  1. An unauthenticated external attacker sends a multipart `POST /api/applicants/` request containing files with extensions such as `.html`, `.svg`, `.exe`, or `.py`.
  2. The server stores these files under `media/applicant_documents/` with their original filenames.
  3. When HR officers view or download candidate attachments, an HTML/SVG file with embedded `<script>` executes within the browser, triggering Stored Cross-Site Scripting (XSS) and stealing the HR officer's JWT token.
  4. An attacker can also script a loop uploading multi-gigabyte files, exhausting server disk space and crashing the database.
- **Remediation:**
  - Enforce strict server-side file extension whitelisting (`.pdf`, `.jpg`, `.png`).
  - Validate MIME types using magic byte inspection (e.g., `python-magic`).
  - Enforce a strict file size ceiling (e.g., maximum 5MB per file, maximum 25MB total payload).
  - Rate-limit the `POST /api/applicants/` endpoint (e.g., 5 requests per hour per IP).

---

### SEC-02: Broken Object-Level Authorization & Mass Assignment Allowing Document Self-Verification
- **Severity:** **CRITICAL**
- **CWE:** CWE-915 (Improperly Controlled Modification of Dynamically Determined Object Attributes), CWE-285 (Improper Authorization)
- **Affected File:** `backend/core/serializers/employee.py` (lines 234-246), `backend/core/views/employee.py` (lines 300-322)
- **Affected Endpoint:** `PUT / PATCH /api/employee-documents/<id>/`
- **Evidence:**
  In `EmployeeDocumentSerializer`:
  ```python
  class EmployeeDocumentSerializer(serializers.ModelSerializer):
      ...
      class Meta:
          model = EmployeeDocument
          fields = [
              'id', 'employee', 'document_type', 'file', 'file_name',
              'uploaded_at', 'verified', 'verified_by', 'verified_by_name',
              'verified_at', 'file_url'
          ]
          read_only_fields = ['id', 'uploaded_at', 'verified_by', 'verified_at', 'file_url']
  ```
  The `verified` field is present in `fields` but **omitted** from `read_only_fields`.
  In `EmployeeDocumentViewSet`:
  ```python
  def get_queryset(self):
      user = self.request.user
      qs = EmployeeDocument.objects.all().select_related('employee', 'verified_by')
      ...
      if hasattr(user, 'employee_profile'):
          return qs.filter(employee=user.employee_profile)
      return qs.none()
  ```
  A regular employee (`Role.TEACHING`) can query their own documents and update them via PUT or PATCH.
- **Attack Scenario:**
  An employee uploads an invalid or unauthentic PRC Teaching License or Master's transcript. The employee captures the document ID, issues a `PATCH /api/employee-documents/<id>/` with payload `{"verified": true}`, and the serializer marks the document as verified without HR or Superintendent intervention.
- **Remediation:**
  Add `'verified'` to `read_only_fields` in `EmployeeDocumentSerializer`. Document verification should only be possible via the dedicated `@action(detail=True, methods=['POST'], permission_classes=[IsAdminOrHRorSuperintendent]) verify` endpoint.

---

### SEC-03: Unprotected Media File Storage & Confidential Personal/Medical Data Exposure
- **Severity:** **CRITICAL**
- **CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor), CWE-284 (Improper Access Control)
- **Affected Files:** `backend/config/settings.py` (lines 168-170), `backend/config/urls.py` (lines 19-21), `backend/core/models/`
- **Affected Routes:** `/media/*`
- **Evidence:**
  All user documents are stored under `MEDIA_ROOT = BASE_DIR / 'media'`.
  Models upload directly to standard folders:
  - `upload_to='e_signatures/'` (official digital signatures)
  - `upload_to='leave_documents/'` (VAWC medical records, psychological evaluations, rehabilitation certifications, histopathology reports)
  - `upload_to='loan_documents/'` (payslips, loan contracts, bank details)
  - `upload_to='applicant_pds/'` (Civil Service Form 212 with PhilSys, TIN, UMID, birth dates, family names)
  Django's default storage saves files using the original client filename (with simple numerical suffix collisions). In development, Django serves these without authentication (`static(settings.MEDIA_URL)`). In standard production deployments, web servers (e.g. Nginx, Apache) serve `/media/` statically without consulting Django authentication or role permissions.
- **Attack Scenario:**
  An unauthenticated attacker or unauthorized staff member accesses `http://<domain>/media/leave_documents/vawc_medical_cert.pdf` or `http://<domain>/media/e_signatures/signature.png`. The web server streams the file directly, causing an immediate breach of Republic Act No. 10173 (Philippine Data Privacy Act of 2012) and Civil Service confidentiality rules.
- **Remediation:**
  - Move sensitive files outside of the public document root to a private directory (`PRIVATE_MEDIA_ROOT`).
  - Serve all media downloads through an authenticated Django view that verifies object-level permissions and responds via `X-Accel-Redirect` (Nginx) or `django-sendfile2`.
  - Hash stored filenames with cryptographically random UUIDs (`uuid.uuid4()`).

---

### SEC-04: Attendance Geofence & QR Token Spoofing Allowing Remote Attendance Fraud
- **Severity:** **HIGH**
- **CWE:** CWE-345 (Insufficient Verification of Data Authenticity), CWE-290 (Authentication Bypass by Spoofing)
- **Affected Files:** `backend/core/views/attendance.py` (lines 39-85), `backend/core/utils/__init__.py` (lines 227-239)
- **Affected Routes:** `GET /api/attendance/get_daily_qr/`, `POST /api/attendance/scan/`, `GET /api/schools/`
- **Evidence:**
  1. `get_daily_qr` is accessible to **any** authenticated user (`permission_classes=[IsAuthenticated]`), generating a daily token deterministic for that calendar day:
     ```python
     def generate_daily_qr_token():
         today = timezone.localdate().isoformat()
         seed = f"{today}-{settings.SECRET_KEY}"
         return hashlib.md5(seed.encode()).hexdigest()[:12].upper()
     ```
  2. `SchoolViewSet` makes every school's exact latitude, longitude, and geofence radius accessible to all authenticated users via `GET /api/schools/`.
  3. The `scan` endpoint accepts client-provided coordinates directly:
     ```python
     token = request.data.get('qr_token')
     raw_lat = request.data.get('lat')
     raw_lng = request.data.get('lng')
     ```
- **Attack Scenario:**
  An employee creates a simple script or browser console call. The script fetches the daily QR token from `/api/attendance/get_daily_qr/`, looks up their school's coordinates from `/api/schools/`, and sends a `POST /api/attendance/scan/` with the exact school GPS coordinates. The backend calculates `distance = 0.0m`, accepts the punch as `present`, and logs attendance while the employee remains at home.
- **Remediation:**
  - Restrict `get_daily_qr` strictly to workstation display terminals or School Heads/Admins (`IsAdminOrHRorSuperintendent`).
  - Introduce rotating short-lived dynamic QR tokens (e.g. TOTP expiring every 30-60 seconds) displayed only on physical school kiosk screens.
  - Require client to submit device-level integrity attestation where supported.

---

### SEC-05: Mass Assignment on Loan Interest Rates
- **Severity:** **HIGH**
- **CWE:** CWE-915 (Improperly Controlled Modification of Dynamically Determined Object Attributes)
- **Affected Files:** `backend/core/serializers/loan.py` (lines 40-56), `backend/core/views/loan.py` (lines 47-69)
- **Affected Endpoint:** `POST /api/loans/`
- **Evidence:**
  In `LoanSerializer`:
  ```python
  class Meta:
      model = ProvidentLoan
      fields = [
          'id', 'employee', 'employee_name', 'employee_number',
          'loan_amount', 'interest_rate', 'term_months',
          ...
      ]
      read_only_fields = [
          'status', 'monthly_payment', 'total_amount', 'date_applied',
          'reviewed_by', 'reviewed_at', 'interest_receivable',
      ]
  ```
  `interest_rate` is omitted from `read_only_fields`.
  In `ProvidentLoan.save()`:
  ```python
  total = Decimal(str(self.loan_amount)) + (Decimal(str(self.loan_amount)) * (Decimal(str(self.interest_rate)) / 100))
  self.total_amount = round(total, 2)
  self.monthly_payment = round(total / self.term_months, 2)
  ```
- **Attack Scenario:**
  A borrower submits a loan application with payload `{"loan_amount": 100000, "interest_rate": 0, "term_months": 24}`. The backend calculates monthly payments based on 0% interest instead of the statutory DepEd Provident Fund rate (typically 6% per annum), causing financial loss to the division provident fund.
- **Remediation:**
  Add `'interest_rate'` to `read_only_fields` in `LoanSerializer`. Set statutory interest rates server-side in `perform_create()` or model logic.

---

### SEC-06: Complete Absence of API Throttling & Rate Limiting
- **Severity:** **HIGH**
- **CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts), CWE-799 (Improper Control of Interaction Frequency)
- **Affected Files:** `backend/config/settings.py` (lines 183-189)
- **Affected Routes:** `/api/token/`, `/api/employees/register-existing/`, `/api/employees/change-password/`, `/api/dashboard/summary/`, `/api/pds/extract/`
- **Evidence:**
  `settings.REST_FRAMEWORK` contains:
  ```python
  REST_FRAMEWORK = {
      'DEFAULT_AUTHENTICATION_CLASSES': (
          'rest_framework_simplejwt.authentication.JWTAuthentication',
      ),
      'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
      'PAGE_SIZE': 10,
  }
  ```
  No throttle classes (`AnonRateThrottle`, `UserRateThrottle`, or scoped throttles) are configured globally or locally on any view.
- **Attack Scenario:**
  1. An attacker executes a dictionary attack against `/api/token/` targeting administrative accounts (`admin`, `superintendent`, `hr_admin`) without experiencing delays, backoffs, or lockouts.
  2. An attacker spams calls to `/api/dashboard/summary/` or `/api/pds/extract/`, exhausting the organization's Google Gemini API quota and racking up unnecessary billing expenses.
- **Remediation:**
  Configure DRF throttling in `settings.py`:
  ```python
  'DEFAULT_THROTTLE_CLASSES': [
      'rest_framework.throttling.AnonRateThrottle',
      'rest_framework.throttling.UserRateThrottle',
  ],
  'DEFAULT_THROTTLE_RATES': {
      'anon': '100/day',
      'user': '1000/day',
      'auth': '5/minute',
      'ai': '10/hour',
  }
  ```

---

### SEC-07: Insecure Token Lifecycle & Absence of Server-Side Revocation
- **Severity:** **MEDIUM**
- **CWE:** CWE-613 (Insufficient Session Expiration)
- **Affected Files:** `backend/config/settings.py` (lines 64-74, 191-195), `frontend/src/context/AuthContext.jsx` (lines 76-82)
- **Affected Routes:** `/api/token/refresh/`
- **Evidence:**
  `rest_framework_simplejwt.token_blacklist` is missing from `INSTALLED_APPS`. `ROTATE_REFRESH_TOKENS` is False. The frontend `logout` function simply removes tokens from browser `localStorage`.
- **Attack Scenario:**
  If an employee's access token or refresh token is compromised (via network eavesdropping, malware, or shared computer caches), the token remains valid and usable until its natural expiration (1 hour for access, up to 1 day for refresh). If an employee is terminated or their role is demoted, an attacker holding the token can continue making authorized requests.
- **Remediation:**
  - Add `'rest_framework_simplejwt.token_blacklist'` to `INSTALLED_APPS`.
  - Enable `'ROTATE_REFRESH_TOKENS': True` and `'BLACKLIST_AFTER_ROTATION': True` in `SIMPLE_JWT`.
  - Add an authenticated `/api/logout/` endpoint that accepts the refresh token and writes it to the server blacklist.

---

### SEC-08: Bypass of Django Password Validators in Account Creation & Password Change
- **Severity:** **MEDIUM**
- **CWE:** CWE-521 (Weak Password Requirements)
- **Affected Files:** `backend/core/views/employee.py` (lines 83-138, 270-290)
- **Affected Routes:** `POST /api/employees/register-existing/`, `POST /api/employees/change-password/`
- **Evidence:**
  In `change_password`:
  ```python
  if len(new_password) < 8:
      return Response({"error": "New password must be at least 8 characters long."}, status=400)
  user.set_password(new_password)
  user.save()
  ```
  In `register_existing`, `Employee.objects.create_with_user()` invokes `User.objects.create_user()`. In Django, `create_user()` does not run `AUTH_PASSWORD_VALIDATORS`.
- **Attack Scenario:**
  Users register or change passwords to predictable passwords such as `12345678`, `password123`, or their own usernames, undermining PBKDF2 hashing protections.
- **Remediation:**
  Import and invoke `django.contrib.auth.password_validation.validate_password(password, user)` in both `change_password` and `register_existing`.

---

### SEC-09: Post-Approval Leave Tampering via Unrestricted Update Actions
- **Severity:** **MEDIUM**
- **CWE:** CWE-863 (Incorrect Authorization)
- **Affected Files:** `backend/core/views/leave.py` (lines 15-58)
- **Affected Route:** `PUT / PATCH /api/leaves/<id>/`
- **Evidence:**
  `LeaveViewSet` inherits standard `ModelViewSet`. While `get_queryset()` ensures an employee can only update their own record, `perform_update` is not overridden, and `LeaveRequestSerializer` does not mark `start_date` or `end_date` as read-only.
- **Attack Scenario:**
  An employee applies for 3 days of vacation leave. After the School Principal and Division Superintendent approve the leave, the employee issues a `PATCH /api/leaves/<id>/` changing `start_date` and `end_date` to cover 10 days. The status remains `approved` without triggering re-approval or balance re-computation.
- **Remediation:**
  Override `perform_update` in `LeaveViewSet` to reject updates if `instance.status != 'pending_supervisor'` (or `pending_hr` for non-teaching staff).

---

### SEC-10: Plaintext Temporary Credential Exposure in Recruitment Status Change API Response
- **Severity:** **LOW**
- **CWE:** CWE-532 (Insertion of Sensitive Information into Log File / Response)
- **Affected File:** `backend/core/views/recruitment.py` (lines 276-277)
- **Affected Route:** `POST /api/applicants/<id>/change-status/`
- **Evidence:**
  ```python
  if employee_created:
      msg += f" An Employee profile has been automatically created (Username: {username_created}, Password: {temp_password})."
  return Response({"message": msg, ...})
  ```
- **Attack Scenario:**
  When an applicant is marked as hired, the generated temporary password is sent over the wire in the HTTP response JSON. This exposes the password to browser history, proxy caches, API logs, and any staff member viewing the HRMPSB interface.
- **Remediation:**
  Do not include the temporary password in the HTTP response payload. Rely strictly on direct email delivery to the applicant (`send_applicant_notification`).

---

### SEC-11: User and Email Enumeration on Public Registration Endpoint
- **Severity:** **LOW**
- **CWE:** CWE-204 (Observable Response Discrepancy)
- **Affected File:** `backend/core/views/employee.py` (lines 100-103)
- **Affected Route:** `POST /api/employees/register-existing/`
- **Evidence:**
  ```python
  if User.objects.filter(username=username).exists():
      return Response({"error": "Username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
  if User.objects.filter(email=email).exists():
      return Response({"error": "Email is already registered."}, status=status.HTTP_400_BAD_REQUEST)
  ```
- **Attack Scenario:**
  An external attacker scripts username and email checks against the registration route to discover active teacher and executive email accounts.
- **Remediation:**
  Return a uniform error message, or require an initial registration verification token sent to the user's official email address.

---

### SEC-12: Missing Content Security Policy (CSP) & Permissions-Policy Headers
- **Severity:** **LOW**
- **CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers or Content)
- **Affected File:** `backend/config/settings.py` (lines 76-85)
- **Evidence:**
  `MIDDLEWARE` lacks `django-csp` or custom headers for `Content-Security-Policy`.
- **Remediation:**
  Install `django-csp` and define strict directives:
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' <API_URL>`.

---

### SEC-13: Missing Field-Level Encryption for Sensitive Government IDs
- **Severity:** **INFORMATIONAL**
- **CWE:** CWE-311 (Missing Encryption of Sensitive Data)
- **Affected File:** `backend/core/models/employee.py` (lines 100-106)
- **Description:**
  Fields `philsys_id`, `tin_no`, `umid_id`, `pagibig_id`, `philhealth_no`, and `account_number` are stored in plaintext columns. In case of database backup leakage, sensitive national identification numbers would be exposed.
- **Remediation:**
  Implement encrypted model fields (e.g., using `django-cryptography` or PostgreSQL `pgcrypto`).

---

### SEC-14: Hardcoded Development Host in Email Onboarding Template
- **Severity:** **INFORMATIONAL**
- **CWE:** CWE-656 (Reliance on Security Through Environment Assumptions)
- **Affected File:** `backend/core/notifications.py` (line 22)
- **Description:**
  `Portal Login Link: http://localhost:5173/login` is hardcoded in the new employee notification email body. Newly hired personnel receiving this email in production will receive an unusable link.
- **Remediation:**
  Read the frontend portal base URL from `settings.FRONTEND_URL`.

---

## 5. Audit Limitations

1. **Static Analysis Focus:** This audit was conducted via comprehensive static source code inspection without launching active exploit payloads or performing denial-of-service tests against running databases.
2. **Third-Party Infrastructure:** External services (Google Gemini API, Google Cloud project security, SMTP email provider) and underlying host OS hardening were not directly inspected.
3. **Absence of Staging Infrastructure:** Physical deployment configurations (Nginx reverse proxy configs, TLS certificate management, and web application firewall rules) were assessed based on repository defaults rather than live server audits.
