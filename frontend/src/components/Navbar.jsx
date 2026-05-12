import React from 'react';
import { Menu, Bell, Search, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar Component
 * 
 * Mobile-first responsive navbar.
 * Features a toggle for the mobile drawer, search placeholder, and user actions.
 */
const Navbar = ({ toggleDrawer }) => {
  const { user } = useAuth();

  return (
    <div className="navbar bg-base-100 border-b border-base-300 px-4 sticky top-0 z-30">
      {/* Navbar Start: Mobile Toggle & Page Title */}
      <div className="navbar-start">
        <label 
          htmlFor="main-drawer" 
          className="btn btn-ghost btn-circle lg:hidden"
          onClick={toggleDrawer}
        >
          <Menu className="w-5 h-5" />
        </label>
        <div className="hidden lg:flex px-2 mx-2">
          <span className="text-sm font-bold opacity-40 uppercase tracking-widest">
            Portal / Dashboard
          </span>
        </div>
      </div>

      {/* Navbar Center: Search Bar (Hidden on small mobile) */}
      <div className="navbar-center hidden md:flex">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="input input-sm input-bordered w-64 pl-10 bg-base-200/50 focus:bg-base-100 transition-all rounded-full"
          />
        </div>
      </div>

      {/* Navbar End: Notifications & User Avatar */}
      <div className="navbar-end gap-2">
        <button className="btn btn-ghost btn-circle btn-sm">
          <div className="indicator">
            <Bell className="w-5 h-5" />
            <span className="badge badge-xs badge-primary indicator-item"></span>
          </div>
        </button>

        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar online">
            <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random`} alt="avatar" />
            </div>
          </label>
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-300">
            <li className="menu-title px-4 py-2 opacity-50 uppercase text-[10px] font-black">Account Settings</li>
            <li><a>Profile</a></li>
            <li><a>Settings</a></li>
            <div className="divider my-0"></div>
            <li><a className="text-error">Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
