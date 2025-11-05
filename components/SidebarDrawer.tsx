// components/SidebarDrawer.tsx (only the relevant bits)
export default function SidebarDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // …existing focus trap / ESC logic (unchanged)

  return (
    <div
      id="mobile-drawer"
      role="dialog"
      aria-modal="true"
      className={`md:hidden fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-slate-900 text-slate-100 shadow-xl border-r border-slate-800
          transition-transform duration-200 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="text-xs font-semibold tracking-wider text-slate-400">
            CONTENT HUB
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>
        <div className="h-[calc(100%-44px)] overflow-y-auto">
          {/* your existing <AppSidebar /> */}
        </div>
      </aside>
    </div>
  );
}