// components/SidebarDrawer.tsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import AppSidebar from "./AppSidebar";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SidebarDrawer({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      id="app-sidebar-drawer"
      aria-hidden={!open}
      className={`
        md:hidden fixed inset-0 z-50
        ${open ? "pointer-events-auto" : "pointer-events-none"}
      `}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`
          absolute inset-0 bg-slate-900/40 transition
          ${open ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          absolute left-0 top-0 h-full w-80 max-w-[85%]
          bg-slate-900 text-slate-100 shadow-2xl
          transition-transform motion-safe:duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close (X) — note: no arrow inside the drawer now */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-3 top-3 p-2 rounded-full text-slate-200/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Sidebar content */}
        <div className="h-full overflow-y-auto">
          <AppSidebar onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}