import { NextRequest, NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/session"

// Runs on the Next.js server before the page renders. Only guards the real,
// backend-wired /bots route — the dating pages (discover/dashboard/profile)
// are left exactly as they were (unauthenticated-accessible mock UI), not in
// scope here.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(ACCESS_TOKEN_COOKIE)
  if (!hasSession) {
    const signInUrl = new URL("/signin", req.url)
    return NextResponse.redirect(signInUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/bots/:path*", "/settings/:path*", "/companion/:path*", "/voice/:path*"],
}
