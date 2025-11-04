// components/AppSidebar.tsx
import React from "react";
import clsx from "clsx";
import Link from "next/link";
import { X, Home, CalendarDays, Search, FileText, Activity, Boxes } from "lucide-react";

export default function AppSidebar({
  open,
  mobileOpen,
  onCloseMobile,
}: {
  open: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  // shared panel
  const Panel = (
    <aside
      id="app-sidebar"
      className={clsx(
        "bg-slate-900 text-slate-100",
        "fixed inset-y-0 left-0 z-50 w-64",
        "transform transition-transform duration-200",
        // desktop behaviour
        "md:translate-x-0 md:static md:z-30",
      )}
    >
      {/* Header row (single label only) */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-white/5">
        <span className="text-xs font-semibold tracking-wider text-slate-400">CONTENT HUB</span>
        {/* Close button visible on mobile only */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:bg-white/5"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="h-[calc(100vh-3rem)] overflow-y-auto px-3 py-3">
        <ul className="space-y-1 text-[13px]">
          <li><Link href="/" className="flex items-center gap-2 rounded px-3 py-2 hover:bg-white/5"><Home className="h-4 w-4" />Welcome</Link></li>
          <li><Link href="/events" className="flex items-center gap-2 rounded px-3 py-2 hover:bg-white/5"><CalendarDays className="h-4 w-4" />Seasonal Events</Link></li>
          <li><Link href="/ai-search" className="flex items-center gap-2 rounded px-3 py-2 hover:bg-white/5"><Search className="h-4 w-4" />AI Search (AIO, AIM)</Link></li>
          <li><Link href="/articles" className="flex items-center gap-2 rounded px-3 py-2 hover:bg-white/5"><FileText className="h-4 w-4" />Articles</Link></li>
          <li><Link href="/funnel" className="flex items-center gap-2 rounded px-3 py-2 hover:bg-white/5"><Activity className="h-4 w-4" />Funnel Optimisation</Link></li>
          <li><Link href="/verticals" className="flex items-center gap-2 rounded px-3 py-2 hover:bg-white/5"><Boxes className="h-4 w-4" />Vertical Profiles</Link></li>
          {/* …add the rest as needed */}
        </ul>
      </nav>
    </aside>
  );

  return (
    <>
      {/* Desktop: slide in/out */}
      <div
        className={clsx(
          "hidden md:block",
          open ? "md:translate-x-0" : "md:-translate-x-full",
          "transition-transform duration-200"
        )}
      >
        {Panel}
      </div>

      {/* Mobile drawer + backdrop */}
      <div
        className={clsx(
          "md:hidden fixed inset-0 z-50",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          onClick={onCloseMobile}
          className={clsx(
            "absolute inset-0 bg-black/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />
        {/* Drawer */}
        <div
          className={clsx(
            "absolute inset-y-0 left-0 w-72",
            "transform transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
        >
          {Panel}
        </div>
      </div>
    </>
  );
}