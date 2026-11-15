// Session tokens live in httpOnly cookies, set directly by the
// app/api/auth/signin and app/api/auth/verify route handlers (see
// lib/galatea-server.ts's setSessionCookies) — never in localStorage, and
// never readable by client-side JS. That keeps them safe from XSS while
// still letting middleware.ts and the other API routes read them
// server-side.
export const ACCESS_TOKEN_COOKIE = "galatea_access_token"
export const REFRESH_TOKEN_COOKIE = "galatea_refresh_token"

export async function clearSession() {
  await fetch("/api/auth/signout", { method: "POST" })
}
