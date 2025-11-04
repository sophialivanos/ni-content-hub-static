// components/AppFrame.tsx
import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import clsx from "clsx";
import AppSidebar from "./AppSidebar";

export default function AppFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);        // desktop default: open
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar (desktop + mobile) */}
      <AppSidebar
        open={open}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Desktop toggle – subtle, inside the panel edge */}
      <button
        type="button"
        aria-label={open ? "Collapse navigation" : "Expand navigation"}
        aria-controls="app-sidebar"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "hidden md:flex items-center justify-center",
          "fixed z-40 top-3 left-[248px]",               // sits on the panel, not the content
          "h-7 w-7 rounded-full ring-1 ring-white/10",
          "bg-slate-800/70 text-slate-200 hover:bg-slate-700",
          "transition-colors"
        )}
      >
        {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* Mobile top bar with tiny arrow – NO extra top whitespace */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-3 py-2">
          <button
            type="button"
            aria-label="Open navigation"
            aria-controls="app-sidebar"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Page content with ‘invisible border’ gutters */}
      <main
        className={clsx(
          "transition-[margin] duration-200",
          open ? "md:ml-64" : "md:ml-0"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile backdrop + close affordance inside drawer handled in AppSidebar */}
    </div>
  );
}