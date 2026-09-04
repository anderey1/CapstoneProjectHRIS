import React from 'react';
import { Menu, User, LogOut, ChevronDown, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

/**
 * Enterprise Navbar (DepEd Standard)
 */
const Navbar = ({ toggleDrawer }) => {
  const { user, logout } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="navbar bg-white border-b border-slate-200/80 px-4 md:px-6 sticky top-0 z-30 h-16 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

      {/* Start Section: Drawer toggle + Branding */}
      <div className="navbar-start flex items-center gap-2">
        {toggleDrawer && (
          <button
            onClick={toggleDrawer}
            className="btn btn-ghost btn-sm btn-square lg:hidden text-slate-600 hover:text-slate-900"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="flex flex-col ml-1 hover:opacity-90 transition-opacity min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#0038A8] uppercase tracking-wider leading-none truncate">
            <span className="inline sm:hidden">SDO Lucena City</span>
            <span className="hidden sm:inline">DepEd Schools Division of Lucena City</span>
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight mt-0.5 truncate">
            <span className="inline sm:hidden">HRIS Portal</span>
            <span className="hidden sm:inline">Human Resource Information System</span>
          </span>
        </Link>
      </div>

      {/* Center Section: Official Calendar Date */}
      <div className="navbar-center hidden md:flex">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/70 border border-slate-200/60 px-3 py-1.5 rounded-full">
          <Calendar className="w-3.5 h-3.5 text-[#0038A8]" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* End Section: Profile & Actions */}
      <div className="navbar-end gap-3">

        {/* User Profile Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="flex items-center gap-2.5 p-1.5 pl-3 hover:bg-slate-100 rounded-full transition-colors cursor-pointer group border border-transparent hover:border-slate-200"
          >
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800 leading-tight">{user?.username || 'User'}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{user?.role?.replace('_', ' ') || 'Staff'}</span>
            </div>
            <div className="avatar">
              <div className="w-8 h-8 rounded-full bg-[#0038A8] text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100 shadow-sm">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>

          <ul tabIndex={0} className="dropdown-content z-[40] mt-3 p-2 shadow-2xl menu menu-sm bg-base-100 rounded-xl w-52 border border-base-200">
            <li className="menu-title px-4 py-2 opacity-40 uppercase text-[9px] font-black tracking-widest border-b border-base-100 mb-1">
              My Account
            </li>
            <li>
              <Link to="/profile" className="py-2.5 px-4 flex items-center gap-3">
                <User className="w-4 h-4 opacity-50" />
                <span className="font-semibold">My Profile</span>
              </Link>
            </li>
            <div className="divider my-1 opacity-50"></div>
            <li>
              <button 
                onClick={logout}
                className="py-2.5 px-4 flex items-center gap-3 text-error hover:bg-error/5"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-bold">Logout</span>
              </button>
            </li>
          </ul>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
