import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Clock, UserCircle, Menu } from 'lucide-react';

const MobileBottomNav = ({ toggleDrawer }) => {
  const navItems = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/attendance', icon: <CalendarCheck className="w-5 h-5" />, label: 'Attendance' },
    { to: '/my-leaves', icon: <Clock className="w-5 h-5" />, label: 'Leaves' },
    { to: '/profile', icon: <UserCircle className="w-5 h-5" />, label: 'Profile' },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-[0_-2px_6px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center py-1 px-2 flex-1 transition-colors min-h-[44px]
              ${isActive ? 'text-[#0038A8]' : 'text-slate-500 hover:text-slate-800'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`transition-transform duration-150 ${isActive ? 'scale-105' : ''}`}>
                  {item.icon}
                </div>
                <span className={`text-[11px] mt-0.5 leading-none ${isActive ? 'font-semibold text-[#0038A8]' : 'font-normal'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 bg-[#0038A8] rounded-full mt-1"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
        
        {/* Drawer Menu Trigger */}
        <button 
          onClick={toggleDrawer}
          type="button"
          aria-label="Open sidebar menu"
          className="flex flex-col items-center justify-center py-1 px-2 flex-1 text-slate-500 hover:text-slate-800 transition-colors min-h-[44px]"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] font-normal mt-0.5 leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
