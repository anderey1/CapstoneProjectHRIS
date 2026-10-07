import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarContent from './SidebarContent';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';

/**
 * MainLayout Component
 * 
 * Provides the core responsive shell for the application.
 * Uses a mobile-first Drawer layout:
 * - On mobile (< lg): Sidebar is hidden behind a drawer toggle.
 * - On desktop (>= lg): Sidebar is permanently visible on the left.
 */
const MainLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="drawer lg:drawer-open max-w-full overflow-x-hidden">
      <input
        id="main-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={toggleDrawer}
      />

      {/* Page Content */}
      <div className="drawer-content flex flex-col min-h-screen bg-base-200/50 min-w-0 max-w-full overflow-x-hidden">
        <Navbar 
          toggleDrawer={toggleDrawer} 
          toggleCollapse={toggleCollapse} 
          isCollapsed={isCollapsed} 
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-24 lg:pb-0">

          {/* Main content injected here via react-router Outlet */}
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile-only Bottom Navigation Bar */}
        <MobileBottomNav toggleDrawer={toggleDrawer} />

        {/* Simple Mobile Footer Branding */}
        <footer className="p-4 text-center text-xs text-slate-400 lg:hidden mb-16">
          DepEd Lucena HRIS © 2026
        </footer>
      </div>

      {/* Sidebar / Drawer Side */}
      <div className="drawer-side z-[60] overflow-x-hidden">
        <label htmlFor="main-drawer" className="drawer-overlay" aria-label="close sidebar"></label>
        <SidebarContent 
          closeDrawer={closeDrawer} 
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />
      </div>
    </div>
  );
};

export default MainLayout;
