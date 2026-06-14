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
import LocationTracking from './pages/admin/LocationTracking';
import Attendance from './pages/shared/Attendance';
import DTR from './pages/shared/DTR';
import Profile from './pages/shared/Profile';
import AuditLogs from './pages/admin/AuditLogs';
import SchoolManagement from './pages/admin/SchoolManagement';

/**
 * App Component
 * 
 * Handles the main routing configuration for the HRIS.
 * Mobile-first architecture using MainLayout shell for protected routes.
 */
function App() {
  const { user } = useAuth();

  const isAdminOrHR = user && ['ADMIN', 'HR'].includes(user.role);
  const isManagement = user && ['ADMIN', 'HR', 'ACCOUNTANT', 'SUPERINTENDENT'].includes(user.role);

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
          <Route index element={isManagement ? <AdminDashboard /> : <EmployeeDashboard />} />
          
          {/* Employees - Management only */}
          <Route 
            path="employees" 
            element={isManagement ? <Employees /> : <Navigate to="/" replace />} 
          />
          
          {/* Loans - Role based switching */}
          <Route 
            path="loans" 
            element={isManagement ? <LoanManagement /> : <MyLoans />} 
          />

          {/* Leave Management - Role based switching */}
          <Route 
            path="leave" 
            element={isManagement ? <LeaveManagement /> : <MyLeaves />} 
          />
          
          {/* Attendance - Role based switching */}
          <Route
            path="attendance"
            element={isManagement ? <AttendanceManagement /> : <Attendance />}
          />
          
          <Route
            path="location-tracking"
            element={isAdminOrHR ? <LocationTracking /> : <Navigate to="/" replace />}
          />
          
          <Route path="dtr" element={<DTR />} />
          <Route path="profile" element={<Profile />} />
          <Route path="employees/:id" element={<Profile />} />

          {/* Payroll - Role based switching */}
          <Route
            path="payroll"
            element={isManagement ? <Payroll /> : <MyPayroll />}
          />

          {/* IPCRF (Performance) - Role based switching */}
          <Route
            path="performance"
            element={isManagement ? <IPCRFManagement /> : <MyIPCRF />}
          />

          {/* Recruitment - Admin/HR only */}
          <Route
            path="recruitment"
            element={isAdminOrHR ? <Recruitment /> : <Navigate to="/" replace />}
          />

          {/* Schools/Geofencing - Admin/Superintendent only */}
          <Route
            path="schools"
            element={['ADMIN', 'SUPERINTENDENT'].includes(user?.role) ? <SchoolManagement /> : <Navigate to="/" replace />}
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
