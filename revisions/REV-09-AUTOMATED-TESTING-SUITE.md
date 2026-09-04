# Revision Specification: REV-09
## Title: Automated Test Suite Setup (Pytest & DRF TestCases)

### 1. Objective & Problem Statement
Currently, running `pytest` in `backend` yields `collected 0 items`. There are no unit or integration tests verifying payroll computations, leave deduction logic, attendance mapping, or authentication. Any change to business rules risks undetected regressions.

### 2. Proposed Test Suite Structure
```
backend/core/tests/
├── __init__.py
├── conftest.py               <-- Shared fixtures (User, Roles, Employee, Schools)
├── test_attendance.py        <-- QR scan window tests, Asia/Manila 8:00 AM cutoff
├── test_leave.py             <-- CSC Form 6 sick leave retrospective filing & balance deductions
├── test_payroll.py           <-- GSIS, PhilHealth, Pag-IBIG, TRAIN tax calculations & loan payoffs
└── test_recruitment.py       <-- DO 7, s. 2023 100-pt rubric & RQA 50-pt cut-off
```

### 3. Step-by-Step Implementation Instructions

#### Step 1: Create `backend/core/tests/conftest.py`
Define standard fixtures:
* `admin_user`, `hr_user`, `teacher_user`, `superintendent_user`
* `teacher_employee` with SG 11 (₱27,000 base salary)
* `mock_school` with standard coordinates

#### Step 2: Implement `test_payroll.py`
Verify calculations in `PayrollCalculator`:
1. Check that GSIS deduction is exactly 9% of basic salary / 2.
2. Check that TRAIN Law withholding tax correctly calculates for salaries above ₱20,833.33.
3. Check that releasing payroll with active loans properly records `LoanPayment` and decrements remaining balance.

#### Step 3: Implement `test_leave.py`
Verify CSC Form 6 rules:
1. Verify Sick Leave filed 10 days in the past succeeds.
2. Verify Vacation Leave filed for yesterday raises `ValidationError`.
3. Verify approving a leave deducts from `sick_leave_balance` or `vacation_leave_balance`.

#### Step 4: Implement `test_attendance.py`
Verify timekeeping logic:
1. Verify check-in before 8:00 AM PST marks `status = 'present'`.
2. Verify check-in after 8:00 AM PST marks `status = 'late'`.
3. Verify AM IN window accepts scans between 05:00 and 11:59.

### 4. Verification & Acceptance Criteria
1. Running `pytest` inside `backend/` collects at least 15 tests across the 4 modules.
2. All tests pass with 0 failures: `15 passed in X.XXs`.
