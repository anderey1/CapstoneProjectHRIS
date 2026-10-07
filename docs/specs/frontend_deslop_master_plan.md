# DepEd Division HRIS - Frontend De-Sloping & Institutional Redesign Specification

**Specification Document:** `docs/specs/frontend_deslop_master_plan.md`  
**System:** DepEd Lucena City Division HRIS  
**Standard:** DepEd Design System (`DESIGN.md` — ENERGY 1 / RHYTHM 1 / MOTION 1)  
**Date:** October 7, 2026  
**Status:** Ready for Review & Phased Execution  

---

## 1. Executive Summary & Design System Standards

This specification establishes an institutional, government-grade redesign for every page in the `frontend/` directory. It systematically eliminates generic "AI slop" UI patterns (oversized gradient cards, gratuitous floating animations, pastel pill overload, low-contrast microcopy, uppercase-letterspaced noise, uninformative metric boxes) in favor of utilitarian, high-density, authoritative public-service interfaces compliant with **DepEd Orders**, **Civil Service Commission (CSC)** regulations, and **WCAG AA** accessibility standards.

### Universal Design Rules (`DESIGN.md` & `antislop`)
1. **Typography & Tabular Numerals**: High-contrast slate typography (`text-slate-900` body, `text-slate-600` labels, `border-slate-300`). All currency, dates, serial numbers, counts, and percentages must use `font-mono tabular-nums`.
2. **Palette Discipline**: 
   - Primary: DepEd Blue (`#0038A8` / `bg-[#0038A8]`) reserved for primary action triggers and authoritative header accents.
   - Neutral: Crisp Slate (`bg-slate-50` app background, `bg-white` surface cards/tables, `border-slate-200` to `border-slate-300`).
   - Accent: DepEd Gold (`#FCD116`) strictly for pending state indicators and official action focus.
   - Semantic: Evergreen (`#15803D`), Crimson (`#B91C1C`), Amber (`#B45309`).
3. **Density & Layout**: Dense tabular ledgers replace floating card grids for administrative collections. Two-column structured forms replace floating modals where comprehensive reviews occur.
4. **Institutional Authenticity**: Standard DepEd & CSC terminology only (e.g. *CSC Form 6*, *CSC Form 48*, *DepEd Order No. 37, s. 2018*, *DepEd Order No. 007, s. 2023*, *Plantilla*, *201-File Records*). No marketing microcopy or faux statistics.
5. **Quality Gates**: Every page refactor must strictly pass `npm.cmd run lint` (0 errors) and `npm.cmd run build` (0 bundle/compilation errors).

---

## 2. Page Inventory & Separation of Concerns

The pages are segmented into six (6) distinct institutional operational domains:

```mermaid
flowchart TD
    subgraph Phase 1: Authentication & Public Onboarding
        P1A["Login.jsx"]
        P1B["RegisterExisting.jsx"]
        P1C["Apply.jsx & apply/"]
    end

    subgraph Phase 2: Administrative Personnel Operations
        P2A["Employees.jsx & features/employees"]
        P2B["Recruitment.jsx & AddApplicantModal"]
        P2C["Profile.jsx & features/profile"]
    end

    subgraph Phase 3: Time, Attendance & DTR Compliance
        P3A["AttendanceManagement.jsx"]
        P3B["StaffDTRManagement.jsx"]
        P3C["Attendance.jsx (Personal Clock)"]
        P3D["DTR.jsx (Personal Form 48)"]
    end

    subgraph Phase 4: Leave & Benefits Administration
        P4A["LeaveManagement.jsx (Admin CSC Form 6)"]
        P4B["MyLeaves.jsx (Personal CSC Form 6)"]
    end

    subgraph Phase 5: Performance Evaluation & System Audit
        P5A["IPCRFManagement.jsx (Admin)"]
        P5B["MyIPCRF.jsx (Employee)"]
        P5C["AuditLogs.jsx (Division Management)"]
    end

    subgraph Phase 6: Executive & Employee Portals
        P6A["AdminDashboard.jsx (HR Analytics)"]
        P6B["AccountantDashboardPage.jsx"]
        P6C["SuperintendentDashboardPage.jsx"]
        P6D["EmployeeDashboard.jsx (Self-Service)"]
        P6E["MyPayroll.jsx (Personal Payslips)"]
    end
```

---

## 3. Detailed Per-Page De-Sloping Specifications

### Phase 1: Authentication & Public Onboarding

#### 1.1 `Login.jsx` (`frontend/src/pages/Login.jsx`)
- **Current Slop**: Generic light blue backdrop (`bg-[#f0f4f8]`), pastel gradient inputs, floating decorative card shadow, micro labels with arbitrary letter-spacing (`tracking-[0.3em]`).
- **Institutional Target**:
  - DepEd Official Portal sign-in terminal: Crisp `bg-slate-100` page backdrop with DepEd Blue (`#0038A8`) institutional top banner.
  - Symmetrical official seals: Division seal and Republic of the Philippines seal properly proportioned and unblurred.
  - High-contrast inputs (`bg-white border-slate-300 text-slate-900 focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]`).
  - Strict advisory notice banner regarding Republic Act No. 10173 (Data Privacy Act of 2012) and official division system usage.

#### 1.2 `RegisterExisting.jsx` (`frontend/src/pages/RegisterExisting.jsx`)
- **Current Slop**: Excessive rounded cards, loose multi-card container, pastel borders.
- **Institutional Target**:
  - Structured 2-column DepEd Personnel Account Activation form (`bg-white border border-slate-300 rounded-lg shadow-sm`).
  - Section headers mirroring Division Form format: *Section I: Employee Verification & Workstation*, *Section II: Plantilla Position Details*, *Section III: Portal Security Credentials*.
  - Monospaced helper text for Employee ID and Plantilla details.

#### 1.3 `Apply.jsx` & subcomponents (`frontend/src/pages/Apply.jsx`, `apply/*`)
- **Current Slop**: Generic card accordion with loose spacing, floating dropzones, pill badges.
- **Institutional Target**:
  - Official Division Job Application & Checklist Portal conforming to DepEd Order No. 007, s. 2023.
  - Structured checklist table for the 15 mandatory 201-file documents with verified document type labels, file size limits, and instant verification indicators.
  - High-density tabular layout for applicant qualifications (Education, Experience, Training, PRC/Civil Service Eligibility).

---

### Phase 2: Administrative Personnel Operations

#### 2.1 `Employees.jsx` (`frontend/src/pages/admin/Employees.jsx`)
- **Current Slop**: Loose search bar row, inconsistent badge sizes, modal padding blowup.
- **Institutional Target**:
  - DepEd Division Master Personnel Ledger: Unified administrative table with column sorting (Employee ID, Full Name, Plantilla Position, Workstation/School, Salary Grade, Service Status).
  - High-contrast filter bar: Station/School dropdown, Teaching vs Non-Teaching selector, Active vs Pending status toggle.
  - Tabular numbers for Employee ID and Salary Grade.
  - Standardized export action for Plantilla Personnel Report (DBM Form B).

#### 2.2 `Recruitment.jsx` (`frontend/src/pages/admin/Recruitment.jsx`)
- **Current Slop**: Trello/Kanban pastel card board with candy colors (`bg-secondary/20`, `bg-primary/20`), loose padding, unstructured scoring fields.
- **Institutional Target**:
  - DepEd Order No. 007, s. 2023 Comparative Assessment Result (CAR) Ledger.
  - Compact administrative pipeline view: Replace wide pastel kanban cards with a high-density evaluation table with stage filtering (*Initial Evaluation, Comparative Assessment, Interview, Hired, Not Selected*).
  - Explicit rubric score breakdown table (Education /35, Training /10, Experience /15, Demo /20, Exam /10, Interview /10) with automatic total computation and tabular alignment.

#### 2.3 `Profile.jsx` (`frontend/src/pages/shared/Profile.jsx`)
- **Current Slop**: 9 disparate tabs with inconsistent layouts, floating modal dialogues, loose 201 checklist cards.
- **Institutional Target**:
  - CSC Form 212 (Personal Data Sheet - Revised 2017) Unified Electronic 201-File Viewer.
  - Standardized 4-tab institutional layout:
    1. *CSC Form 212 PDS Records* (Personal Info, Family Background, Educational Background, Civil Service Eligibility, Work Experience).
    2. *201-File Document Compliance Checklist* (High-density verification table with file preview, date verified, and HR sign-off).
    3. *Workstation & Station Assignment* (School ID, Mother School, DepEd Email, Geolocation station assignment).
    4. *Account Security & Credentials* (Password change, Portal session logs).

---

### Phase 3: Time, Attendance & DTR Compliance

#### 3.1 `AttendanceManagement.jsx` (`frontend/src/pages/admin/AttendanceManagement.jsx`)
- **Current Slop**: Floating stats pills, generic table view, soft borders.
- **Institutional Target**:
  - Division Attendance Monitoring Console: Real-time division biometric and geolocation log stream.
  - 4-metric status strip: Total Check-Ins, Present Today, Geo-Flagged / Irregular, Overtime Logs.
  - High-density monitoring table with exact timestamps in tabular monospace (`HH:MM:SS AM/PM`), Workstation School ID, and clear verification status.

#### 3.2 `StaffDTRManagement.jsx` (`frontend/src/pages/admin/StaffDTRManagement.jsx`)
- **Current Slop**: Loose picker layout, floating dropdowns, empty space.
- **Institutional Target**:
  - CSC Form 48 Master Certification Console: Compact employee selector + cutoff selector (1st-15th, 16th-End, Full Month).
  - Instant Form 48 preview ledger with exact Morning / Afternoon In/Out columns, Under-time / Tardy computations in minutes, and official certifying official signature block.

#### 3.3 `Attendance.jsx` (`frontend/src/pages/shared/Attendance.jsx`)
- **Current Slop**: Big mobile-app style buttons, loose clock container, decorative badges.
- **Institutional Target**:
  - Utilitarian Employee Time-Clock Station: Clear digital clock readout (`tabular-nums font-mono text-3xl font-bold text-slate-900`), station verification badge, explicit Clock In / Clock Out dual action buttons with loading states and unambiguous confirmation toast.
  - Compact 7-day recent log ledger directly underneath the clock.

#### 3.4 `DTR.jsx` (`frontend/src/pages/shared/DTR.jsx`)
- **Current Slop**: Large card containers, loose tables, inconsistent button colors.
- **Institutional Target**:
  - Personal Civil Service Form No. 48 Electronic View: Exact tabular representation matching the printed CSC Form 48 format (Date, A.M. Arrival/Departure, P.M. Arrival/Departure, Undertime Hours/Minutes).
  - Download official PDF action button with cutoff selection.

---

### Phase 4: Leave & Benefits Administration

#### 4.1 `LeaveManagement.jsx` (`frontend/src/pages/admin/LeaveManagement.jsx`)
- **Current Slop**: 3-column floating card grid with large rounded corners (`rounded-xl`), arbitrary badges, oversized action buttons.
- **Institutional Target**:
  - CSC Form No. 6 Division Leave Processing Docket: Dense administrative table with applicant name, department/school, leave classification (Vacation, Mandatory, Sick, Maternity, Study, etc.), applied inclusive dates, working days count, and approval pipeline status.
  - Official CSC Form 6 Review Modal: Detailed institutional two-column breakdown showing 7.A Office Recommendation, 7.B Available Balance Verification (VL/SL credits), and 7.C Division Superintendent Final Action.

#### 4.2 `MyLeaves.jsx` (`frontend/src/pages/employee/MyLeaves.jsx`)
- **Current Slop**: Floating balance cards, loose application modal.
- **Institutional Target**:
  - Personal CSC Form No. 6 Leave Portal:
    - Compact Credit Balance Strip: Vacation Leave (VL) and Sick Leave (SL) available, used, and pending in monospaced tabular numerals.
    - Personal Application History Table with tracking number and approval stage.
    - Standard CSC Form 6 Application Drawer/Modal with exact leave type selector, inclusive dates picker, and automatic working day calculation excluding weekends and division holidays.

---

### Phase 5: Performance Evaluation & System Audit

#### 5.1 `IPCRFManagement.jsx` (`frontend/src/pages/admin/IPCRFManagement.jsx`)
- **Current Slop**: Generic list, candy badges, simple table.
- **Institutional Target**:
  - DepEd Results-Based Performance Management System (RPMS) IPCRF Division Master Ledger.
  - Structured evaluation table: Employee, Plantilla Position, Rating Period (e.g. SY 2025-2026), Numerical Score, Adjectival Rating (*Outstanding, Very Satisfactory, Satisfactory, Unsatisfactory, Poor*), Promotion Eligibility flag, and official signed IPCRF PDF download.
  - Performance rating modal conforming to CSC/DepEd RPMS scoring standards.

#### 5.2 `MyIPCRF.jsx` (`frontend/src/pages/employee/MyIPCRF.jsx`)
- **Current Slop**: 3-column floating cards with 3 mini-boxes for Punctual/Quality/Behavior, loose spacing.
- **Institutional Target**:
  - Personal RPMS / IPCRF Rating Portfolio: High-density chronological table of performance rating periods, final numerical ratings, adjectival ratings, and uploaded signed evaluation forms.

#### 5.3 `AuditLogs.jsx` (`frontend/src/pages/admin/AuditLogs.jsx`)
- **Current Slop**: Loose table rows, oversized avatars, arbitrary line clamp.
- **Institutional Target**:
  - Division Management Security Audit & Activity Trail: High-density security event ledger.
  - Timestamp in `font-mono tabular-nums`, Operator name & Role badge, Target module/Entity ID, Action description, and IP/System reference in structured tabular columns with quick search and date range filters.

---

### Phase 6: Executive & Employee Portals

#### 6.1 `AdminDashboard.jsx` (`frontend/src/pages/admin/AdminDashboard.jsx`)
- **Current Slop**: Large colorful recharts pie/bar charts with disparate colors, floating widget cards.
- **Institutional Target**:
  - Division Administrative Summary & Operations Center:
    - 4-metric executive summary strip (Active Personnel, Pending CSC Form 6 Leaves, Provident Fund Loans for Review, DTR Submissions).
    - Compact division distribution charts using strictly DepEd Blue (`#0038A8`), Slate (`#475569`), and Gold (`#FCD116`) palette with clear data keys and zero decorative glow.
    - Quick Action Administrative Queue table for high-priority pending items.

#### 6.2 `AccountantDashboardPage.jsx` & `SuperintendentDashboardPage.jsx`
- **Current Slop**: Basic wrappers with floating badges.
- **Institutional Target**:
  - Polish institutional headers, high-density financial queue summaries, and superintendent endorsement queue tables.

#### 6.3 `EmployeeDashboard.jsx` (`frontend/src/pages/employee/EmployeeDashboard.jsx`)
- **Current Slop**: Huge "MABUHAY" banner (`text-6xl`), floating cards, oversized buttons.
- **Institutional Target**:
  - Clean Personal DepEd Self-Service Portal:
    - Calm institutional header with employee name, plantilla position, school station, and active status indicator.
    - 4-metric personal status strip: Leave Credits (VL/SL), Recent DTR Status, Active Loan Balance, Next Payday.
    - Two-column operational grid: Left = Recent Attendance & DTR Activity; Right = Action items & Payslip quick access.

#### 6.4 `MyPayroll.jsx` (`frontend/src/pages/employee/MyPayroll.jsx`)
- **Current Slop**: Loose 12-column grid, oversized icons.
- **Institutional Target**:
  - Personal Salary & Compensation Archive: High-density payslip history table with Pay Period, Gross Compensation, Statutory Deductions (GSIS, PhilHealth, Pag-IBIG), Withholding Tax, Net Take-Home Pay, and instant Form 7 Payslip PDF download.

---

## 4. Phased Implementation Roadmap

| Phase | Pages / Files Involved | Scope & Deliverables | Verification Gates |
|---|---|---|---|
| **Phase 1** | `Login.jsx`, `RegisterExisting.jsx`, `Apply.jsx`, `apply/*` | Public onboarding, auth terminal, official DepEd application checklist | `npm run lint` (0 err), `npm run build` |
| **Phase 2** | `Employees.jsx`, `Recruitment.jsx`, `Profile.jsx` | Division personnel ledger, DepEd Order 007 recruitment table, CSC 212 201-file viewer | `npm run lint` (0 err), `npm run build`, employee tests |
| **Phase 3** | `AttendanceManagement.jsx`, `StaffDTRManagement.jsx`, `Attendance.jsx`, `DTR.jsx` | CSC Form 48 monitoring & personal DTR clock/export console | `npm run lint` (0 err), `npm run build`, attendance tests |
| **Phase 4** | `LeaveManagement.jsx`, `MyLeaves.jsx` | CSC Form 6 docket, approval pipeline modal, employee leave balance strip | `npm run lint` (0 err), `npm run build`, leave tests |
| **Phase 5** | `IPCRFManagement.jsx`, `MyIPCRF.jsx`, `AuditLogs.jsx` | RPMS performance ledger, personal IPCRF portfolio, management audit trail | `npm run lint` (0 err), `npm run build`, audit tests |
| **Phase 6** | `AdminDashboard.jsx`, `EmployeeDashboard.jsx`, `MyPayroll.jsx`, Executive Dashboards | Calm institutional dashboards, executive queues, personal compensation archive | `npm run lint` (0 err), `npm run build` |

---

## 5. Verification & Acceptance Criteria

1. **Visual & Design System Compliance**:
   - Every modified page adheres to `ENERGY 1 / RHYTHM 1 / MOTION 1`.
   - Zero gratuitous bounce/hover animations, zero arbitrary gradient cards, zero low-contrast micro-labels.
   - All currencies, dates, and IDs rendered in tabular monospace font (`font-mono tabular-nums`).
2. **Quality Gates**:
   - `npm.cmd run lint` must exit with code 0 (0 errors).
   - `npm.cmd run build` must succeed with zero Vite/CSS bundling errors.
   - Targeted backend pytest commands must remain 100% passing.
3. **Institutional Authenticity**:
   - Standard DepEd and CSC form numbers and terminology used exclusively throughout all tables and modals.
