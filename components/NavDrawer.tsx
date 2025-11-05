// components/NavDrawer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

type Props = {
  /** Your existing sidebar markup goes here */
  sidebar: React.ReactNode;
  /** Your main page content */
  children: React.ReactNode;
  /** Optional: label for the nav region */
  sidebarLabel?: string;
};

/**
 * Responsive shell: desktop shows static sidebar; mobile shows off-canvas drawer.
 * - Default closed on mobile
 * - No state persistence (no localStorage)
 * - 200ms transition; respects prefers-reduced-motion
 * - ESC/backdrop/close button to dismiss
 * - Focus trap while open and returns focus to the toggle
 * - Does NOT lock page scroll (per your requirement)
 */
export default function NavDrawer({ sidebar, children, sidebarLabel = "Site navigation" }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const close = () => setOpen(false);
  const openDrawer = () => setOpen(true);
  const drawerId = "mobile-drawer";

  // Focus trap + return focus to toggle on close
  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    // Find focusables inside drawer
    const selectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(drawer.querySelectorAll<HTMLElement>(selectors)).filter(
      (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
    );

    // Focus first focusable if present, else the drawer itself
    (focusables[0] || drawer).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab" && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Return focus to the toggle when closing
  useEffect(() => {
    if (!open && btnRef.current) {
      btnRef.current.focus();
    }
  }, [open]);

  const drawerClasses = useMemo(
    () =>
      [
        "md:hidden fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-white shadow-xl border-r",
        "transform transition-transform duration-200 ease-out",
        "motion-reduce:transition-none motion-reduce:transform-none",
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" "),
    [open]
  );

  return (
    <div className="min-h-screen md:flex md:flex-row md:items-stretch">
      {/* Desktop static sidebar */}
      <aside className="hidden md:block md:w-64 md:shrink-0 md:border-r md:bg-white">
        {sidebar}
      </aside>

      {/* Mobile top bar with hamburger */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b">
        <div className="h-12 flex items-center px-3">
          <button
            ref={btnRef}
            type="button"
            onClick={openDrawer}
            aria-expanded={open}
            aria-controls={drawerId}
            aria-label="Open navigation"
            className="inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Spacer to keep your existing header text/icons if any */}
          <div className="ml-3 text-sm font-semibold text-slate-900">Menu</div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id={drawerId}
        role="dialog"
        aria-modal="true"
        aria-label={sidebarLabel}
        ref={drawerRef}
        tabIndex={-1}
        className={drawerClasses}
      >
        <div className="flex items-center justify-between px-3 h-12 border-b">
          <div className="text-sm font-semibold">Navigation</div>
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation"
            className="inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto">{sidebar}</div>
      </div>

      {/* Backdrop (click to close) */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation backdrop"
          onClick={close}
          className="md:hidden fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none"
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}