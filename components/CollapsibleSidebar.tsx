// components/CollapsibleSidebar.tsx
import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  /** Your existing nav markup (links, icons, headings) */
  sidebar: React.ReactNode;
  /** Main page content */
  children: React.ReactNode;
};

const FOCUSABLE =
  'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

export default function CollapsibleSidebar({ sidebar, children }: Props) {
  const [openMobile, setOpenMobile] = React.useState(false); // default closed (mobile)
  const [collapsed, setCollapsed] = React.useState(false);   // desktop collapse
  const trapRef = React.useRef<HTMLDivElement>(null);
  const drawerId = "app-sidebar";

  // ESC closes the drawer on mobile
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openMobile) setOpenMobile(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMobile]);

  // Simple focus trap when mobile drawer is open
  React.useEffect(() => {
    if (!openMobile || !trapRef.current) return;
    const root = trapRef.current;
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusables.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [openMobile]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar (collapsible width) */}
      <aside
        id={drawerId}
        className={[
          "relative hidden md:flex flex-col border-r border-slate-200 bg-slate-900 text-slate-50",
          "transition-[width] ease-out motion-safe:duration-200 motion-reduce:duration-0",
          collapsed ? "w-14" : "w-64",
        ].join(" ")}
        aria-label="Primary"
      >
        {/* Collapse/expand arrow (desktop) */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-controls={drawerId}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:inline-flex items-center justify-center absolute -right-3 top-4 h-6 w-6 rounded-full bg-white text-slate-700 shadow border border-slate-200"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className="flex-1 overflow-y-auto p-3">
          {sidebar}
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-40 md:hidden transform",
          "transition-transform ease-out motion-safe:duration-200 motion-reduce:duration-0",
          openMobile ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div
          ref={trapRef}
          className="w-64 h-full bg-slate-900 text-slate-50 shadow-lg p-3"
        >
          <button
            type="button"
            onClick={() => setOpenMobile(false)}
            className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
          {sidebar}
        </div>
      </div>

      {/* Backdrop (click to close). No scroll lock; body can still scroll. */}
      <button
        onClick={() => setOpenMobile(false)}
        aria-hidden={!openMobile}
        tabIndex={openMobile ? 0 : -1}
        className={[
          "md:hidden fixed inset-0 z-30 bg-black/30",
          "transition-opacity motion-safe:duration-200 motion-reduce:duration-0",
          openMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile open arrow (default collapsed) */}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          aria-controls={drawerId}
          aria-expanded={openMobile}
          className="md:hidden fixed left-2 top-16 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow"
          title="Open menu"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Your page content */}
        {children}
      </main>
    </div>
  );
}