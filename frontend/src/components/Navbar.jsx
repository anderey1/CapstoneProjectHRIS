import React from 'react';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

/**
 * Cleaned Navbar (Removed non-functional/dead elements)
 */
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="navbar bg-white/70 backdrop-blur-xl border-b border-base-200 px-4 md:px-6 sticky top-0 z-30 h-16">

      {/* Start Section: Branding */}
      <div className="navbar-start">
        <Link to="/" className="flex flex-col ml-1 hover:opacity-80 transition-opacity">
          <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] leading-none">DepEd Lucena</span>
          <span className="text-sm font-black text-base-content tracking-tight">HR Management</span>
        </Link>
      </div>

      <div className="navbar-center">
        <div className="flex items-center gap-1.5 bg-base-200/50 px-3 py-1 rounded-full border border-base-300/50">
          <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black opacity-50 uppercase tracking-[0.1em]">System Ready</span>
        </div>
      </div>

      {/* End Section: Profile & Actions */}
      <div className="navbar-end gap-3">

        {/* User Profile Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="flex items-center gap-2 p-1 pl-2 hover:bg-base-200 rounded-full transition-colors cursor-pointer group"
          >
            <div className="hidden md:flex flex-col items-end mr-1">
              <span className="text-[11px] font-bold text-base-content leading-none">{user?.username || 'User'}</span>
              <span className="text-[9px] font-black opacity-30 uppercase tracking-tighter">{user?.role || 'Guest'}</span>
            </div>
            <div className="avatar">
              <div className="w-8 rounded-full ring-2 ring-primary/10 ring-offset-1 ring-offset-base-100 group-hover:ring-primary/30 transition-all">
                <img
                  src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=4f46e5&color=fff`}
                  alt="avatar"
                />
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
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
    </div>
  );
};

export default Navbar;
