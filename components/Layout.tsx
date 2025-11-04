// components/Layout.tsx
import React, { useState } from "react";
import MobileNavToggle from "./MobileNavToggle";
import SidebarDrawer from "./SidebarDrawer";
// …your other imports (Header, AppSidebar for desktop, etc.)

export default function Layout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* (optional) your header */}
      {/* Desktop sidebar stays exactly as you have it */}
      <div className="flex">
        {/* Example: your existing desktop sidebar */}
        {/* <aside className="hidden md:block w-72 shrink-0">
          <AppSidebar />
        </aside> */}

        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* --- Mobile-only trigger & drawer (overlay) --- */}
      <MobileNavToggle onOpen={() => setDrawerOpen(true)} isOpen={drawerOpen} />
      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}