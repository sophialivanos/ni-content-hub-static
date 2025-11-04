// components/AppSidebar.tsx
import Link from "next/link";
import {
  Home, Calendar, Search, FileText, Activity, Layers, MessageSquareSquare as MessageSquare,
} from "lucide-react";

// If your lucide export doesn't have MessageSquareSquare, use MessageSquare instead:
import { MessageSquare } from "lucide-react";

export default function AppSidebar() {
  const Item = ({
    href,
    icon: Icon,
    children,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      className="group flex items-center gap-3 px-3 py-2 rounded-md text-slate-200 hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4 opacity-70 group-hover:opacity-100" />
      <span className="truncate">{children}</span>
    </Link>
  );

  return (
    <nav aria-label="Content Hub" className="text-sm">
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Content Hub
      </div>
      <div className="space-y-1">
        <Item href="/" icon={Home}>Welcome</Item>
        <Item href="/events" icon={Calendar}>Seasonal Events</Item>
        <Item href="/ai-search" icon={Search}>AI Search (AIO, AIM)</Item>
        <Item href="/articles" icon={FileText}>Articles</Item>
        <Item href="/funnel" icon={Activity}>Funnel Optimisation</Item>
        <Item href="/verticals" icon={Layers}>Vertical Profiles</Item>
        <Item href="/mc-ads" icon={MessageSquare}>MC ads, scripts, + brainstorming</Item>
      </div>
      <div className="px-3 pt-4 text-xs text-slate-500">+ More to come…</div>
    </nav>
  );
}