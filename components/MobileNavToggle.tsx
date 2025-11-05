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
   <button
    onClick={onOpen}
    aria-controls="app-sidebar"
    aria-expanded={!!isOpen}
/* Same colour on all breakpoints; smaller & higher so it doesn’t push content */
  className="fixed left-3 top-2 z-40 md:hidden
    inline-flex h-9 w-9 items-center justify-center rounded-full
    bg-white/90 backdrop-blur ring-1 ring-slate-200 hover:ring-slate-300
    text-slate-500 hover:text-slate-700 focus:outline-none
    focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
    <ChevronRight className="h-4 w-4" />
    <span className="sr-only">Open navigation</span>
    </button>
   );
}