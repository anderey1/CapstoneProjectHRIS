import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  CalendarCheck, 
  FileText, 
  UserCircle,
  LogOut,
  Settings,
  Menu,
  Clock,
  BarChart2,
  KanbanSquare,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Sidebar Component
 * 
 * Mobile-first responsive sidebar using DaisyUI Drawer.
 * It provides the main navigation links for the application.
 */
const SidebarContent = ({ closeDrawer }) => {
  const { user, logout } = useAuth();

  const isAdminOrHR = user && ['ADMIN', 'HR'].includes(user?.role);
  
  const navLinks = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/employees', icon: <Users className="w-5 h-5" />, label: 'Employees', roles: ['ADMIN', 'HR'] },
    { to: '/leave', icon: <Clock className="w-5 h-5" />, label: isAdminOrHR ? 'Leave Management' : 'My Leaves' },
    { to: '/loans', icon: <Wallet className="w-5 h-5" />, label: isAdminOrHR ? 'Provident Loans' : 'My Loans' },
    { to: '/attendance', icon: <CalendarCheck className="w-5 h-5" />, label: isAdminOrHR ? 'Attendance' : 'My Attendance' },
    { to: '/dtr', icon: <FileText className="w-5 h-5" />, label: 'Daily Time Record (DTR)' },
    { to: '/payroll', icon: <FileText className="w-5 h-5" />, label: isAdminOrHR ? 'Payroll' : 'My Payroll' },
    { to: '/performance', icon: <BarChart2 className="w-5 h-5" />, label: isAdminOrHR ? 'IPCRF Management' : 'My IPCRF' },
    {to: '/recruitment', icon: <KanbanSquare className="w-5 h-5" />, label: 'Recruitment', roles: ['ADMIN', 'HR'] },
    { to: '/audit-logs', icon: <ShieldAlert className="w-5 h-5" />, label: 'Audit Logs', roles: ['ADMIN', 'HR'] },
    { to: '/profile', icon: <UserCircle className="w-5 h-5" />, label: 'My Profile' },
  ];

  const filteredLinks = navLinks.filter(link => 
    !link.roles || (user && link.roles.includes(user.role))
  );

  return (
    <div className="flex flex-col h-full bg-base-100 text-base-content w-80 border-r border-base-300">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg text-primary-content">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tight">DepEd HRIS</h2>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Lucena City</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={closeDrawer}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-primary text-primary-content shadow-md shadow-primary/20' 
                : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'}
            `}
          >
            <span className="group-hover:scale-110 transition-transform duration-200">
              {link.icon}
            </span>
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer / User Profile */}
      <div className="p-4 border-t border-base-300 bg-base-200/30">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-base-100 border border-base-300 mb-4">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-10">
              <span className="text-xs">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.username || 'User'}</p>
            <p className="text-[10px] opacity-50 font-bold uppercase">{user?.role || 'Guest'}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            closeDrawer();
            logout();
          }}
          className="btn btn-ghost btn-block justify-start gap-4 text-error hover:bg-error/10 rounded-xl"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default SidebarContent;
