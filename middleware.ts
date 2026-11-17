import { NextRequest, NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/session"

// `/` is the only public product page. Sign-in, sign-up, and the auth API
// routes stay reachable so a session can be created. Every other matched
// request needs the access-token cookie; otherwise it redirects to /signin.
const PUBLIC_PAGES = new Set(["/", "/signin", "/signup"])

function isPublic(pathname: string) {
  if (PUBLIC_PAGES.has(pathname)) return true
  return pathname === "/api/auth" || pathname.startsWith("/api/auth/")
}

export function middleware(req: NextRequest) {
  if (isPublic(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const hasSession = req.cookies.has(ACCESS_TOKEN_COOKIE)
  if (!hasSession) {
    const signInUrl = new URL("/signin", req.url)
    return NextResponse.redirect(signInUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
