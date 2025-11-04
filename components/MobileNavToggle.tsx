// components/MobileNavToggle.tsx
import React from "react";
import { ChevronRight } from "lucide-react";

export default function MobileNavToggle({
  onOpen,
  isOpen,
}: {
  onOpen: () => void;
  isOpen?: boolean;
}) {
  return (
    <div className="md:hidden sticky top-0 z-30 bg-slate-50/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-screen-2xl mx-auto px-4 py-2">
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open navigation"
          aria-controls="mobile-drawer"
          aria-expanded={isOpen ? "true" : "false"}
          className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 bg-white/70 text-slate-600 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}