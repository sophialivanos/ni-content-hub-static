// components/Layout.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useRouter();

  const Nav = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md font-semibold ${
        pathname === href
          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr]">
      <aside className="border-r border-slate-200 bg-slate-100 p-4 sticky top-0 h-screen">
        <div className="text-xl font-extrabold mb-3">Content Hub</div>
        <nav className="flex flex-col gap-2">
          <Nav href="/" label="Welcome" />
          <Nav href="/events" label="Events" />
          <Nav href="/articles" label="Article Creation" />
        </nav>
      </aside>
      <main className="p-6 max-w-5xl">{children}</main>
    </div>
  );
}