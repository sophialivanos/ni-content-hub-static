// components/Layout.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode, SVGProps } from "react";
import { Home, Calendar, Search, FileText, TrendingUp, Layers, Lightbulb } from "lucide-react";

type IconType = (props: SVGProps<SVGSVGElement>) => JSX.Element;

function NavItem({
  href, label, icon: Icon, active,
}: { href: string; label: string; icon: IconType; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition
        ${active
          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useRouter();
  // Active if it's an exact match OR a sub-route
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen w-full grid grid-cols-[260px_1fr] bg-slate-50">
      <aside className="border-r border-slate-800 bg-slate-900 text-slate-100 p-4 sticky top-0 h-screen">
        <div className="text-sm uppercase tracking-widest text-slate-400 mb-2">Content Hub</div>
        <nav className="flex flex-col gap-1">
          <NavItem href="/" label="Welcome" icon={Home} active={isActive("/")} />
          <NavItem href="/events" label="Seasonal Events" icon={Calendar} active={isActive("/events")} />
          <NavItem href="/ai-search" label="AI Search (AIO, AIM)" icon={Search} active={isActive("/ai-search")} />
          <NavItem href="/articles" label="Articles" icon={FileText} active={isActive("/articles")} />
          <NavItem href="/funnel" label="Funnel Optimisation" icon={TrendingUp} active={isActive("/funnel")} />
          <NavItem href="/vertical-profiles" label="Vertical Profiles" icon={Layers} active={isActive("/vertical-profiles")} />
          <NavItem href="/mc-brainstorm" label="MC ads, scripts, + brainstorming" icon={Lightbulb} active={isActive("/mc-brainstorm")} />
        </nav>
      </aside>
      <main className="p-6 w-full">{children}</main>
    </div>
  );
}