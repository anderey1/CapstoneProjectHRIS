import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Clock, UserCircle, Menu } from 'lucide-react';

const MobileBottomNav = ({ toggleDrawer }) => {
  const navItems = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Home' },
    { to: '/attendance', icon: <CalendarCheck className="w-5 h-5" />, label: 'Log' },
    { to: '/leave', icon: <Clock className="w-5 h-5" />, label: 'Leave' },
    { to: '/profile', icon: <UserCircle className="w-5 h-5" />, label: 'Me' },
  ];

  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-[100]">
      <div className="bg-base-100/80 backdrop-blur-lg border border-base-300 rounded-xl shadow-2xl px-2 py-2 flex items-center justify-around">

        {navItems.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center py-2 px-1 flex-1 transition-all duration-300 rounded-xl
              ${isActive ? 'text-primary scale-110' : 'text-base-content/40 hover:text-base-content/60'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`${isActive ? 'opacity-100' : 'opacity-100'}`}>
                  {item.icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter mt-1">{item.label}</span>
                {isActive && (
                  <div className="absolute -top-1 w-1 h-1 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.8)]"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
        
        {/* Menu Trigger */}
        <button 
          onClick={toggleDrawer}
          className="flex flex-col items-center justify-center py-2 px-1 flex-1 text-base-content/40 transition-all active:scale-95"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-tighter mt-1">More</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
