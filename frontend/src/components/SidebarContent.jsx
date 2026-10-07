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
  Clock,
  BarChart2,
  KanbanSquare,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  School,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { ROLE_GROUPS } from '../utils/rbac';

const SidebarContent = ({ closeDrawer, isCollapsed, toggleCollapse }) => {
  const { user, logout } = useAuth();
  const { roleLabel } = useRBAC();
  const role = user?.role;

  const menuGroups = [
    {
      title: 'Navigation',
      links: [
        { to: '/', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Home Dashboard', roles: ROLE_GROUPS.ALL },
      ]
    },
    {
      title: 'Human Resources & Staffing',
      links: [
        { to: '/employees', icon: <Users className="w-4 h-4" />, label: 'Personnel Directory', roles: ['HR', 'SUPERINTENDENT', 'ACCOUNTANT', 'ADMINISTRATIVE'] },
        { to: '/recruitment', icon: <KanbanSquare className="w-4 h-4" />, label: 'Applicant Board (MSP)', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/attendance-management', icon: <CalendarCheck className="w-4 h-4" />, label: 'Attendance Monitor', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/staff-dtr', icon: <FileText className="w-4 h-4" />, label: 'Staff Form 48 (DTR)', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/leave-management', icon: <Clock className="w-4 h-4" />, label: 'Leave Approvals (Form 6)', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/performance-management', icon: <BarChart2 className="w-4 h-4" />, label: 'Performance Reviews', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
      ]
    },
    {
      title: 'Financial & Loan Services',
      links: [
        { to: '/payroll-management', icon: <Wallet className="w-4 h-4" />, label: 'Payroll Management', roles: ['HR', 'ACCOUNTANT', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/loan-management', icon: <FileText className="w-4 h-4" />, label: 'Loan Processing Center', roles: ['HR', 'ACCOUNTANT', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
      ]
    },
    {
      title: 'Employee Self-Service',
      links: [
        { to: '/attendance', icon: <CalendarCheck className="w-4 h-4" />, label: 'Daily Time Clock', roles: ROLE_GROUPS.ALL },
        { to: '/dtr', icon: <FileText className="w-4 h-4" />, label: 'My DTR (Form 48)', roles: ROLE_GROUPS.ALL },
        { to: '/my-leaves', icon: <Clock className="w-4 h-4" />, label: 'My Leave Applications', roles: ROLE_GROUPS.ALL },
        { to: '/my-payslips', icon: <Wallet className="w-4 h-4" />, label: 'My Payslips & W-2', roles: ROLE_GROUPS.ALL },
        { to: '/my-loans', icon: <FileText className="w-4 h-4" />, label: 'My Provident Loans', roles: ROLE_GROUPS.ALL },
        { to: '/my-performance', icon: <BarChart2 className="w-4 h-4" />, label: 'My IPCRF Ratings', roles: ROLE_GROUPS.ALL },
      ]
    },
    {
      title: 'System & Security',
      links: [
        { to: '/profile', icon: <UserCircle className="w-4 h-4" />, label: 'My Account & PDS', roles: ROLE_GROUPS.ALL },
        { to: '/audit-logs', icon: <ShieldAlert className="w-4 h-4" />, label: 'Activity Logs', roles: ROLE_GROUPS.MANAGEMENT },
      ]
    }
  ];

  return (
    <aside className={`flex flex-col h-full bg-deped-navy text-white transition-all duration-300 ease-in-out border-r border-slate-800/40 shadow-xl overflow-x-hidden ${
      isCollapsed ? 'w-72 lg:w-20' : 'w-72'
    }`}>
      
      {/* Brand Section */}
      <div className={`border-b border-white/10 transition-all duration-300 overflow-x-hidden ${
        isCollapsed ? 'p-4 lg:p-3' : 'p-6'
      }`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-between lg:justify-center' : 'justify-between'} gap-2 overflow-x-hidden`}>
          <div className="flex items-center gap-3 min-w-0 overflow-x-hidden">
            <div className={`bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden p-1 shrink-0 transition-all duration-300 ${
              isCollapsed ? 'w-11 h-11 lg:w-9 lg:h-9' : 'w-11 h-11'
            }`}>
              <img src="/Deped2.png" alt="DepEd Seal" className="w-full h-full object-contain" />
            </div>
            <div className={`min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <h2 className="font-bold text-base tracking-tight leading-none text-white">DepEd HRIS</h2>
              <p className="text-xs font-medium text-amber-300 tracking-wide mt-1 truncate">SDO Lucena City</p>
            </div>
          </div>

          {toggleCollapse && (
            <button
              type="button"
              onClick={toggleCollapse}
              className={`hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0 ${
                isCollapsed ? 'lg:hidden' : ''
              }`}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* When collapsed on desktop, show small expand button */}
        {isCollapsed && toggleCollapse && (
          <div className="hidden lg:flex justify-center mt-2">
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Menu Area */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-6 transition-all duration-300 ${
        isCollapsed ? 'px-4 lg:px-2 py-6' : 'px-4 py-6'
      }`}>
        {menuGroups.map((group, idx) => {
          const visibleLinks = group.links.filter(link => 
            !link.roles || (user && link.roles.includes(user.role))
          );

          if (visibleLinks.length === 0) return null;

          return (
            <div key={idx} className="space-y-1 overflow-x-hidden">
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 truncate ${
                isCollapsed ? 'lg:hidden' : 'block'
              }`}>
                {group.title}
              </h3>
              {isCollapsed && idx > 0 && (
                <div className="hidden lg:block border-t border-white/10 my-2 mx-1" />
              )}

              <div className="space-y-1">
                {visibleLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeDrawer}
                    title={link.label}
                    className={({ isActive }) => `
                      flex items-center rounded-lg text-sm transition-colors min-h-[44px] overflow-hidden
                      ${isCollapsed 
                        ? 'px-3 lg:px-0 lg:justify-center justify-between' 
                        : 'px-3 justify-between'}
                      ${isActive 
                        ? 'bg-white/15 text-white font-semibold ring-1 ring-white/25 shadow-sm' 
                        : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'}
                    `}
                  >
                    <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'lg:justify-center' : ''}`}>
                      <span className="shrink-0 flex items-center justify-center">
                        {link.icon}
                      </span>
                      <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'inline'}`}>
                        {link.label}
                      </span>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/10 bg-black/15 transition-all duration-300 overflow-x-hidden ${
        isCollapsed ? 'p-4 lg:p-2' : 'p-4'
      }`}>
        <div 
          title={`${user?.username || 'User'} (${roleLabel})`}
          className={`flex items-center rounded-lg bg-white/5 border border-white/10 mb-3 overflow-hidden ${
            isCollapsed ? 'p-2.5 lg:p-1.5 lg:justify-center' : 'p-2.5 gap-3'
          }`}
        >
          <div className="avatar placeholder shrink-0">
            <div className="bg-amber-400 text-slate-900 rounded-lg w-9 h-9 font-bold text-xs uppercase flex items-center justify-center shadow-sm">
              {user?.username?.[0] || 'U'}
            </div>
          </div>
          <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
            <p className="text-xs font-semibold truncate text-white">{user?.username || 'Guest'}</p>
            <p className="text-[10px] font-medium text-amber-300/80 uppercase tracking-wide truncate">{roleLabel}</p>
          </div>
        </div>
        
        <button 
          type="button"
          onClick={() => {
            closeDrawer();
            logout();
          }}
          title="Sign Out"
          className={`btn btn-ghost btn-sm btn-block text-red-300 hover:bg-red-500/15 hover:text-red-200 rounded-lg text-xs font-medium cursor-pointer overflow-hidden ${
            isCollapsed ? 'justify-start lg:justify-center lg:px-0' : 'justify-start gap-2.5'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className={isCollapsed ? 'lg:hidden' : 'inline'}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarContent;
