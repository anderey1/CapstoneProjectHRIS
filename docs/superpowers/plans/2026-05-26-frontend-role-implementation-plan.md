# Frontend Role-Based Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement strict role-based navigation filtering and role-specific dashboard summaries.

**Architecture:** Update `AuthContext` to ensure role propagation, use conditional rendering in `SidebarContent.jsx`, and implement role-aware dashboard summaries.

**Tech Stack:** React, Tailwind CSS, DaisyUI.

---

### Task 1: Verify AuthContext Role

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Ensure user role is in context**

Verify `AuthContext.jsx` includes `role` in the user state. If not, add it.

```jsx
// frontend/src/context/AuthContext.jsx
// Ensure user object has role
const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
// ...
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git commit -m "feat(auth): ensure user role in AuthContext"
```

### Task 2: Implement Role-Based Navigation Filtering

**Files:**
- Modify: `frontend/src/components/SidebarContent.jsx`

- [ ] **Step 1: Update SidebarContent for role-based filtering**

```jsx
// frontend/src/components/SidebarContent.jsx
import { useAuth } from '../context/AuthContext';

// ...
const { user } = useAuth();
const role = user?.role;

// Inside return/render
{role === 'ACCOUNTANT' && (
    <>
        <MenuItem to="/payroll">Payroll</MenuItem>
        <MenuItem to="/loans">Loans</MenuItem>
    </>
)}
{role === 'SUPERVISOR' && (
    <>
        <MenuItem to="/loan-management">Loan Management</MenuItem>
        <MenuItem to="/attendance-management">Attendance Management</MenuItem>
    </>
)}
// ...
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/SidebarContent.jsx
git commit -m "feat(nav): implement strict role-based filtering"
```

### Task 3: Create Role-Specific Dashboard Summaries

**Files:**
- Create: `frontend/src/components/features/dashboard/AccountantDashboard.jsx`
- Create: `frontend/src/components/features/dashboard/SupervisorDashboard.jsx`
- Modify: `frontend/src/pages/admin/AdminDashboard.jsx` (or main Dashboard component)

- [ ] **Step 1: Create AccountantDashboard.jsx**

Implement cards for Payroll Summary and Loan Health.

- [ ] **Step 2: Create SupervisorDashboard.jsx**

Implement cards for Loan Approval and Attendance Alerts.

- [ ] **Step 3: Update main Dashboard to switch based on role**

```jsx
// frontend/src/pages/Dashboard.jsx
import { useAuth } from '../context/AuthContext';
import AccountantDashboard from '../components/features/dashboard/AccountantDashboard';
import SupervisorDashboard from '../components/features/dashboard/SupervisorDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    
    if (user.role === 'ACCOUNTANT') return <AccountantDashboard />;
    if (user.role === 'SUPERVISOR') return <SupervisorDashboard />;
    
    return <AdminDashboard />;
};
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/features/dashboard/ AccountantDashboard.jsx SupervisorDashboard.jsx frontend/src/pages/Dashboard.jsx
git commit -m "feat(dashboard): add role-specific dashboard summaries"
```
