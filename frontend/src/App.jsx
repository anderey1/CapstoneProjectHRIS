import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Apply from './pages/Apply';
import AdminDashboard from './pages/admin/AdminDashboard';
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
import Attendance from './pages/shared/Attendance';
import DTR from './pages/shared/DTR';
import Profile from './pages/shared/Profile';
import AuditLogs from './pages/admin/AuditLogs';

// Role Groups
const MANAGEMENT_ROLES = ['HR', 'ACCOUNTANT', 'SUPERINTENDENT'];
const HR_SUPERINTENDENT = ['HR', 'SUPERINTENDENT'];

/**
 * App Component
 * 
 * Handles the main routing configuration for the HRIS.
 * Clean, declarative role-gated route architecture using ProtectedRoute layout routes.
 */
function App() {
  const { user } = useAuth();
  const isManagement = user && MANAGEMENT_ROLES.includes(user.role);

  return (
    <div className="min-h-screen bg-base-200">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/apply" element={<Apply />} />

        {/* Protected Layout Shell */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Dashboard Home */}
          <Route index element={isManagement ? <AdminDashboard /> : <EmployeeDashboard />} />

          {/* Shared / Self-Service Routes */}
          <Route path="attendance" element={<Attendance />} />
          <Route path="dtr" element={<DTR />} />
          <Route path="profile" element={<Profile />} />
          <Route path="employees/:id" element={<Profile />} />
          <Route path="my-loans" element={<MyLoans />} />
          <Route path="my-leaves" element={<MyLeaves />} />
          <Route path="my-payslips" element={<MyPayroll />} />
          <Route path="my-performance" element={<MyIPCRF />} />

          {/* Management Tier (HR, Accountant, Superintendent) */}
          <Route element={<ProtectedRoute roles={MANAGEMENT_ROLES} />}>
            <Route path="employees" element={<Employees />} />
            <Route path="loan-management" element={<LoanManagement />} />
            <Route path="payroll-management" element={<Payroll />} />
          </Route>

          {/* HR & Superintendent Tier */}
          <Route element={<ProtectedRoute roles={HR_SUPERINTENDENT} />}>
            <Route path="leave-management" element={<LeaveManagement />} />
            <Route path="attendance-management" element={<AttendanceManagement />} />
            <Route path="performance-management" element={<IPCRFManagement />} />
            <Route path="recruitment" element={<Recruitment />} />
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
