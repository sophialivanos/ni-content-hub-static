// components/AppSidebar.tsx
import React from "react";
import clsx from "clsx";
import {
  Home,
  CalendarDays,
  Search,
  FileText,
  Funnel,
  Layers,
  Megaphone,
  PlusSquare,
  X,
} from "lucide-react";

type Props = {
  collapsed?: boolean;      // optional to support callers that don't pass it
  mobileOpen: boolean;      // mobile drawer visibility
  onCloseMobile: () => void;
};

const NAV = [
  { href: "/", label: "Welcome", icon: Home },
  { href: "/events", label: "Seasonal Events", icon: CalendarDays },
  { href: "/ai-search", label: "AI Search (AIO, AIM)", icon: Search },
  { href: "/articles", label: "Articles", icon: FileText },
  { href: "/funnel", label: "Funnel Optimisation", icon: Funnel },
  { href: "/verticals", label: "Vertical Profiles", icon: Layers },
  { href: "/mc-ads", label: "MC ads, scripts, + brainstorming", icon: Megaphone },
  { href: "/more", label: "+ More to come…", icon: PlusSquare },
];

function NavList({ collapsed }: { collapsed: boolean }) {
  return (
    <nav className="mt-2 space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            className={clsx(
              "group flex items-center gap-3 rounded-md px-2 py-2",
              "text-slate-200 hover:bg-white/10 hover:text-white transition"
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {/* label hidden in collapsed desktop */}
            <span className={clsx("truncate", collapsed && "hidden")}>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export default function AppSidebar({ collapsed = false, mobileOpen, onCloseMobile }: Props) {
  // const collapsed = !open;
  // Desktop panel
  return (
    <>
      <aside
        id="app-sidebar"
        style={{ width: collapsed ? 64 : 256 }}
        className={clsx(
          "hidden md:flex fixed inset-y-0 left-0 z-30 flex-col",
          "border-r border-slate-800/50 bg-slate-900 text-slate-50",
          "transition-[width] ease-out motion-safe:duration-200 motion-reduce:duration-0",
          collapsed ? "w-16" : "w-64"
        )}
        aria-label="Primary"
      >
        <div className={clsx("px-3 pt-4", collapsed ? "pb-2" : "pb-3")}>
        {!collapsed && <div className="font-semibold tracking-tight">Content Hub</div>}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <NavList collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer (full labels) */}
      <div
        className={clsx(
          "md:hidden fixed inset-y-0 left-0 z-40 transform",
          "transition-transform ease-out motion-safe:duration-200 motion-reduce:duration-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="w-64 h-full bg-slate-900 text-slate-50 shadow-lg p-3 relative">
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="px-1 pt-2 pb-2">
          <div className="font-semibold tracking-tight">Content Hub</div>
          </div>
          <div className="px-1">
            <NavList collapsed={false} />
          </div>
        </div>
      </div>
    </>
  );
}