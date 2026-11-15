import { NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/session"

// No corresponding Go RPC (AuthService has no SignOut/Logout method) —
// signing out is purely a matter of dropping the local session cookies.
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ACCESS_TOKEN_COOKIE)
  res.cookies.delete(REFRESH_TOKEN_COOKIE)
  return res
}
