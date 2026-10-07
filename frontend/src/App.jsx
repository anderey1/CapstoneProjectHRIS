import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Apply from './pages/Apply';
import RegisterExisting from './pages/RegisterExisting';
import AdminDashboard from './pages/admin/AdminDashboard';
import AccountantDashboardPage from './pages/admin/AccountantDashboardPage';
import SuperintendentDashboardPage from './pages/admin/SuperintendentDashboardPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import Employees from './pages/admin/Employees';
import LoanManagement from './pages/admin/LoanManagement';
import MyLoans from './pages/employee/MyLoans';
import IPCRFManagement from './pages/admin/IPCRFManagement';
import MyIPCRF from './pages/employee/MyIPCRF';
import Recruitment from './pages/admin/Recruitment';
import LeaveManagement from './pages/admin/LeaveManagement';
import MyLeaves from './pages/employee/MyLeaves';
import Payroll from './pages/admin/Payroll';
import MyPayroll from './pages/employee/MyPayroll';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import StaffDTRManagement from './pages/admin/StaffDTRManagement';
import Attendance from './pages/shared/Attendance';
import DTR from './pages/shared/DTR';
import Profile from './pages/shared/Profile';
import AuditLogs from './pages/admin/AuditLogs';

import { ROLE_GROUPS } from './utils/rbac';

// Role Groups (canonical from rbac.js)
const MANAGEMENT_ROLES = ROLE_GROUPS.MANAGEMENT;
const HR_SUPERINTENDENT_ADMIN = ROLE_GROUPS.OPERATIONS;

/**
 * App Component
 * 
 * Handles the main routing configuration for the HRIS.
 * Clean, declarative role-gated route architecture using ProtectedRoute layout routes.
 */
function App() {
  const { user } = useAuth();
  const role = user?.role;
  const renderDashboard = () => {
    if (!user) return <EmployeeDashboard />;
    if (role === 'ACCOUNTANT') return <AccountantDashboardPage />;
    if (role === 'SUPERINTENDENT') return <SuperintendentDashboardPage />;
    if (MANAGEMENT_ROLES.includes(role)) return <AdminDashboard />;
    return <EmployeeDashboard />;
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/register-existing" element={<RegisterExisting />} />

        {/* Protected Layout Shell */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Dashboard Home - Dispatched cleanly per role */}
          <Route index element={renderDashboard()} />

          {/* Shared / Self-Service Routes */}
          <Route path="attendance" element={<Attendance />} />
          <Route path="dtr" element={<DTR />} />
          <Route path="profile" element={<Profile />} />
          <Route path="employees/:id" element={<Profile />} />
          <Route path="my-loans" element={<MyLoans />} />
          <Route path="my-leaves" element={<MyLeaves />} />
          <Route path="my-payslips" element={<MyPayroll />} />
          <Route path="my-performance" element={<MyIPCRF />} />

          {/* Management Tier (HR, Accountant, Superintendent, Admin) */}
          <Route element={<ProtectedRoute roles={MANAGEMENT_ROLES} />}>
            <Route path="employees" element={<Employees />} />
            <Route path="loan-management" element={<LoanManagement />} />
            <Route path="payroll-management" element={<Payroll />} />
          </Route>

          {/* HR, Superintendent & Admin Operations Tier */}
          <Route element={<ProtectedRoute roles={HR_SUPERINTENDENT_ADMIN} />}>
            <Route path="leave-management" element={<LeaveManagement />} />
            <Route path="attendance-management" element={<AttendanceManagement />} />
            <Route path="staff-dtr" element={<StaffDTRManagement />} />
            <Route path="performance-management" element={<IPCRFManagement />} />
            <Route path="recruitment" element={<Recruitment />} />
          </Route>

          {/* Management Audit Logs Tier */}
          <Route element={<ProtectedRoute roles={MANAGEMENT_ROLES} />}>
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Route>

        {/* Catch-all - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
