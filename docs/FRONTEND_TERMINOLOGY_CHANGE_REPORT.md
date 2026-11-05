# Frontend terminology change report

Date: 2026-10-29. Scope: wording only, following FRONTEND_TERMINOLOGY_AUDIT.md and antislop-copywriting.

Updated headings, navigation, buttons, statuses, instructions, placeholders, and notifications. Removed wording that implied bank transfers, formal audits, permanent appointments, or official verification where the UI only records an action or displays entered data. Preserved official form titles and specialist terms where meaningful.

## Applied changes

Applied 104 text replacements across 40 source files.

| File | Line | Previous wording | New wording |
|---|---|---|---|
| [frontend/src/components/layout/SidebarContent.jsx](../frontend/src/components/layout/SidebarContent.jsx#L60) | 60 | My Payslips & W-2 | My Payslips |
| [frontend/src/pages/admin/AuditLogs.jsx](../frontend/src/pages/admin/AuditLogs.jsx#L157) | 157 | Immutable Audit Trail | Activity history |
| [frontend/src/pages/Login.jsx](../frontend/src/pages/Login.jsx#L54) | 54 | PORTAL SECURE | Staff Portal |
| [frontend/src/features/dashboard/AccountantDashboard.jsx](../frontend/src/features/dashboard/AccountantDashboard.jsx#L170) | 170 | Values reflect audited net disbursements | Values show recorded net payroll amounts |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L104) | 104 | Disburse & Credit Salaries to LandBank ATM | Record Payroll Release |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L54) | 54 | Salaries have been credited. | Payroll release recorded. |
| [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L25) | 25 | LandBank of the Philippines | Authorized Payroll Staff |
| [frontend/src/pages/employee/MyPayroll.jsx](../frontend/src/pages/employee/MyPayroll.jsx#L374) | 374 | Disbursed to official LandBank payroll account | Payroll release recorded |
| [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L40) | 40 | Civil Service Commission & Commission on Audit (COA) compliance chain | Payroll preparation, approval, and release |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L122) | 122 | Official Commission on Audit Reports | Payroll Reports |
| [frontend/src/features/payroll/hooks/usePayroll.js](../frontend/src/features/payroll/hooks/usePayroll.js#L91) | 91 | General Payroll approved and signed successfully! | Payroll approved. |
| [frontend/src/pages/admin/AttendanceManagement.jsx](../frontend/src/pages/admin/AttendanceManagement.jsx#L71) | 71 | Biometric & Station Logging Active | Attendance Monitoring |
| [frontend/src/features/dashboard/SuperintendentDashboard.jsx](../frontend/src/features/dashboard/SuperintendentDashboard.jsx#L222) | 222 | Real-time aggregate count of biometric/QR scans logged today. | Attendance records for today. |
| [frontend/src/features/profile/components/ProfileHeader.jsx](../frontend/src/features/profile/components/ProfileHeader.jsx#L127) | 127 | PDS core fields verified | PDS fields completed |
| [frontend/src/features/profile/components/ProfileHeader.jsx](../frontend/src/features/profile/components/ProfileHeader.jsx#L73) | 73 | Permanent / Appointed | Appointment date recorded |
| [frontend/src/features/performance/components/IPCRFDetailsModal.jsx](../frontend/src/features/performance/components/IPCRFDetailsModal.jsx#L196) | 196 | Civil Service Promotion Endorsement | Promotion Rating Indicator |
| [frontend/src/features/performance/components/IPCRFDetailsModal.jsx](../frontend/src/features/performance/components/IPCRFDetailsModal.jsx#L207) | 207 | Endorsed for Promotion | Meets configured rating threshold |
| [frontend/src/features/performance/components/IPCRFDetailsModal.jsx](../frontend/src/features/performance/components/IPCRFDetailsModal.jsx#L211) | 211 | Minimum composite rating of 4.000 required for institutional promotion. | Configured rating threshold: 4.000. This indicator does not confirm promotion approval. |
| [frontend/src/features/profile/components/ProfileSidebar.jsx](../frontend/src/features/profile/components/ProfileSidebar.jsx#L95) | 95 | Geofenced (100m) | Assigned work location |
| [frontend/src/pages/admin/AdminDashboard.jsx](../frontend/src/pages/admin/AdminDashboard.jsx#L218) | 218 | Geofence Compliance | Attendance Location Checks |
| [frontend/src/pages/admin/AdminDashboard.jsx](../frontend/src/pages/admin/AdminDashboard.jsx#L222) | 222 | Geofence Compliance | Attendance Location Checks |
| [frontend/src/features/profile/components/DocumentPreviewModal.jsx](../frontend/src/features/profile/components/DocumentPreviewModal.jsx#L52) | 52 | Verified | Sample ID preview |
| [frontend/src/features/profile/components/constants.js](../frontend/src/features/profile/components/constants.js#L11) | 11 | Verified IDs | Government IDs |
| [frontend/src/components/common/PDSUploadModal.jsx](../frontend/src/components/common/PDSUploadModal.jsx#L133) | 133 | Drop your CS Form 212 PDF here. | Select your CS Form 212 PDF. |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L33) | 33 | Accounting Command Center | Payroll Actions |
| [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L37) | 37 | Division Payroll Processing Pipeline | Payroll Processing Steps |
| [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L89) | 89 | Active In Progress | In Progress |
| [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L89) | 89 | Pending Previous Step | Waiting for Previous Step |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L44) | 44 | Awaiting Draft Calculation | Not Yet Calculated |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L45) | 45 | Pending Superintendent Sign-off | Awaiting Superintendent Approval |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L47) | 47 | Cutoff Completed & Disbursed | Payroll Release Recorded |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L154) | 154 | Single Staff Recalculation: | Recalculate Employee Payroll |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L156) | 156 | Re-run calculation for an individual personnel after DTR update | Recalculate payroll for an employee after updating their DTR. |
| [frontend/src/features/loans/components/LoanActionWorkflow.jsx](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L33) | 33 | Audit Actions (Step 1: Document Verification) | Step 1: Verify Documents |
| [frontend/src/features/loans/components/LoanActionWorkflow.jsx](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L107) | 107 | Executive Approval (Step 2: Superintendent Certification) | Step 2: Superintendent Approval |
| [frontend/src/features/loans/components/LoanActionWorkflow.jsx](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L72) | 72 | Disapprove / Return Application (Specify COA audit justification): | Reason for Disapproval |
| [frontend/src/features/loans/components/LoanActionWorkflow.jsx](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L130) | 130 | Endorsing... | Approving... |
| [frontend/src/features/loans/components/LoanActionWorkflow.jsx](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L185) | 185 | Release & Disburse Principal to Borrower | Record Loan Release |
| [frontend/src/features/loans/components/LoanReviewModal.jsx](../frontend/src/features/loans/components/LoanReviewModal.jsx#L163) | 163 | Supporting Document Compliance | Supporting Documents |
| [frontend/src/pages/employee/MyLoans.jsx](../frontend/src/pages/employee/MyLoans.jsx#L165) | 165 | Active Disbursed Principal | Principal of Active Loans |
| [frontend/src/pages/employee/MyLoans.jsx](../frontend/src/pages/employee/MyLoans.jsx#L168) | 168 | Active Disbursed Principal | Principal of Active Loans |
| [frontend/src/features/loans/components/LoanCard.jsx](../frontend/src/features/loans/components/LoanCard.jsx#L151) | 151 | Active Amortization | Approved Loan |
| [frontend/src/pages/admin/Employees.jsx](../frontend/src/pages/admin/Employees.jsx#L173) | 173 | Instructional cadre | Teaching employees |
| [frontend/src/pages/admin/Employees.jsx](../frontend/src/pages/admin/Employees.jsx#L166) | 166 | Total Plantilla Roster | Total Employees |
| [frontend/src/pages/admin/Employees.jsx](../frontend/src/pages/admin/Employees.jsx#L157) | 157 | Add Plantilla Employee | Add Employee |
| [frontend/src/pages/admin/Employees.jsx](../frontend/src/pages/admin/Employees.jsx#L321) | 321 | Credentials Requested | Requested Account Role |
| [frontend/src/pages/admin/StaffDTRManagement.jsx](../frontend/src/pages/admin/StaffDTRManagement.jsx#L224) | 224 | Plantilla ID # | Employee Record ID # |
| [frontend/src/pages/admin/AuditLogs.jsx](../frontend/src/pages/admin/AuditLogs.jsx#L220) | 220 | Tracked mutation actions | Recorded changes |
| [frontend/src/pages/admin/AuditLogs.jsx](../frontend/src/pages/admin/AuditLogs.jsx#L283) | 283 | Target Module | Section |
| [frontend/src/pages/admin/AuditLogs.jsx](../frontend/src/pages/admin/AuditLogs.jsx#L319) | 319 | Target Module | Section |
| [frontend/src/pages/admin/AuditLogs.jsx](../frontend/src/pages/admin/AuditLogs.jsx#L230) | 230 | Search actor, action text, or reference ID... | Search by user, action, or reference ID... |
| [frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx](../frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx#L253) | 253 | Application Specification | Application Details |
| [frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx](../frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx#L121) | 121 | Search subordinate name... | Search employee name... |
| [frontend/src/features/recruitment/components/AddApplicantModal.jsx](../frontend/src/features/recruitment/components/AddApplicantModal.jsx#L175) | 175 | Initial Pipeline Stage | Initial Application Status |
| [frontend/src/features/recruitment/components/ApplicantDetailModal.jsx](../frontend/src/features/recruitment/components/ApplicantDetailModal.jsx#L222) | 222 | Pipeline Status | Application Status |
| [frontend/src/features/recruitment/components/RecruitmentTable.jsx](../frontend/src/features/recruitment/components/RecruitmentTable.jsx#L111) | 111 | Pipeline Status | Application Status |
| [frontend/src/features/recruitment/components/RecruitmentTable.jsx](../frontend/src/features/recruitment/components/RecruitmentTable.jsx#L7) | 7 | Staff Evaluation | Comparative Assessment |
| [frontend/src/features/recruitment/components/ApplicantScoringMatrix.jsx](../frontend/src/features/recruitment/components/ApplicantScoringMatrix.jsx#L31) | 31 | Staff Evaluation Scores | Applicant Assessment Scores |
| [frontend/src/features/recruitment/components/RecruitmentMetricsBar.jsx](../frontend/src/features/recruitment/components/RecruitmentMetricsBar.jsx#L54) | 54 | Plantilla deployed | Appointments recorded |
| [frontend/src/features/recruitment/components/AddApplicantModal.jsx](../frontend/src/features/recruitment/components/AddApplicantModal.jsx#L178) | 178 | Initial QS Evaluation | Initial Qualifications Review |
| [frontend/src/features/recruitment/components/ApplicantDetailModal.jsx](../frontend/src/features/recruitment/components/ApplicantDetailModal.jsx#L244) | 244 | Disqualified (QS Fail) | Does Not Meet Qualification Standards |
| [frontend/src/components/common/PDSUploadModal.jsx](../frontend/src/components/common/PDSUploadModal.jsx#L131) | 131 | Intelligent PDS Reader | Import PDS Details |
| [frontend/src/components/common/PDSUploadModal.jsx](../frontend/src/components/common/PDSUploadModal.jsx#L156) | 156 | Execute OCR Scan | Extract PDS Details |
| [frontend/src/pages/RegisterExisting.jsx](../frontend/src/pages/RegisterExisting.jsx#L376) | 376 | Portal Security & Login Credentials | Account Details |
| [frontend/src/pages/Login.jsx](../frontend/src/pages/Login.jsx#L31) | 31 | Invalid credentials. Please verify your employee username and password. | Incorrect username or password. |
| [frontend/src/pages/Login.jsx](../frontend/src/pages/Login.jsx#L143) | 143 | Verifying Credentials... | Signing In... |
| [frontend/src/features/profile/components/CivilServiceEligibilityTab.jsx](../frontend/src/features/profile/components/CivilServiceEligibilityTab.jsx#L69) | 69 | No Eligibility Credentials Registered | No Eligibility Records Added |
| [frontend/src/features/profile/components/EducationalBackgroundTab.jsx](../frontend/src/features/profile/components/EducationalBackgroundTab.jsx#L81) | 81 | No Education Credentials Added | No Education Records Added |
| [frontend/src/features/employees/components/PersonnelFormModal.jsx](../frontend/src/features/employees/components/PersonnelFormModal.jsx#L332) | 332 | Save Failure | Could Not Save |
| [frontend/src/features/employees/components/PDSDetailFields.jsx](../frontend/src/features/employees/components/PDSDetailFields.jsx#L82) | 82 | Occupation / B-day | Occupation / Date of Birth |
| [frontend/src/features/employees/components/PDSDetailFields.jsx](../frontend/src/features/employees/components/PDSDetailFields.jsx#L64) | 64 | Enter literal full name as written in PDS | Enter the full name shown on the PDS |
| [frontend/src/features/employees/components/EmploymentFields.jsx](../frontend/src/features/employees/components/EmploymentFields.jsx#L157) | 157 | Joined Date | Date Hired |
| [frontend/src/pages/apply/ApplicantInfoFields.jsx](../frontend/src/pages/apply/ApplicantInfoFields.jsx#L34) | 34 | placeholder="M.I." | placeholder="Enter full middle name" |
| [frontend/src/features/recruitment/components/ApplicantDetailModal.jsx](../frontend/src/features/recruitment/components/ApplicantDetailModal.jsx#L29) | 29 | Certification on the Authenticity (CAV) | Certification on the Authenticity and Veracity (CAV) |
| [frontend/src/features/profile/components/constants.js](../frontend/src/features/profile/components/constants.js#L21) | 21 | Certification on the Authenticity (CAV) | Certification on the Authenticity and Veracity (CAV) |
| [frontend/src/components/layout/SidebarContent.jsx](../frontend/src/components/layout/SidebarContent.jsx#L33) | 33 | Home Dashboard | Dashboard |
| [frontend/src/components/layout/SidebarContent.jsx](../frontend/src/components/layout/SidebarContent.jsx#L51) | 51 | Loan Processing Center | Loan Management |
| [frontend/src/components/layout/SidebarContent.jsx](../frontend/src/components/layout/SidebarContent.jsx#L40) | 40 | Applicant Board (MSP) | Recruitment |
| [frontend/src/components/layout/SidebarContent.jsx](../frontend/src/components/layout/SidebarContent.jsx#L57) | 57 | Daily Time Clock | Record Attendance |
| [frontend/src/features/leaves/components/LeaveBalanceCards.jsx](../frontend/src/features/leaves/components/LeaveBalanceCards.jsx#L65) | 65 | Cumulative Total | Total Leave Credits |
| [frontend/src/pages/admin/AttendanceManagement.jsx](../frontend/src/pages/admin/AttendanceManagement.jsx#L89) | 89 | Tardy / Late | Late Arrivals |
| [frontend/src/features/dashboard/SuperintendentDashboard.jsx](../frontend/src/features/dashboard/SuperintendentDashboard.jsx#L118) | 118 | Performance Rating Mix (IPCRF) | IPCRF Ratings by Category |
| [frontend/src/features/dashboard/SuperintendentDashboard.jsx](../frontend/src/features/dashboard/SuperintendentDashboard.jsx#L222) | 222 | Operational Continuity: | Attendance Summary: |
| [frontend/src/pages/apply/applyConstants.js](../frontend/src/pages/apply/applyConstants.js#L54) | 54 | Optional if applicable. | Optional. Upload if applicable. |
| [frontend/src/pages/apply/applyConstants.js](../frontend/src/pages/apply/applyConstants.js#L75) | 75 | Optional if applicable. | Optional. Upload if applicable. |
| [frontend/src/pages/apply/applyConstants.js](../frontend/src/pages/apply/applyConstants.js#L83) | 83 | Optional if applicable. | Optional. Upload if applicable. |
| [frontend/src/pages/apply/applyConstants.js](../frontend/src/pages/apply/applyConstants.js#L91) | 91 | Optional if applicable. | Optional. Upload if applicable. |
| [frontend/src/pages/apply/applyConstants.js](../frontend/src/pages/apply/applyConstants.js#L122) | 122 | Duly signed Checklist of Requirements. | Signed Checklist of Requirements. |
| [frontend/src/features/profile/components/constants.js](../frontend/src/features/profile/components/constants.js#L19) | 19 | Duly signed Checklist of Requirements. | Signed Checklist of Requirements. |
| [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L24) | 24 | Disbursement & ATM Credit | Record Payroll Release |
| [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L28) | 28 | Credits net salaries to employee ATM accounts, locks ledger, and releases digital payslips. | Records payroll release, locks payroll records, and makes digital payslips available. |
| [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L20) | 20 | Audits General Payroll summary, signs Form 7, and authorizes the Disbursement Voucher (DV). | Reviews and approves the payroll summary. |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L88) | 88 | Certify & Sign General Payroll (Form 7) | Approve General Payroll (Form 7) |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L53) | 53 | Executive sign-off complete. Export Disbursement Voucher and credit funds to LandBank ATM accounts. | Payroll approved. Export the Disbursement Voucher and record the payroll release. |
| [frontend/src/features/payroll/components/PayrollActionPanel.jsx](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L46) | 46 | Ready for ATM Release | Ready for Payroll Release |
| [frontend/src/pages/admin/Payroll.jsx](../frontend/src/pages/admin/Payroll.jsx#L81) | 81 | Certify and approve the General Payroll Sheet (Form 7) for | Approve the General Payroll Sheet (Form 7) for |
| [frontend/src/pages/admin/Payroll.jsx](../frontend/src/pages/admin/Payroll.jsx#L87) | 87 | Disburse and credit all net salaries to LandBank ATM accounts for | Record payroll release for |
| [frontend/src/pages/admin/Payroll.jsx](../frontend/src/pages/admin/Payroll.jsx#L87) | 87 | This will record statutory loan payments and lock the cycle. | This will record loan payments and lock the pay period. |
| [frontend/src/components/common/PDSUploadModal.jsx](../frontend/src/components/common/PDSUploadModal.jsx#L133) | 133 | Our AI will automatically map fields for you. | Review the extracted details before saving. |
| [frontend/src/features/profile/components/ProfileSidebar.jsx](../frontend/src/features/profile/components/ProfileSidebar.jsx#L20) | 20 | Digital Signature | E-Signature |
| [frontend/src/features/profile/components/ProfileSidebar.jsx](../frontend/src/features/profile/components/ProfileSidebar.jsx#L28) | 28 | Digital Signature | E-Signature |
| [frontend/src/features/profile/components/ProfileSidebar.jsx](../frontend/src/features/profile/components/ProfileSidebar.jsx#L32) | 32 | No digital signature uploaded | No signature image uploaded |
| [frontend/src/features/employees/components/PersonalFields.jsx](../frontend/src/features/employees/components/PersonalFields.jsx#L154) | 154 | Digital Signature | E-Signature |

Additional change: replaced the audit page compliance subtitle with "Recorded account and employee record activity".

## Context-specific decisions

- Kept Endorsing... for supervisor leave recommendations. Changed it to Approving... only for loan approval.
- Changed the applicant stage to Comparative Assessment and its score panel to Applicant Assessment Scores.
- Changed the middle-name placeholder, preserving the Middle Name field label.
- Used Authorized Payroll Staff rather than inventing one responsible role.
- Used Approved Loan for the loan status badge; it is not a repayment-schedule control.
- Changed only the mock ID preview badge to Sample ID preview. Actual per-document verification statuses remain intact.
- Matched the existing application form's CAV title in the profile and recruitment document lists.

## Preserved behavior and remaining limits

No routes, request values, permission lists, handlers, calculations, validation rules, stored fields, or backend files were changed by this terminology update. The original audit remains a historical snapshot.

The dashboard's missing-data fallback of 100% remains unchanged because fixing it requires a behavior change. The misleading compliance heading was simplified, but the percentage still needs a separate fix. Local ID simulation remains unchanged and its mock preview is now labeled as a sample. The assigned-location label no longer publishes the conflicting 100m radius; other configured-radius behavior remains unchanged.

Legal notices, policy citations, names of officials, form revision years, and document requirements were preserved pending authoritative confirmation. No new policy claims were introduced. API-provided messages and stored user content may contain wording outside these source changes.

## Verification

PASS: npm.cmd run build completed. Existing missing map-image and large-bundle warnings remain.

PASS: Parsed all 116 JavaScript/JSX source files before and after the update with the installed Babel parser. Program structure is identical after allowing string literals, template text, JSX text, and comments to differ. No expressions or control flow changed.

PASS: Reviewed context-specific exceptions for supervisor endorsement, applicant assessment, the middle-name placeholder, and the mock ID badge.

Not run: browser interaction checks. Source structure and the production build were verified; no browser-layout claim is made.
