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

/**
 * App Component
 * 
 * Handles the main routing configuration for the HRIS.
 * Mobile-first architecture using MainLayout shell for protected routes.
 */
function App() {
  const { user } = useAuth();

  const isManagement = user && ['HR', 'ACCOUNTANT', 'SUPERINTENDENT'].includes(user.role);
  const canAccessEmployees = user && ['HR', 'SUPERINTENDENT', 'ACCOUNTANT'].includes(user.role);
  const canManageLoans = user && ['ACCOUNTANT', 'SUPERINTENDENT', 'HR'].includes(user.role);
  const canManageLeaves = user && ['HR', 'SUPERINTENDENT'].includes(user.role);
  const canManageAttendance = user && ['HR', 'SUPERINTENDENT'].includes(user.role);
  const canManagePerformance = user && ['HR', 'SUPERINTENDENT'].includes(user.role);
  const canManageRecruitment = user && ['HR', 'SUPERINTENDENT'].includes(user.role);
  const canManagePayroll = user && ['ACCOUNTANT', 'SUPERINTENDENT', 'HR'].includes(user.role);
  const canViewAuditLogs = user && ['HR', 'SUPERINTENDENT'].includes(user.role);

  return (
    <div className="min-h-screen bg-base-200">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/apply" element={<Apply />} />

        {/* Protected Layout Shell */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Child Routes injected into MainLayout's <Outlet /> */}
          <Route index element={isManagement ? <AdminDashboard /> : <EmployeeDashboard />} />
          
          {/* Employees - Management (HR, Superintendent, Accountant) */}
          <Route 
            path="employees" 
            element={canAccessEmployees ? <Employees /> : <Navigate to="/" replace />} 
          />
          
          {/* Loans - Dedicated Pages */}
          <Route path="my-loans" element={<MyLoans />} />
          <Route 
            path="loan-management" 
            element={canManageLoans ? <LoanManagement /> : <Navigate to="/" replace />} 
          />

          {/* Leaves - Dedicated Pages */}
          <Route path="my-leaves" element={<MyLeaves />} />
          <Route 
            path="leave-management" 
            element={canManageLeaves ? <LeaveManagement /> : <Navigate to="/" replace />} 
          />
          
          {/* Attendance - Dedicated Pages */}
          <Route path="attendance" element={<Attendance />} />
          <Route 
            path="attendance-management" 
            element={canManageAttendance ? <AttendanceManagement /> : <Navigate to="/" replace />} 
          />
          
          <Route path="dtr" element={<DTR />} />
          <Route path="profile" element={<Profile />} />
          <Route path="employees/:id" element={<Profile />} />

          {/* Payroll - Dedicated Pages */}
          <Route path="my-payslips" element={<MyPayroll />} />
          <Route 
            path="payroll-management" 
            element={canManagePayroll ? <Payroll /> : <Navigate to="/" replace />} 
          />

          {/* IPCRF (Performance) - Dedicated Pages */}
          <Route path="my-performance" element={<MyIPCRF />} />
          <Route 
            path="performance-management" 
            element={canManagePerformance ? <IPCRFManagement /> : <Navigate to="/" replace />} 
          />

          {/* Recruitment - HR or Superintendent */}
          <Route
            path="recruitment"
            element={canManageRecruitment ? <Recruitment /> : <Navigate to="/" replace />}
          />

          {/* Audit Logs - HR or Superintendent */}
          <Route
            path="audit-logs"
            element={canViewAuditLogs ? <AuditLogs /> : <Navigate to="/" replace />}
          />
        </Route>

        {/* Catch-all - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
