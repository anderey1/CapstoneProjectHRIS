# Revision Specification: REV-10
## Title: Anti-AI-Slop Frontend Design System Harmonization

### 1. Objective & Problem Statement
The current frontend (rontend/src) exhibits multiple canonical AI-generated UI tells flagged by ntislop and ntislop-ui:
1. **Template motion & perpetual loops**: Pervasive nimate-in slide-in-from-bottom-4 duration-500, nimate-pulse, and nimate-bounce-slow violating MOTION 1 (hover/focus states only).
2. **Decorative left borders**: Ubiquitous order-l-4 border-l-success, order-l-primary, etc. on dashboard stat cards and navigation active states.
3. **Typography & contrast defects**: Micro-text with extreme tracking (	ext-[10px] font-black uppercase tracking-widest opacity-40) and muted colors (	ext-slate-400, 	ext-amber-300/90) violating WCAG AA 4.5:1 contrast standards (R-25).
4. **Excessive radiuses & floating elevation**: Overuse of ounded-2xl, ounded-3xl, and shadow-2xl creating floaty, generic landing-page aesthetics rather than a dense, institutional administrative portal.

This specification maps the complete refactor plan into bounded, executable steps adhering to DESIGN.md (dial: **ENERGY 1 / RHYTHM 1 / MOTION 1**).

---

### 2. Design Token & Architecture Specifications

#### A. Color Tokens (DepEd Official Palette)
- **Primary / Dominant**: DepEd Blue #0038A8
- **Primary Surface**: #F8FAFC (Slate-50 page canvas)
- **Surface Elevation**: #FFFFFF (Card/Table background)
- **Border / Divider**: #E2E8F0 (Slate-200, crisp 1px borders)
- **Body Text**: #0F172A (Slate-900, 13.8:1 contrast on white)
- **Muted Text**: #475569 (Slate-600, 5.4:1 contrast on white - WCAG AA compliant)
- **Accent (Deliberate)**: DepEd Gold #FCD116 / Amber #D97706 for pending indicators and critical focal points only.
- **Semantic Feedback**:
  - Success: #15803D (Green-700)
  - Warning: #B45309 (Amber-700)
  - Error: #B91C1C (Red-700)

#### B. Elevation & Radius Scale
- Card & container radius capped at ounded-lg (8px) or ounded-md (6px). Remove all ounded-3xl and pill-shaped card containers.
- Elevation: Flat 1px borders (order border-slate-200) with subtle shadow-sm for active modals. Eliminate shadow-2xl and floating-page layers.

#### C. Motion Rules (MOTION 1)
- No continuous entrance animations (nimate-in slide-in-*).
- Instant or 150ms subtle transitions on interactive states (hover:bg-slate-100, ocus-visible:ring-2).
- Spinners allowed only on active async mutations (<Loader2 className="animate-spin" />).

---

### 3. Step-by-Step Implementation Instructions

#### Step 1: Base CSS & Design Tokens Harmonization (rontend/src/index.css)
- Remove hardcoded uncalibrated OKLCH variables.
- Standardize CSS custom properties to DepEd institutional palette.
- Set global typography baseline: ont-sans, tabular figures (ont-mono / 	abular-nums for numerical data), slate-900 default text color.
- Remove arbitrary bounce/float animation utility declarations.

#### Step 2: Main Layout & Navigation Refactor (rontend/src/components/)
- **SidebarContent.jsx**:
  - Replace order-l-4 border-amber-400 active indicator with high-contrast institutional pill or solid background highlight (g-white/10 text-white font-medium).
  - Verify every sidebar link maps to an existing, valid route; remove dead links (R-24).
  - Ensure minimum 44px touch target on all navigation rows.
- **Navbar.jsx & MobileBottomNav.jsx**:
  - Remove soft floating blur/glassmorphism; enforce crisp solid background with 1px border.
  - Replace generic AI badges with accessible text status indicators.

#### Step 3: Dashboard & KPI Card Overhaul (rontend/src/features/dashboard/)
- **SuperintendentDashboard.jsx & AccountantDashboard.jsx**:
  - Strip nimate-in slide-in-from-bottom-4 duration-500.
  - Strip order-l-4 left stripes from KPI cards.
  - Redesign KPI cards into structured, high-density data blocks with clear labels, tabular figures, and verified counts.
  - Standardize Recharts color palette to DepEd primary, slate neutrals, and semantic status colors.
  - Implement explicit 3-state handling: Loading skeleton/spinner, Empty state (\"No pending approvals requiring action\"), Error alert (R-27).

#### Step 4: Modals & Form Dialogs Standard (rontend/src/features/*/components/)
- Audit LeaveApplicationModal.jsx, ApplyLoanModal.jsx, PersonnelFormModal.jsx:
  - Reduce radius from ounded-2xl / ounded-3xl to standard ounded-lg.
  - Remove zoom-in-95 entrance motion; use instant accessible dialog open.
  - Enforce Escape key dismissal and focus trap (R-26).
  - Replace multi-colored emoji and decorative badges with crisp CSC Form 6 / DepEd document section headers.

#### Step 5: Data Tables & Operational Views
- Standardize all tables (Leaves, DTR, Loans, Payroll):
  - Sticky table headers with solid background and 1px border.
  - Tabular numerals for dates, leave credits, and monetary amounts.
  - Status badges: crisp solid backgrounds with accessible foreground text (minimum 4.5:1 contrast).

---

### 4. Verification & Acceptance Criteria
1. **WCAG AA Compliance**: All text and UI status indicators pass 4.5:1 contrast check.
2. **Zero Template Animations**: Grep for nimate-in, slide-in, and nimate-bounce returns 0 occurrences in page layouts.
3. **No Colored Left Stripes**: Grep for order-l-4 returns 0 decorative occurrences.
4. **Dead Links Check**: Every route in SidebarContent.jsx resolves to an active, working component without 404 or empty screens.
5. **Dials Conformance**: Entire UI matches ENERGY 1 / RHYTHM 1 / MOTION 1 (calm, predictable, accessible).
