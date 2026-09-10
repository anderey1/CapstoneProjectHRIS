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
  School,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SidebarContent = ({ closeDrawer }) => {
  const { user, logout } = useAuth();
  const role = user?.role;

  const menuGroups = [
    {
      title: 'Main Menu',
      links: [
        { to: '/', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Home Dashboard', roles: ['HR', 'SUPERINTENDENT', 'ACCOUNTANT', 'NON_TEACHING', 'TEACHING', 'ADMINISTRATIVE'] },
      ]
    },
    {
      title: 'Employee Portal',
      links: [
        { to: '/attendance', icon: <CalendarCheck className="w-4 h-4" />, label: 'Time In / Out', roles: ['HR', 'SUPERINTENDENT', 'ACCOUNTANT', 'NON_TEACHING', 'TEACHING', 'ADMINISTRATIVE'] },
        { to: '/dtr', icon: <FileText className="w-4 h-4" />, label: 'My DTR (Form 48)', roles: ['HR', 'SUPERINTENDENT', 'ACCOUNTANT', 'NON_TEACHING', 'TEACHING', 'ADMINISTRATIVE'] },
        { to: '/my-leaves', icon: <Clock className="w-4 h-4" />, label: 'My Leave Applications', roles: ['HR', 'SUPERINTENDENT', 'ACCOUNTANT', 'NON_TEACHING', 'TEACHING', 'ADMINISTRATIVE'] },
        { to: '/my-payslips', icon: <Wallet className="w-4 h-4" />, label: 'My Payslips / Salaries', roles: ['HR', 'ACCOUNTANT', 'SUPERINTENDENT', 'NON_TEACHING', 'TEACHING', 'ADMINISTRATIVE'] },
        { to: '/my-loans', icon: <FileText className="w-4 h-4" />, label: 'My Provident Loans', roles: ['HR', 'ACCOUNTANT', 'SUPERINTENDENT', 'NON_TEACHING', 'TEACHING', 'ADMINISTRATIVE'] },
        { to: '/my-performance', icon: <BarChart2 className="w-4 h-4" />, label: 'My Performance Ratings', roles: ['HR', 'SUPERINTENDENT', 'ACCOUNTANT', 'NON_TEACHING', 'TEACHING', 'ADMINISTRATIVE'] },
      ]
    },
    {
      title: 'Admin Operations',
      links: [
        { to: '/employees', icon: <Users className="w-4 h-4" />, label: 'Employees List', roles: ['HR', 'SUPERINTENDENT', 'ACCOUNTANT', 'ADMINISTRATIVE'] },
        { to: '/recruitment', icon: <KanbanSquare className="w-4 h-4" />, label: 'Job Applicants', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/attendance-management', icon: <CalendarCheck className="w-4 h-4" />, label: 'DTR Approvals', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/leave-management', icon: <Clock className="w-4 h-4" />, label: 'Leave Approvals', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/payroll-management', icon: <Wallet className="w-4 h-4" />, label: 'Payroll Center', roles: ['HR', 'ACCOUNTANT', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/loan-management', icon: <FileText className="w-4 h-4" />, label: 'Loan Approvals', roles: ['HR', 'ACCOUNTANT', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/performance-management', icon: <BarChart2 className="w-4 h-4" />, label: 'Performance Reviews', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
      ]
    },
    {
      title: 'Settings',
      links: [
        { to: '/profile', icon: <UserCircle className="w-4 h-4" />, label: 'Account Profile', roles: ['HR', 'SUPERINTENDENT', 'ACCOUNTANT', 'NON_TEACHING', 'TEACHING', 'ADMINISTRATIVE'] },
        { to: '/audit-logs', icon: <ShieldAlert className="w-4 h-4" />, label: 'Activity Logs', roles: ['ADMINISTRATIVE'] },
      ]
    }
  ];

  return (
    <aside className="flex flex-col h-full bg-deped-navy text-white w-72 border-r border-slate-800/40 shadow-xl">
      
      {/* Brand Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden p-1 shrink-0">
            <img src="/Deped2.png" alt="DepEd Seal" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-base tracking-tight leading-none text-white">DepEd HRIS</h2>
            <p className="text-xs font-medium text-amber-300 tracking-wide mt-1 truncate">SDO Lucena City</p>
          </div>
        </div>
      </div>

      {/* Menu Area */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {menuGroups.map((group, idx) => {
          const visibleLinks = group.links.filter(link => 
            !link.roles || (user && link.roles.includes(user.role))
          );

          if (visibleLinks.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {visibleLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeDrawer}
                    className={({ isActive }) => `
                      flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px]
                      ${isActive 
                        ? 'bg-white/15 text-white font-semibold ring-1 ring-white/25 shadow-sm' 
                        : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0">
                        {link.icon}
                      </span>
                      <span className="truncate">{link.label}</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-black/15">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 mb-3">
          <div className="avatar placeholder shrink-0">
            <div className="bg-amber-400 text-slate-900 rounded-lg w-9 h-9 font-bold text-xs uppercase flex items-center justify-center shadow-sm">
              {user?.username?.[0] || 'U'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-white">{user?.username || 'Guest'}</p>
            <p className="text-[10px] font-medium text-amber-300/80 uppercase tracking-wide truncate">{user?.role?.replace('_', ' ') || 'Staff'}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            closeDrawer();
            logout();
          }}
          className="btn btn-ghost btn-sm btn-block justify-start gap-2.5 text-red-300 hover:bg-red-500/15 hover:text-red-200 rounded-lg text-xs font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarContent;
