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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Sidebar Component with Simple Labels
 */
const SidebarContent = ({ closeDrawer }) => {
  const { user, logout } = useAuth();
  const isAdminOrHR = user && ['ADMIN', 'HR'].includes(user?.role);

  const menuGroups = [
    {
      title: 'Main',
      links: [
        { to: '/', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Home' },
      ]
    },
    {
      title: 'Staff',
      links: [
        { to: '/employees', icon: <Users className="w-4 h-4" />, label: 'Employees', roles: ['ADMIN', 'HR'] },
        { to: '/recruitment', icon: <KanbanSquare className="w-4 h-4" />, label: 'Hiring', roles: ['ADMIN', 'HR'] },
      ]
    },
    {
      title: 'Time & Leave',
      links: [
        { to: '/attendance', icon: <CalendarCheck className="w-4 h-4" />, label: 'Attendance' },
        { to: '/dtr', icon: <FileText className="w-4 h-4" />, label: 'Daily Record (DTR)' },
        { to: '/leave', icon: <Clock className="w-4 h-4" />, label: 'Leaves' },
      ]
    },
    {
      title: 'Money',
      links: [
        { to: '/payroll', icon: <Wallet className="w-4 h-4" />, label: 'Payroll' },
        { to: '/loans', icon: <FileText className="w-4 h-4" />, label: 'Loans' },
      ]
    },
    {
      title: 'Work Quality',
      links: [
        { to: '/performance', icon: <BarChart2 className="w-4 h-4" />, label: 'Performance' },
      ]
    },
    {
      title: 'Settings',
      links: [
        { to: '/profile', icon: <UserCircle className="w-4 h-4" />, label: 'My Profile' },
        { to: '/audit-logs', icon: <ShieldAlert className="w-4 h-4" />, label: 'System Logs', roles: ['ADMIN', 'HR'] },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-base-100 text-base-content w-80 border-r border-base-200">
      
      {/* Brand Section */}
      <div className="p-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-content shadow-lg shadow-primary/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tight leading-none text-base-content uppercase">DEPED HRIS</h2>
            <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] mt-1 text-primary">Lucena Division</p>
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
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
                {group.title}
              </h3>
              <div className="space-y-1">
                {visibleLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeDrawer}
                    className={({ isActive }) => `
                      flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group
                      ${isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-base-content/60 hover:bg-base-200/50 hover:text-base-content'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="transition-transform duration-200 group-hover:scale-110">
                        {link.icon}
                      </span>
                      <span className="text-sm font-bold tracking-tight">{link.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-base-200 bg-base-50/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-base-200 mb-4 shadow-sm">
          <div className="avatar placeholder">
            <div className="bg-primary/10 text-primary rounded-lg w-10 h-10 font-black text-xs uppercase flex items-center justify-center">
              {user?.username?.[0] || 'U'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate text-base-content uppercase tracking-tight">{user?.username || 'Guest'}</p>
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">{user?.role || 'Guest'}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            closeDrawer();
            logout();
          }}
          className="btn btn-ghost btn-block justify-start gap-3 text-error hover:bg-error/10 rounded-lg text-xs font-bold uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default SidebarContent;
