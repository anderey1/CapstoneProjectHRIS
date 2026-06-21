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
      title: 'Main',
      links: [
        { to: '/', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Home', roles: ['ADMINISTRATIVE', 'HR', 'ACCOUNTANT', 'NON_TEACHING', 'TEACHING', 'SUPERINTENDENT'] },
      ]
    },
    {
      title: 'Staff',
      links: [
        { to: '/employees', icon: <Users className="w-4 h-4" />, label: 'Employees', roles: ['HR', 'ADMINISTRATIVE'] },
        { to: '/recruitment', icon: <KanbanSquare className="w-4 h-4" />, label: 'Hiring', roles: ['ADMINISTRATIVE', 'HR'] },
      ]
    },
    {
      title: 'Time & Leave',
      links: [
        { to: '/attendance', icon: <CalendarCheck className="w-4 h-4" />, label: 'Attendance', roles: ['ADMINISTRATIVE', 'HR', 'NON_TEACHING', 'TEACHING'] },
        { to: '/location-tracking', icon: <MapPin className="w-4 h-4" />, label: 'Location Tracking', roles: ['HR'] },
        { to: '/dtr', icon: <FileText className="w-4 h-4" />, label: 'Daily Record', roles: ['HR'] },
        { to: '/leave', icon: <Clock className="w-4 h-4" />, label: 'Leaves', roles: ['ADMINISTRATIVE', 'HR', 'NON_TEACHING', 'TEACHING'] },
      ]
    },
    {
      title: 'Money',
      links: [
        { to: '/payroll', icon: <Wallet className="w-4 h-4" />, label: 'Payroll', roles: ['HR', 'ACCOUNTANT'] },
        { to: '/loans', icon: <FileText className="w-4 h-4" />, label: 'Loans', roles: ['ADMINISTRATIVE', 'HR', 'NON_TEACHING', 'TEACHING', 'ACCOUNTANT'] },
      ]
    },
    {
      title: 'Work Quality',
      links: [
        { to: '/performance', icon: <BarChart2 className="w-4 h-4" />, label: 'Performance', roles: ['ADMINISTRATIVE', 'HR'] },
      ]
    },
    {
      title: 'Settings',
      links: [
        { to: '/profile', icon: <UserCircle className="w-4 h-4" />, label: 'My Profile', roles: ['ADMINISTRATIVE', 'HR', 'ACCOUNTANT', 'NON_TEACHING', 'TEACHING', 'SUPERINTENDENT'] },
        { to: '/schools', icon: <School className="w-4 h-4" />, label: 'School Geofencing', roles: ['ADMINISTRATIVE'] },
        { to: '/audit-logs', icon: <ShieldAlert className="w-4 h-4" />, label: 'System Logs', roles: ['ADMINISTRATIVE', 'HR'] },
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
