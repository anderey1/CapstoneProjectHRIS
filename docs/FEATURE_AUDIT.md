# Capstone Project: Feature Audit Report
**Title:** HRIS with HR Management + Descriptive Analytics for DepEd - Lucena City  
**Date:** June 3, 2026  
**Status:** Pre-Oral Defense Prototype (Production Ready)

---

## 1. Innovation Highlights (The "Defense" Edge)

| Feature | Technical Implementation | Practical Value |
| :--- | :--- | :--- |
| **Facial Recognition** | Client-side `Face-API.js` (TensorFlow.js) with 128-point biometric descriptors. | Eliminates "buddy punching" (proxy attendance). Secure identity verification. |
| **Geo-Fencing** | Haversine algorithm for distance calculation between GPS coordinates and station radius. | Ensures employees are physically within the school/office premises to clock in. |
| **Generative AI** | Gemini API (Google GenAI) integration for automated performance summaries. | Converts raw attendance and rating data into professional narrative reports. |
| **Descriptive Analytics** | Recharts dynamic data visualization for loans, payroll, and staff distribution. | Provides HR management with high-level financial and personnel health insights. |

---

## 2. Core HR & Financial Modules

### A. Attendance System (Triple-Factor)
- **Time Factor**: Daily rotating security tokens (QR concepts) to prevent spoofing.
- **Location Factor**: Mandatory GPS check vs. pre-defined School/Office coordinates.
- **Identity Factor**: Mandatory facial recognition match against biometric reference.
- **DTR Integration**: Automatic logging of Time-In/Out with "Flagged" status for off-site attempts.

### B. Payroll Management
- **Attendance-Based Pro-rating**: Salaries calculated dynamically based on days present (e.g., `(Monthly / 22) * Days Worked`).
- **Segregation of Duties**: 
    - **HR**: Finalizes attendance and generates draft payslips.
    - **Accountant**: Reviews, approves deductions, and triggers disbursement.
- **Government Deductions**: Automatic computation of SSS, PhilHealth, Pag-IBIG, and Withholding Tax.
- **Loan Integration**: Automatic deduction of Provident Loan amortizations from net pay.
- **Mock Disbursement**: Realistic Land Bank (LBP) ATM channel simulation with account masking.

### C. Loan Management (Provident Fund)
- **Workflow**: Applied → Reviewed (Supervisor) → Approved (HR) → Released (Accountant).
- **Eligibility Guard**: Co-maker salary validation (must be ≥ applicant's salary).
- **Automation**: Successive loan repayment tracking integrated into the payroll release cycle.

---

## 3. Personnel Management (PDS)
- **PDS Digitalization**: Integrated Personal Data Sheet sections (Family, Education, Eligibility, Work Experience).
- **Biometric Enrollment**: Self-service face enrollment portal within the user profile.
- **Document Management**: Support for uploading and reviewing loan application requirements.

---

## 4. Technical Architecture
- **Backend**: Django 6.x, PostgreSQL, JWT Authentication.
- **Frontend**: React + Vite, Tailwind CSS + DaisyUI (High-Contrast Professional Aesthetic).
- **Security**: 
    - Role-Based Access Control (RBAC): Admin, HR, Accountant, Supervisor, Employee.
    - Field-level whitelisting for profile self-updates.
    - Atomic database transactions for critical financial operations.

---

## 5. Audit Log & System Integrity
- **Traceability**: Every sensitive action (Approvals, Releases, Profile Updates) is logged with a timestamp and user ID.
- **Data Integrity**: Integrity checks for missing salaries or invalid roles before processing financial drafts.

---
*Prepared for the DepEd Lucena City HRIS Defense.*
