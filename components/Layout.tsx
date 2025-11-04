// components/Layout.tsx
import React from "react";
import NavDrawer from "./NavDrawer"; // NEW

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  return (
    <NavDrawer
      sidebar={
        // ⬇️ Use your existing sidebar JSX here (unchanged)
        <nav className="p-3 space-y-1">
          {/* Content Hub / Welcome / Seasonal Events / ... exactly as you have it */}
          {/* Keep all your existing classes and links */}
        </nav>
      }
    >
      {/* ⬇️ Your existing main content wrapper stays intact */}
      <div className="p-4">{children}</div>
    </NavDrawer>
  );
}