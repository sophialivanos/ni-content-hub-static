// components/Layout.tsx
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MobileNavToggle from "./MobileNavToggle";
import SidebarDrawer from "./SidebarDrawer";
import AppSidebar from "./AppSidebar"; // your existing sidebar menu

export default function Layout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);     // mobile
  const [desktopOpen, setDesktopOpen] = useState(true);    // desktop default: open

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top bar with subtle trigger (no overlay on content) */}
      <MobileNavToggle onOpen={() => setDrawerOpen(true)} isOpen={drawerOpen} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={`hidden md:block sticky top-0 h-screen transition-[width] duration-200 ease-out border-r border-slate-200 bg-slate-900 text-slate-100 ${
            desktopOpen ? "w-72" : "w-0"
          }`}
        >
          <div
            className={`${
              desktopOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            } h-full flex flex-col`}
          >
            <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800">
              <div className="text-xs font-semibold tracking-wider text-slate-400">
                CONTENT HUB
              </div>
              <button
                type="button"
                onClick={() => setDesktopOpen(false)}
                aria-label="Collapse navigation"
                className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AppSidebar />
            </div>
          </div>
        </aside>

        {/* Small expand tab when collapsed (desktop only) */}
        {!desktopOpen && (
          <button
            type="button"
            onClick={() => setDesktopOpen(true)}
            aria-label="Expand navigation"
            className="hidden md:flex fixed left-3 top-3 z-20 h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Main content with consistent “invisible border” */}
        <main className="flex-1">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-4 md:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}