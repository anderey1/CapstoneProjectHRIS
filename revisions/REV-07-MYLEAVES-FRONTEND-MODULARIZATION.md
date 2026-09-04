# Revision Specification: REV-07
## Title: Frontend Modularization of `MyLeaves.jsx` (1,295 Lines)

### 1. Objective & Problem Statement
`frontend/src/pages/employee/MyLeaves.jsx` is currently an 82KB monolithic file with 1,295 lines of code. It bundles leave balance cards, CSC Form 6 modal submission, multi-tier approval actions, table history, file uploads, and rejection remarks in one place. This makes maintenance, testing, and debugging extremely difficult.

### 2. Proposed Directory & File Structure
```
frontend/src/pages/employee/
├── MyLeaves.jsx                     <-- Thin orchestrator component (~150 lines)
└── leaves/
    ├── LeaveBalanceCards.jsx        <-- Vacation, Sick, and Special Privilege balance chips
    ├── LeaveApplicationModal.jsx    <-- CSC Form 6 modal with dynamic requirement fields
    ├── LeaveHistoryTable.jsx        <-- Paginated data table of filed leaves
    └── SupervisorApprovalQueue.jsx  <-- Recommending approval tab for supervisors
```

### 3. Step-by-Step Implementation Instructions

#### Step 1: Create `LeaveBalanceCards.jsx`
* Extract lines 105–170 of `MyLeaves.jsx`.
* **Props:** `employee` (containing `vacation_leave_balance`, `sick_leave_balance`), `onApplyClick`.
* Renders the 3 metric cards and the "Apply for Leave" action trigger.

#### Step 2: Create `LeaveHistoryTable.jsx`
* Extract the "My Leave History" table rendering.
* **Props:** `leaves`, `isLoading`, `onCancelLeave`.
* Displays status badges (`pending_supervisor`, `pending_hr`, `pending_superintendent`, `approved`, `rejected`), dates, duration in working days, and commutation status.

#### Step 3: Create `LeaveApplicationModal.jsx`
* Extract the CSC Form 6 modal form dialog.
* **Props:** `isOpen`, `onClose`, `onSubmit`, `isSubmitting`.
* Encapsulates:
  * Leave type picker with dynamic requirements banner
  * Date range picker + automatic working days calculation
  * Commutation selection
  * Specific details sections (location for vacation, illness details for sick leave)
  * File uploads (Medical Cert, Clearance, Travel Authority, etc.)

#### Step 4: Create `SupervisorApprovalQueue.jsx`
* Extract the subordinate review tab for Principals / Head Teachers.
* **Props:** `subordinateLeaves`, `onRecommendApproval`, `onDisapprove`.
* Renders pending leaves of subordinates assigned to this supervisor.

#### Step 5: Refactor `MyLeaves.jsx`
* Import the 4 subcomponents.
* Maintain React Query fetching (`queryKey: [QUERY_KEYS.LEAVES]`) and mutation handlers in the top-level orchestrator.
* Pass data and callbacks cleanly as props.

### 4. Verification & Acceptance Criteria
1. `MyLeaves.jsx` line count drops from 1,295 to under 200 lines.
2. Form submission, working day calculation, and file uploads continue to work seamlessly.
3. Supervisor approval queue correctly displays subordinate requests and handles approvals/rejections.
4. No React console warnings or prop-type mismatches.
