# Security Remediation & Regression Testing Plan

**Project:** DepEd Lucena City Division HRIS  
**Date:** October 15, 2026  
**Auditor:** Senior Application Security Engineer  

This document details prioritized, step-by-step remediation plans for all identified security vulnerabilities, along with an explicit regression-testing and validation suite.

---

## 1. Production Deployment Blockers (Remediation Order)

The following five vulnerabilities directly threaten system integrity and statutory data privacy compliance, and **must block production deployment** until fully resolved:

1. **Phase 1 (Immediate Blocker): SEC-01 & SEC-02 — File Upload & Access Control Patches**
   - **SEC-01**: Secure `POST /api/applicants/` against arbitrary file upload and disk exhaustion.
   - **SEC-02**: Seal the mass assignment flaw in `EmployeeDocumentSerializer` allowing document self-verification.
2. **Phase 2 (Immediate Blocker): SEC-03 — Media Storage Confidentiality & Access Control**
   - Relocate sensitive uploads outside the public web root and route file downloads through authenticated Django permission checks.
3. **Phase 3 (Immediate Blocker): SEC-06 — Rate Limiting & API Throttling**
   - Configure global and endpoint-scoped throttles to stop brute-forcing and resource exhaustion.
4. **Phase 4 (Immediate Blocker): SEC-04 & SEC-05 — Attendance & Financial Logic Integrity**
   - **SEC-04**: Restrict QR code generation to authorized station displays and harden attendance geofence validation.
   - **SEC-05**: Lock down `interest_rate` in `LoanSerializer` to prevent loan interest manipulation.
5. **Phase 5 (Secondary Hardening): SEC-07, SEC-08, SEC-09 — Identity & Workflow Hardening**
   - Implement JWT token blacklisting, enforce `AUTH_PASSWORD_VALIDATORS`, and freeze approved leave requests against unauthorized modification.

---

## 2. Detailed Technical Remediation Instructions

### Phase 1: File Upload Security & Document Verification Fixes

#### 1.1 Fix SEC-01 (Unrestricted File Upload on Applicant Portal)
- **Target File:** `backend/core/models/recruitment.py`, `backend/core/views/recruitment.py`
- **Actions:**
  1. Define a strict file validator in `core/models/recruitment.py`:
     ```python
     def validate_applicant_document(value):
         max_bytes = 10 * 1024 * 1024 # 10MB
         if value.size > max_bytes:
             raise ValidationError("File size exceeds 10MB limit.")
         ext = os.path.splitext(value.name)[1].lower()
         allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
         if ext not in allowed_extensions:
             raise ValidationError(f"File type '{ext}' is not permitted. Only PDF and images are allowed.")
     ```
  2. Attach this validator to `Applicant.pds_file`, `Applicant.resume`, and `ApplicantDocument.file`.
  3. In `ApplicantViewSet.perform_create`, reject files whose declared MIME type is not in `['application/pdf', 'image/jpeg', 'image/png']`.

#### 1.2 Fix SEC-02 (Document Self-Verification Vulnerability)
- **Target File:** `backend/core/serializers/employee.py`
- **Actions:**
  In `EmployeeDocumentSerializer.Meta.read_only_fields`, add `'verified'`:
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
          read_only_fields = ['id', 'uploaded_at', 'verified', 'verified_by', 'verified_at', 'file_url']
  ```
  Ensure that only `EmployeeDocumentViewSet.verify` can set `verified=True`.

---

### Phase 2: Private Media Delivery & Data Protection

#### 2.1 Fix SEC-03 (Unprotected Media Exposure)
- **Target Files:** `backend/config/settings.py`, `backend/config/urls.py`, `backend/core/views/employee.py`
- **Actions:**
  1. Define `PRIVATE_MEDIA_ROOT = BASE_DIR / 'private_media'`.
  2. Ensure sensitive models (`EmployeeDocument`, `LeaveRequest`, `ProvidentLoan`, `ApplicantDocument`) use a private storage backend.
  3. Create an authenticated download view:
     ```python
     @api_view(['GET'])
     @permission_classes([IsAuthenticated])
     def download_employee_document(request, pk):
         doc = get_object_or_404(EmployeeDocument, pk=pk)
         if not (request.user.is_management or doc.employee.user == request.user):
             return Response({"detail": "Forbidden"}, status=403)
         return FileResponse(doc.file.open(), as_attachment=True, filename=doc.file_name)
     ```
  4. In production with Nginx, use `X-Accel-Redirect` headers to offload file delivery to Nginx after Django authentication succeeds.

---

### Phase 3: Rate Limiting & Throttling Configuration

#### 3.1 Fix SEC-06 (Missing Rate Limiting)
- **Target File:** `backend/config/settings.py`
- **Actions:**
  Add DRF throttling classes and rates:
  ```python
  REST_FRAMEWORK = {
      'DEFAULT_AUTHENTICATION_CLASSES': (
          'rest_framework_simplejwt.authentication.JWTAuthentication',
      ),
      'DEFAULT_PERMISSION_CLASSES': (
          'rest_framework.permissions.IsAuthenticated',
      ),
      'DEFAULT_THROTTLE_CLASSES': [
          'rest_framework.throttling.AnonRateThrottle',
          'rest_framework.throttling.UserRateThrottle',
      ],
      'DEFAULT_THROTTLE_RATES': {
          'anon': '120/hour',
          'user': '2000/hour',
          'auth': '5/minute',
          'public_apply': '5/hour',
      },
      'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
      'PAGE_SIZE': 10,
  }
  ```
  Apply `throttle_scope = 'auth'` to `MyTokenObtainPairView`, `change_password`, and `register_existing`. Apply `throttle_scope = 'public_apply'` to `ApplicantViewSet.create`.

---

### Phase 4: Business Logic & Integrity Fixes

#### 4.1 Fix SEC-04 (Attendance QR & Geofence Spoofing)
- **Target Files:** `backend/core/views/attendance.py`, `backend/core/permissions.py`
- **Actions:**
  1. Change permissions on `AttendanceViewSet.get_daily_qr` to `[IsAdminOrHRorSuperintendent]` so only station kiosk screens or administrators can request the token.
  2. Modify QR token generation to rotate every 60 seconds (TOTP algorithm) so static tokens cannot be shared across messaging apps.
  3. In `AttendanceViewSet.scan`, enforce a maximum allowable GPS accuracy radius (e.g., discard scans reporting accuracy > 50 meters to prevent simulated coarse location coordinates).

#### 4.2 Fix SEC-05 (Mass Assignment on Loan Interest Rates)
- **Target File:** `backend/core/serializers/loan.py`
- **Actions:**
  Add `'interest_rate'` to `read_only_fields` in `LoanSerializer`:
  ```python
  read_only_fields = [
      'status', 'interest_rate', 'monthly_payment', 'total_amount', 'date_applied',
      'reviewed_by', 'reviewed_at', 'interest_receivable',
  ]
  ```
  In `LoanViewSet.perform_create`, assign the official statutory rate:
  ```python
  serializer.save(employee=employee, interest_rate=Decimal('6.00'))
  ```

---

### Phase 5: Authentication & Session Lifecycle Hardening

#### 5.1 Fix SEC-07 (Token Blacklisting & Logout)
- **Target Files:** `backend/config/settings.py`, `backend/config/urls.py`, `frontend/src/context/AuthContext.jsx`
- **Actions:**
  1. Add `'rest_framework_simplejwt.token_blacklist'` to `INSTALLED_APPS`.
  2. Run `venv\Scripts\python.exe manage.py migrate`.
  3. Set `'ROTATE_REFRESH_TOKENS': True` and `'BLACKLIST_AFTER_ROTATION': True` in `SIMPLE_JWT`.
  4. Add `/api/token/blacklist/` endpoint and call it on frontend `logout()`.

#### 5.2 Fix SEC-08 (Enforce Password Validators)
- **Target File:** `backend/core/views/employee.py`
- **Actions:**
  In `change_password` and `register_existing`:
  ```python
  from django.contrib.auth.password_validation import validate_password
  from django.core.exceptions import ValidationError as DjangoValidationError

  try:
      validate_password(new_password, user=user)
  except DjangoValidationError as err:
      return Response({"error": list(err.messages)}, status=status.HTTP_400_BAD_REQUEST)
  ```

#### 5.3 Fix SEC-09 (Freeze Approved Leave Modifications)
- **Target File:** `backend/core/views/leave.py`
- **Actions:**
  Override `perform_update` in `LeaveViewSet`:
  ```python
  def perform_update(self, serializer):
      leave = self.get_object()
      if leave.status in ['approved', 'rejected']:
          raise ValidationError("Finalized leave requests cannot be modified.")
      serializer.save()
  ```

---

## 3. Regression Testing & Verification Plan

Following code changes, run targeted validation suites to prove fixes without regressions.

### 3.1 Targeted Automated Pytest Commands
Execute from `backend/`:

```bash
cd backend

# 1. Verify access control & leave workflow
venv\Scripts\python.exe -m pytest core/tests/test_leave.py -v

# 2. Verify loan creation and financial calculation atomicity
venv\Scripts\python.exe -m pytest core/tests/test_loan.py -v

# 3. Verify attendance geofencing calculations
venv\Scripts\python.exe -m pytest core/tests/test_attendance.py -v

# 4. Verify settings environment fail-closed compliance
venv\Scripts\python.exe -m pytest core/tests/test_settings.py -v
```

### 3.2 New Security Test Cases to Add (`core/tests/test_security_audit.py`)
Implement the following regression tests to lock in security controls:

1. `test_applicant_rejects_unallowed_file_types`:
   - Send `POST /api/applicants/` with a `.html` or `.exe` attachment.
   - Assert HTTP 400 Bad Request with validation error message.
2. `test_employee_document_cannot_be_self_verified`:
   - Authenticate as regular teacher.
   - Send `PATCH /api/employee-documents/<id>/` with `{"verified": true}`.
   - Reload document from database; assert `verified` remains `False`.
3. `test_loan_interest_rate_cannot_be_overridden_by_applicant`:
   - Authenticate as employee.
   - Send `POST /api/loans/` with `{"loan_amount": 50000, "interest_rate": 0.0}`.
   - Reload loan; assert `interest_rate` equals official statutory rate (e.g. 6.00).
4. `test_approved_leave_cannot_be_modified_by_employee`:
   - Create an approved leave request.
   - Send `PATCH /api/leaves/<id>/` changing dates.
   - Assert HTTP 400 Bad Request.
5. `test_password_validation_blocks_trivial_passwords`:
   - Call `change-password` with `12345678`.
   - Assert HTTP 400 Bad Request with password similarity / common password errors.
6. `test_attendance_qr_endpoint_rejects_non_management_staff`:
   - Authenticate as regular teaching staff.
   - Send `GET /api/attendance/get_daily_qr/`.
   - Assert HTTP 403 Forbidden.

### 3.3 Frontend Build Verification
Verify no frontend build regressions:

```bash
cd frontend
npm.cmd run build
```
Ensure build outputs clean bundles without build breakages.
