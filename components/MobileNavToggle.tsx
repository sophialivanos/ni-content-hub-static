// components/MobileNavToggle.tsx
import { ChevronRight } from "lucide-react";

type Props = {
  onOpen: () => void;
  isOpen?: boolean;
};

export default function MobileNavToggle({ onOpen, isOpen }: Props) {
  // Hidden on desktop and while drawer is open
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open navigation"
      aria-controls="app-sidebar-drawer"
      aria-expanded="false"
      className="
        md:hidden fixed left-2 top-20 z-40 h-9 w-9 rounded-full
        bg-indigo-600/80 text-white border border-white/10
        shadow-md shadow-indigo-900/20 backdrop-blur
        opacity-70 hover:opacity-100 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-white/60
        transition motion-safe:duration-200
      "
    >
      <ChevronRight className="h-5 w-5 mx-auto" />
      <span className="sr-only">Open menu</span>
    </button>
  );
}