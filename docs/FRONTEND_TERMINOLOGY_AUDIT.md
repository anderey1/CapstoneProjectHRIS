# Frontend terminology audit

Date: 2026-10-29. Method: static review using antislop-copywriting and the core antislop rules. Application code was not edited for this audit.

Scope: navigation, public registration/application screens, management and employee pages, shared profile/attendance pages, feature components, validation and notification strings, and shared display constants under frontend/src. Comments, identifiers, routes, permission values, API fields, and official form wording are not automatic rewrite targets. Backend responses and database content can supply additional text not covered by a frontend source audit. No browser or policy-compliance audit was performed.

High findings concern claims or labels that may misrepresent the record, authority, or completed action. Medium findings affect meaning, consistency, or comprehension. Low findings are wording polish. Suggestions are editorial proposals; conditional suggestions require checking the owning workflow before applying. Regulatory statements are flagged for verification, not declared legally incorrect.

## Findings

Identified 80 source-backed findings below. Repeated patterns are grouped; the source column lists up to four locations per finding.

### High priority

| Current text | Suggested text | Reason | Source |
|---|---|---|---|
| My Payslips & W-2 | My Payslips | Promises an additional tax document that the payslip label should not imply. | [frontend/src/components/layout/SidebarContent.jsx:60](../frontend/src/components/layout/SidebarContent.jsx#L60) |
| Immutable Audit Trail | Activity history | Immutability is a technical guarantee, not established by displaying audit rows. | [frontend/src/pages/admin/AuditLogs.jsx:157](../frontend/src/pages/admin/AuditLogs.jsx#L157) |
| PORTAL SECURE | Staff Portal | A decorative security claim gives no useful account information. | [frontend/src/pages/Login.jsx:54](../frontend/src/pages/Login.jsx#L54) |
| Values reflect audited net disbursements | Values show recorded net payroll amounts | Calculated records do not establish an independent audit. | [frontend/src/features/dashboard/AccountantDashboard.jsx:170](../frontend/src/features/dashboard/AccountantDashboard.jsx#L170) |
| Disburse & Credit Salaries to LandBank ATM | Record Payroll Release | The release endpoint updates payroll records; do not imply a bank transfer. | [frontend/src/features/payroll/components/PayrollActionPanel.jsx:104](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L104) |
| Salaries have been credited. | Payroll release recorded. | A recorded release does not confirm bank settlement. | [frontend/src/features/payroll/components/PayrollActionPanel.jsx:54](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L54) |
| LandBank of the Philippines | Payroll Officer | The workflow actor must describe the person recording release; confirm the responsible role before replacement. | [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx:25](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L25) |
| Disbursed to official LandBank payroll account | Payroll release recorded | A fixed footer must not assert bank settlement for every payslip. | [frontend/src/pages/employee/MyPayroll.jsx:374](../frontend/src/pages/employee/MyPayroll.jsx#L374) |
| Civil Service Commission & Commission on Audit (COA) compliance chain | Payroll preparation, approval, and release | A workflow display does not prove regulatory compliance. | [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx:40](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L40) |
| Official Commission on Audit Reports | Payroll Reports | Do not imply official report approval merely because files can be exported. | [frontend/src/features/payroll/components/PayrollActionPanel.jsx:122](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L122) |
| General Payroll approved and signed successfully! | Payroll approved. | Approval success does not independently establish a signature. | [frontend/src/features/payroll/hooks/usePayroll.js:91](../frontend/src/features/payroll/hooks/usePayroll.js#L91) |
| Biometric & Station Logging Active | Attendance Monitoring | The wording promises an active biometric integration; verify before claiming it. | [frontend/src/pages/admin/AttendanceManagement.jsx:71](../frontend/src/pages/admin/AttendanceManagement.jsx#L71) |
| Real-time aggregate count of biometric/QR scans logged today. | Attendance records for today. | Avoid claiming scan methods and real-time delivery without evidence. | [frontend/src/features/dashboard/SuperintendentDashboard.jsx:222](../frontend/src/features/dashboard/SuperintendentDashboard.jsx#L222) |
| PDS core fields verified | PDS fields completed | The displayed percentage measures completion, not verification. | [frontend/src/features/profile/components/ProfileHeader.jsx:127](../frontend/src/features/profile/components/ProfileHeader.jsx#L127) |
| Permanent / Appointed | Appointment date recorded | The condition checks date_hired, which does not establish permanent employment. | [frontend/src/features/profile/components/ProfileHeader.jsx:73](../frontend/src/features/profile/components/ProfileHeader.jsx#L73) |
| Civil Service Promotion Endorsement | Promotion Rating Indicator | The boolean should not imply a formal endorsement or appointment decision. | [frontend/src/features/performance/components/IPCRFDetailsModal.jsx:196](../frontend/src/features/performance/components/IPCRFDetailsModal.jsx#L196) |
| Endorsed for Promotion | Meets configured rating threshold | Confirm what the eligibility flag establishes before choosing the final label. | [frontend/src/features/performance/components/IPCRFDetailsModal.jsx:207](../frontend/src/features/performance/components/IPCRFDetailsModal.jsx#L207) |
| Minimum composite rating of 4.000 required for institutional promotion. | Configured rating threshold: 4.000. | Separate a configured threshold from a complete promotion policy. | [frontend/src/features/performance/components/IPCRFDetailsModal.jsx:211](../frontend/src/features/performance/components/IPCRFDetailsModal.jsx#L211) |
| Geofenced (100m) | Assigned work location | Conflicts with the dashboard text of 150m; confirm configured radius before publishing a number. | [frontend/src/features/profile/components/ProfileSidebar.jsx:95](../frontend/src/features/profile/components/ProfileSidebar.jsx#L95) |
| Geofence Compliance | Attendance Location Checks | The dashboard defaults to 100 when a value is absent; copy alone cannot repair that behavior. | [frontend/src/pages/admin/AdminDashboard.jsx:218](../frontend/src/pages/admin/AdminDashboard.jsx#L218); [frontend/src/pages/admin/AdminDashboard.jsx:222](../frontend/src/pages/admin/AdminDashboard.jsx#L222) |
| Verified | Sample ID preview | In DocumentPreviewModal, MOCK_CARD has an unconditional Verified badge; this recommendation applies only to that mock branch. | [frontend/src/features/profile/components/DocumentPreviewModal.jsx:52](../frontend/src/features/profile/components/DocumentPreviewModal.jsx#L52) |
| Verified IDs | Government IDs | The tab includes pending or locally simulated attachments, not only verified IDs. | [frontend/src/features/profile/components/constants.js:11](../frontend/src/features/profile/components/constants.js#L11) |
| Drop your CS Form 212 PDF here. | Select your CS Form 212 PDF. | The shown file input does not establish a working drop target. | [frontend/src/components/common/PDSUploadModal.jsx:133](../frontend/src/components/common/PDSUploadModal.jsx#L133) |

### Medium priority

| Current text | Suggested text | Reason | Source |
|---|---|---|---|
| Accounting Command Center | Payroll Actions | Inflated label for calculation, approval, release, and export controls. | [frontend/src/features/payroll/components/PayrollActionPanel.jsx:33](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L33) |
| Division Payroll Processing Pipeline | Payroll Processing Steps | Pipeline adds technical wording without meaning. | [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx:37](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L37) |
| Active In Progress | In Progress | Redundant status. | [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx:89](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L89) |
| Pending Previous Step | Waiting for Previous Step | Clarifies why the action is unavailable. | [frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx:89](../frontend/src/features/payroll/components/PayrollWorkflowStepper.jsx#L89) |
| Awaiting Draft Calculation | Not Yet Calculated | Names the current state directly. | [frontend/src/features/payroll/components/PayrollActionPanel.jsx:44](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L44) |
| Pending Superintendent Sign-off | Awaiting Superintendent Approval | Use the same approval term throughout. | [frontend/src/features/payroll/components/PayrollActionPanel.jsx:45](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L45) |
| Cutoff Completed & Disbursed | Payroll Release Recorded | Avoid redundant wording and unsupported settlement language. | [frontend/src/features/payroll/components/PayrollActionPanel.jsx:47](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L47) |
| Single Staff Recalculation: | Recalculate Employee Payroll | Names the object and action. | [frontend/src/features/payroll/components/PayrollActionPanel.jsx:154](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L154) |
| Re-run calculation for an individual personnel after DTR update | Recalculate an employee?s payroll after updating their DTR. | Fixes the ungrammatical individual personnel and simplifies the instruction. | [frontend/src/features/payroll/components/PayrollActionPanel.jsx:156](../frontend/src/features/payroll/components/PayrollActionPanel.jsx#L156) |
| Audit Actions (Step 1: Document Verification) | Step 1: Verify Documents | Document verification is not necessarily an audit. | [frontend/src/features/loans/components/LoanActionWorkflow.jsx:33](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L33) |
| Executive Approval (Step 2: Superintendent Certification) | Step 2: Superintendent Approval | Removes ceremonial duplication. | [frontend/src/features/loans/components/LoanActionWorkflow.jsx:107](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L107) |
| Disapprove / Return Application (Specify COA audit justification): | Reason for Disapproval | The action rejects the application; return is a different outcome. | [frontend/src/features/loans/components/LoanActionWorkflow.jsx:72](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L72) |
| Endorsing... | Approving... | The loan handler calls approval; endorsement and approval are different workflow actions. | [frontend/src/features/loans/components/LoanActionWorkflow.jsx:130](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L130); [frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx:336](../frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx#L336) |
| Release & Disburse Principal to Borrower | Record Loan Release | Use a label matching the internal record update. | [frontend/src/features/loans/components/LoanActionWorkflow.jsx:185](../frontend/src/features/loans/components/LoanActionWorkflow.jsx#L185) |
| Supporting Document Compliance | Supporting Documents | Compliance is broader than displaying document attachments. | [frontend/src/features/loans/components/LoanReviewModal.jsx:163](../frontend/src/features/loans/components/LoanReviewModal.jsx#L163) |
| Active Disbursed Principal | Principal of Active Loans | Explains the sum without suggesting it is the remaining balance. | [frontend/src/pages/employee/MyLoans.jsx:165](../frontend/src/pages/employee/MyLoans.jsx#L165); [frontend/src/pages/employee/MyLoans.jsx:168](../frontend/src/pages/employee/MyLoans.jsx#L168) |
| Active Amortization | Repayment Schedule | Plain wording; verify that this status opens a schedule before applying. | [frontend/src/features/loans/components/LoanCard.jsx:151](../frontend/src/features/loans/components/LoanCard.jsx#L151) |
| Instructional cadre | Teaching employees | Unnecessarily formal collective noun. | [frontend/src/pages/admin/Employees.jsx:173](../frontend/src/pages/admin/Employees.jsx#L173) |
| Total Plantilla Roster | Total Employees | Use plantilla only when the data is specifically restricted to plantilla positions. | [frontend/src/pages/admin/Employees.jsx:166](../frontend/src/pages/admin/Employees.jsx#L166) |
| Add Plantilla Employee | Add Employee | Avoid implying an appointment type the form does not establish. | [frontend/src/pages/admin/Employees.jsx:157](../frontend/src/pages/admin/Employees.jsx#L157) |
| Credentials Requested | Requested Account Role | The registration table shows the requested role, not identity documents or passwords. | [frontend/src/pages/admin/Employees.jsx:321](../frontend/src/pages/admin/Employees.jsx#L321) |
| Plantilla ID # | Employee Record ID # | An internal employee primary key is not a plantilla item number. | [frontend/src/pages/admin/StaffDTRManagement.jsx:224](../frontend/src/pages/admin/StaffDTRManagement.jsx#L224) |
| Tracked mutation actions | Recorded changes | Mutation is implementation language. | [frontend/src/pages/admin/AuditLogs.jsx:220](../frontend/src/pages/admin/AuditLogs.jsx#L220) |
| Target Module | Section | Use a familiar label for the affected feature. | [frontend/src/pages/admin/AuditLogs.jsx:283](../frontend/src/pages/admin/AuditLogs.jsx#L283); [frontend/src/pages/admin/AuditLogs.jsx:319](../frontend/src/pages/admin/AuditLogs.jsx#L319) |
| Search actor, action text, or reference ID... | Search by user, action, or reference ID... | Actor is unnecessary technical wording. | [frontend/src/pages/admin/AuditLogs.jsx:230](../frontend/src/pages/admin/AuditLogs.jsx#L230) |
| Application Specification | Application Details | Simpler and more accurate heading. | [frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx:253](../frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx#L253) |
| Search subordinate name... | Search employee name... | Avoid unnecessary hierarchy in a search instruction. | [frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx:121](../frontend/src/features/leaves/components/SupervisorApprovalQueue.jsx#L121) |
| Initial Pipeline Stage | Initial Application Status | Status is the visible concept. | [frontend/src/features/recruitment/components/AddApplicantModal.jsx:175](../frontend/src/features/recruitment/components/AddApplicantModal.jsx#L175) |
| Pipeline Status | Application Status | Use the same term in the form and table. | [frontend/src/features/recruitment/components/ApplicantDetailModal.jsx:222](../frontend/src/features/recruitment/components/ApplicantDetailModal.jsx#L222); [frontend/src/features/recruitment/components/RecruitmentTable.jsx:111](../frontend/src/features/recruitment/components/RecruitmentTable.jsx#L111) |
| Staff Evaluation | Comparative Assessment | In recruitment, this is an applicant assessment stage, not an existing staff review. | [frontend/src/features/recruitment/components/ApplicantScoringMatrix.jsx:31](../frontend/src/features/recruitment/components/ApplicantScoringMatrix.jsx#L31); [frontend/src/features/recruitment/components/RecruitmentTable.jsx:7](../frontend/src/features/recruitment/components/RecruitmentTable.jsx#L7) |
| Staff Evaluation Scores | Applicant Assessment Scores | Clarifies whose performance is being assessed. | [frontend/src/features/recruitment/components/ApplicantScoringMatrix.jsx:31](../frontend/src/features/recruitment/components/ApplicantScoringMatrix.jsx#L31) |
| Plantilla deployed | Appointments recorded | People and appointments are not deployed plantilla. | [frontend/src/features/recruitment/components/RecruitmentMetricsBar.jsx:54](../frontend/src/features/recruitment/components/RecruitmentMetricsBar.jsx#L54) |
| Initial QS Evaluation | Initial Qualifications Review | Expand QS for applicants. | [frontend/src/features/recruitment/components/AddApplicantModal.jsx:178](../frontend/src/features/recruitment/components/AddApplicantModal.jsx#L178) |
| Disqualified (QS Fail) | Does Not Meet Qualification Standards | Use direct and respectful wording; retain the underlying status value. | [frontend/src/features/recruitment/components/ApplicantDetailModal.jsx:244](../frontend/src/features/recruitment/components/ApplicantDetailModal.jsx#L244) |
| Intelligent PDS Reader | Import PDS Details | Intelligent is an empty promotional modifier. | [frontend/src/components/common/PDSUploadModal.jsx:131](../frontend/src/components/common/PDSUploadModal.jsx#L131) |
| Execute OCR Scan | Extract PDS Details | Describe the task, not an implementation mechanism. | [frontend/src/components/common/PDSUploadModal.jsx:156](../frontend/src/components/common/PDSUploadModal.jsx#L156) |
| Portal Security & Login Credentials | Account Details | Long noun cluster for username, email, and password fields. | [frontend/src/pages/RegisterExisting.jsx:376](../frontend/src/pages/RegisterExisting.jsx#L376) |
| Invalid credentials. Please verify your employee username and password. | Incorrect username or password. | Plain error wording without unnecessary ceremony. | [frontend/src/pages/Login.jsx:31](../frontend/src/pages/Login.jsx#L31) |
| Verifying Credentials... | Signing In... | Matches the task the user started. | [frontend/src/pages/Login.jsx:143](../frontend/src/pages/Login.jsx#L143) |
| No Eligibility Credentials Registered | No Eligibility Records Added | Matches the records displayed. | [frontend/src/features/profile/components/CivilServiceEligibilityTab.jsx:69](../frontend/src/features/profile/components/CivilServiceEligibilityTab.jsx#L69) |
| No Education Credentials Added | No Education Records Added | Use the same record vocabulary across profile tabs. | [frontend/src/features/profile/components/EducationalBackgroundTab.jsx:81](../frontend/src/features/profile/components/EducationalBackgroundTab.jsx#L81) |
| Save Failure | Could Not Save | Natural error heading. | [frontend/src/features/employees/components/PersonnelFormModal.jsx:332](../frontend/src/features/employees/components/PersonnelFormModal.jsx#L332) |
| Occupation / B-day | Occupation / Date of Birth | Avoid informal shorthand and identify each input clearly. | [frontend/src/features/employees/components/PDSDetailFields.jsx:82](../frontend/src/features/employees/components/PDSDetailFields.jsx#L82) |
| Enter literal full name as written in PDS | Enter the full name shown on the PDS | Literal adds no useful meaning. | [frontend/src/features/employees/components/PDSDetailFields.jsx:64](../frontend/src/features/employees/components/PDSDetailFields.jsx#L64) |
| Joined Date | Date Hired | Match the stored employment concept and use it consistently. | [frontend/src/features/employees/components/EmploymentFields.jsx:157](../frontend/src/features/employees/components/EmploymentFields.jsx#L157) |
| Middle Name | Enter full middle name | ApplicantInfoFields uses M.I. as a placeholder for a middle-name field; change the placeholder, not the field label. | [frontend/src/pages/apply/ApplicantInfoFields.jsx:26](../frontend/src/pages/apply/ApplicantInfoFields.jsx#L26) |
| Certification on the Authenticity (CAV) | Certification on the Authenticity and Veracity (CAV) | The application form and profile use different names. Confirm against the supplied form before standardizing. | [frontend/src/features/recruitment/components/ApplicantDetailModal.jsx:29](../frontend/src/features/recruitment/components/ApplicantDetailModal.jsx#L29); [frontend/src/features/profile/components/constants.js:21](../frontend/src/features/profile/components/constants.js#L21) |

### Low priority

| Current text | Suggested text | Reason | Source |
|---|---|---|---|
| Home Dashboard | Dashboard | Matches the mobile navigation label. | [frontend/src/components/layout/SidebarContent.jsx:33](../frontend/src/components/layout/SidebarContent.jsx#L33) |
| Loan Processing Center | Loan Management | Matches the page purpose without an inflated center label. | [frontend/src/components/layout/SidebarContent.jsx:51](../frontend/src/components/layout/SidebarContent.jsx#L51) |
| Applicant Board (MSP) | Recruitment | Keep Merit Selection Plan expansion in supporting copy if needed. | [frontend/src/components/layout/SidebarContent.jsx:40](../frontend/src/components/layout/SidebarContent.jsx#L40) |
| Daily Time Clock | Record Attendance | Names the action and matches the attendance page. | [frontend/src/components/layout/SidebarContent.jsx:57](../frontend/src/components/layout/SidebarContent.jsx#L57) |
| Cumulative Total | Total Leave Credits | Names what is counted. | [frontend/src/features/leaves/components/LeaveBalanceCards.jsx:65](../frontend/src/features/leaves/components/LeaveBalanceCards.jsx#L65) |
| Tardy / Late | Late Arrivals | Avoid duplicate synonyms. | [frontend/src/pages/admin/AttendanceManagement.jsx:89](../frontend/src/pages/admin/AttendanceManagement.jsx#L89) |
| Performance Rating Mix (IPCRF) | IPCRF Ratings by Category | States what the chart compares. | [frontend/src/features/dashboard/SuperintendentDashboard.jsx:118](../frontend/src/features/dashboard/SuperintendentDashboard.jsx#L118) |
| Operational Continuity: | Attendance Summary: | The heading should describe the data below it. | [frontend/src/features/dashboard/SuperintendentDashboard.jsx:222](../frontend/src/features/dashboard/SuperintendentDashboard.jsx#L222) |
| Optional if applicable. | Optional. Upload if applicable. | Distinguishes optionality from applicability. | [frontend/src/pages/apply/applyConstants.js:54](../frontend/src/pages/apply/applyConstants.js#L54); [frontend/src/pages/apply/applyConstants.js:75](../frontend/src/pages/apply/applyConstants.js#L75); [frontend/src/pages/apply/applyConstants.js:83](../frontend/src/pages/apply/applyConstants.js#L83); [frontend/src/pages/apply/applyConstants.js:91](../frontend/src/pages/apply/applyConstants.js#L91) |
| Duly signed Checklist of Requirements. | Signed Checklist of Requirements. | Remove filler while preserving the signature requirement. | [frontend/src/pages/apply/applyConstants.js:122](../frontend/src/pages/apply/applyConstants.js#L122); [frontend/src/features/profile/components/constants.js:19](../frontend/src/features/profile/components/constants.js#L19) |

## Consistency rules for a wording-only follow-up

- Use Employee for a person with an employee record, Applicant in recruitment, and User for account activity. Keep official role names unchanged.
- Use Application Status consistently outside exact form sections. Keep endorsement, verification, approval, rejection, and release distinct.
- Use Pay Period in general UI where cutoff is only a date range. Keep cutoff API fields and request values unchanged.
- Use Government IDs for the collection, Pending Verification or Verified for an individual reviewed record. Local simulation must be labeled as such.
- Use Signature Image or E-Signature for an uploaded image; Digital Signature can imply cryptographic signing.
- Use Department and Workplace according to the actual fields. Do not interchange school, station, department, and area without checking their meanings.
- Expand RPMS, IPCRF, QS, MSP, SDS, TRF, SG, and DTR at first meaningful use, while retaining recognizable abbreviations in compact tables.
- Prefer Saved, Updated, Submitted, and Deleted over repeated successfully and exclamation marks. Use action-specific error messages and retain backend detail.
- Use Not Provided for missing personal information, No File for missing attachments, and Not Evaluated for missing ratings. Do not invent a position, department, or appointment status as a fallback.

## Preserve official terminology

Retain Personal Data Sheet (PDS), CSC Form No. 6, CSC Form No. 48, IPCRF, RPMS, Adjectival Rating, Commutation, Inclusive Dates, Certification of Leave Credits, Subsidiary Ledger, Disbursement Voucher, and official leave types where they identify the form or accounting concept. Explain them in surrounding instructions when necessary. Do not globally replace ledger, plantilla, endorsement, certification, or amortization: each has valid specialist uses.

## Claims requiring an owner decision

- The login notice describes an official Philippine government information system and cites legal penalties. Obtain the division-approved notice rather than inventing legal wording.
- Named officials, PDS revision years, document notarization requirements, policy order citations, score percentages, and promotion thresholds need confirmation against the project's supplied forms or the responsible office. This audit does not verify current officeholders or policy validity.
- The payroll UI describes actual bank credits, signatures, audits, and COA compliance. The inspected release methods record status and deductions; no bank-transfer evidence was established in this review. Describe recording actions unless integrations and approvals are documented.
- Profile ID attachments use local simulation, and the mock ID preview always says Verified. A terminology pass must disclose the simulation instead of implying official verification.
- The dashboard's fallback of 100% for missing location-compliance data is a behavior issue. Keep it separate from a wording-only change; a wording change cannot make the percentage factual.
- The profile says 100m while the dashboard says 150m. Confirm the authoritative setting before selecting either number.

## Audit checks

PASS: Findings cite text present in the current frontend source. Suggested wording adds no new statistic, policy, or testimonial.
PASS: Official specialist terms are distinguished from unnecessary ceremonial wording.
PASS: This audit changes documentation only; no source behavior, permissions, routes, data contracts, or styles were changed.
NOT RUN: Browser rendering, interactive accessibility checks, backend policy validation, and builds. They are not needed to produce this static terminology report, and no runtime verification is claimed.

The frontend copy still has unresolved findings. This report is not a passing design or compliance certification.
