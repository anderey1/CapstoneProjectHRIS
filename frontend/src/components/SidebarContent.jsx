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

/**
 * Sidebar Component with Simple Labels
 */
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
        { to: '/employees', icon: <Users className="w-4 h-4" />, label: 'Employees List', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/recruitment', icon: <KanbanSquare className="w-4 h-4" />, label: 'Job Applicants', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/attendance-management', icon: <CalendarCheck className="w-4 h-4" />, label: 'DTR Approvals', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/leave-management', icon: <Clock className="w-4 h-4" />, label: 'Leave Approvals', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/payroll-management', icon: <Wallet className="w-4 h-4" />, label: 'Payroll Center', roles: ['HR', 'ACCOUNTANT', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/loan-management', icon: <FileText className="w-4 h-4" />, label: 'Loan Approvals', roles: ['HR', 'ACCOUNTANT', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
        { to: '/performance-management', icon: <BarChart2 className="w-4 h-4" />, label: 'Performance Reviews', roles: ['HR', 'SUPERINTENDENT'] },
      ]
    },
    {
      title: 'Settings',
      links: [
        { to: '/profile', icon: <UserCircle className="w-4 h-4" />, label: 'Account Profile', roles: ['HR', 'SUPERINTENDENT', 'ACCOUNTANT', 'NON_TEACHING', 'TEACHING', 'ADMINISTRATIVE'] },
        { to: '/audit-logs', icon: <ShieldAlert className="w-4 h-4" />, label: 'Activity Logs', roles: ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'] },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0038A8] text-white w-80 border-r border-blue-900/20">
      
      {/* Brand Section */}
      <div className="p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden p-1">
            <img src="/Deped2.png" alt="Seal" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tight leading-none text-white uppercase italic">DEPED HRIS</h2>
            <p className="text-[9px] font-black text-[#FCD116] uppercase tracking-[0.2em] mt-1">Lucena Division</p>
          </div>
        </div>
      </div>

      {/* Menu Area */}
      <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-8">
        {menuGroups.map((group, idx) => {
          const visibleLinks = group.links.filter(link => 
            !link.roles || (user && link.roles.includes(user.role))
          );

          if (visibleLinks.length === 0) return null;

          return (
            <div key={idx} className="space-y-3">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#FCD116] opacity-70">
                {group.title}
              </h3>
              <div className="space-y-1">
                {visibleLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeDrawer}
                    className={({ isActive }) => `
                      flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-white/10 text-[#FCD116] border-l-4 border-[#FCD116] pl-3' 
                        : 'text-white/70 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="transition-transform duration-200 group-hover:scale-110">
                        {link.icon}
                      </span>
                      <span className="text-sm font-bold tracking-tight">{link.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 bg-black/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-4 shadow-inner">
          <div className="avatar placeholder">
            <div className="bg-[#FCD116] text-[#0038A8] rounded-lg w-10 h-10 font-black text-xs uppercase flex items-center justify-center">
              {user?.username?.[0] || 'U'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate text-white uppercase tracking-tight">{user?.username || 'Guest'}</p>
            <p className="text-[10px] font-bold text-[#FCD116] uppercase tracking-tighter opacity-80">{user?.role || 'Guest'}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            closeDrawer();
            logout();
          }}
          className="btn btn-ghost btn-block justify-start gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl text-xs font-bold uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default SidebarContent;
