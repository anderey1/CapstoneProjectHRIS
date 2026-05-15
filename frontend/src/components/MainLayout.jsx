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

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="main-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={toggleDrawer}
      />

      {/* Page Content */}
      <div className="drawer-content flex flex-col min-h-screen bg-base-200/50">
        <Navbar toggleDrawer={toggleDrawer} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-24 lg:pb-0">

          {/* Main content injected here via react-router Outlet */}
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile-only Bottom Navigation Bar */}
        <MobileBottomNav toggleDrawer={toggleDrawer} />

        {/* Simple Mobile Footer Branding */}
        <footer className="p-4 text-center text-[10px] opacity-30 uppercase tracking-[0.2em] lg:hidden mb-16">
          DepEd Lucena HRIS © 2026
        </footer>
      </div>

      {/* Sidebar / Drawer Side */}
      <div className="drawer-side z-[60]">
        <label htmlFor="main-drawer" className="drawer-overlay" aria-label="close sidebar"></label>
        <SidebarContent closeDrawer={closeDrawer} />
      </div>
    </div>
  );
};

export default MainLayout;
