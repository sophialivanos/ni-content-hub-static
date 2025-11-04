// components/AppFrame.tsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import AppSidebar from "./AppSidebar";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  // Desktop: default expanded; collapsed keeps an icon rail (not hidden)
  const [collapsed, setCollapsed] = React.useState(false);
  // Mobile drawer: controlled by page-level chevron (e.g., near "Export CSV")
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [open, setOpen] = React.useState(true);        // desktop default open

  // Sidebar effective width (desktop)
  const desktopWidth = collapsed ? 64 : 256; // px (w-16 vs w-64)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppSidebar
        collapsed={collapsed}
        open={open}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Desktop toggle – white pill so it's visible over the dark panel */}
      <button
        type="button"
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        aria-controls="app-sidebar"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((v) => !v)}
        className={clsx(
          "hidden md:flex fixed z-40 top-3",
          // place the pill near the current sidebar edge
          `left-[${desktopWidth - 16}px]`, // 16px in from the edge so it’s not half-floating
          "h-9 w-9 items-center justify-center rounded-full",
          "bg-slate-800/80 text-slate-200 ring-1 ring-slate-200 hover:ring-slate-300 shadow transition"
        )}
        style={{ left: `${desktopWidth - 16}px` }} // fallback for arbitrary value
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Mobile arrow: fixed, small, slate-coloured */}
      {!mobileOpen && (
  <button
    type="button"
    aria-label="Open navigation"
    aria-controls="app-sidebar"
    aria-expanded={false}
    onClick={() => setMobileOpen(true)}
    className="md:hidden fixed top-2 left-2 z-50 inline-flex h-8 w-8 items-center justify-center
               rounded-full bg-slate-800/80 text-slate-200 ring-1 ring-slate-200 shadow-sm"
    title="Open menu"
  >
    <ChevronRight className="h-4 w-4" />
  </button>
)}

      {/* Page content with ‘invisible border’ gutters; padding reflects collapsed width */}
      <main
        className={clsx(
          "transition-[padding] duration-200",
          collapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>
    </div>
  );
}