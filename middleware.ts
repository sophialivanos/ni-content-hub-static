// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  // Allow embedding from Google Sites
  res.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://sites.google.com https://*.google.com https://*.googleusercontent.com;"
  );
  // Remove any upstream X-Frame-Options
  res.headers.delete("x-frame-options");
  res.headers.delete("X-Frame-Options");
  return res;
}

// run for everything except static assets/images
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};