import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
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

  const isAdminOrHR = user && ['ADMIN', 'HR'].includes(user.role);

  return (
    <div className="min-h-screen bg-base-200">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

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
          <Route index element={isAdminOrHR ? <AdminDashboard /> : <EmployeeDashboard />} />
          
          {/* Employees - Admin/HR only */}
          <Route 
            path="employees" 
            element={isAdminOrHR ? <Employees /> : <Navigate to="/" replace />} 
          />
          
          {/* Loans - Role based switching */}
          <Route 
            path="loans" 
            element={isAdminOrHR ? <LoanManagement /> : <MyLoans />} 
          />

          {/* Leave Management - Role based switching */}
          <Route 
            path="leave" 
            element={isAdminOrHR ? <LeaveManagement /> : <MyLeaves />} 
          />
          
          {/* Attendance - Role based switching */}
          <Route
            path="attendance"
            element={isAdminOrHR ? <AttendanceManagement /> : <Attendance />}
          />
          
          <Route path="dtr" element={<DTR />} />
          <Route path="profile" element={<Profile />} />

          {/* Payroll - Role based switching */}
          <Route
            path="payroll"
            element={isAdminOrHR ? <Payroll /> : <MyPayroll />}
          />

          {/* IPCRF (Performance) - Role based switching */}
          <Route
            path="performance"
            element={isAdminOrHR ? <IPCRFManagement /> : <MyIPCRF />}
          />

          {/* Recruitment - Admin/HR only */}
          <Route
            path="recruitment"
            element={isAdminOrHR ? <Recruitment /> : <Navigate to="/" replace />}
          />

          {/* Audit Logs - Admin/HR only */}
          <Route
            path="audit-logs"
            element={isAdminOrHR ? <AuditLogs /> : <Navigate to="/" replace />}
          />
        </Route>

        {/* Catch-all - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
