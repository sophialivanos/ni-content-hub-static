import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Menu, CalendarDays, Search, FileText, Funnel, Users, Lightbulb } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'

type NavItem = { label: string; href: string; icon: React.ReactNode }

const NAV: NavItem[] = [
  { label: 'Seasonal Events', href: '/events', icon: <CalendarDays className="h-4 w-4" /> },
  { label: 'AI Search (AIO, AIM)', href: '/ai-search', icon: <Search className="h-4 w-4" /> },
  { label: 'Articles', href: '/articles', icon: <FileText className="h-4 w-4" /> },
  { label: 'Funnel Optimisation', href: '/funnel', icon: <Funnel className="h-4 w-4" /> },
  { label: 'Vertical Profiles', href: '/profiles', icon: <Users className="h-4 w-4" /> },
  { label: 'MC ads, scripts, + brainstorming', href: '/mc-brainstorm', icon: <Lightbulb className="h-4 w-4" /> },
]

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useRouter()
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-4">
        <div className="text-white/90 font-semibold text-lg">Content Hub</div>
      </div>
      <Separator className="bg-white/10" />
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { track('nav_click', { label: item.label, href: item.href }); onNavigate?.() }}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  'text-white/80 hover:text-white hover:bg-white/10',
                  active && 'bg-white/15 text-white'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
          <div className="mt-2 px-3 py-2 text-xs text-white/50 select-none">+ More to come…</div>
        </nav>
      </ScrollArea>
      <div className="p-3 text-[11px] text-white/40">© {new Date().getFullYear()} NI</div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Top bar (mobile) */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[var(--bg)] text-white border-b border-[var(--ring)]">
        <div className="font-semibold">Content Hub</div>
        <Sheet>
          <SheetTrigger aria-label="Open navigation" className="rounded-md p-2 hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-[var(--bg)] text-white border-[var(--ring)]">
            <SideNav />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid md:grid-cols-[260px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block min-h-screen sticky top-0 bg-[var(--bg)] text-white border-r border-[var(--ring)]">
          <SideNav />
        </aside>
        {/* Content */}
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  )
}