// components/Layout.tsx (legacy wrapper; simplified to avoid conflicting sidebar APIs)
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
return (
 <div className="min-h-screen bg-slate-50">
{/* Invisible border + smaller top padding on mobile */}
 <main className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 pt-2 md:pt-6 pb-8">
{children}
</main>
  </div>
);
}