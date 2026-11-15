// Server-only helper for calling galatea_server's Connect RPCs as plain JSON
// POSTs. Only ever imported from app/api/**/route.ts and middleware.ts — the
// browser never talks to the Go server directly, and never sees this file.
import { NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/session"

const GALATEA_SERVER_URL = process.env.GALATEA_SERVER_URL ?? "http://localhost:8080"

// Shared by app/api/auth/signin and app/api/auth/verify, the only two Go
// calls that hand back a session.
export function setSessionCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresIn?: number,
) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  }
  res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, { ...cookieOptions, maxAge: expiresIn ?? 3600 })
  res.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 })
}

export class GalateaError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// method is the Connect RPC path, e.g. "galatea.v1.AuthService/SignIn".
export async function callGalatea<T>(method: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const resp = await fetch(`${GALATEA_SERVER_URL}/${method}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    throw new GalateaError(data.message ?? "Request to galatea_server failed", resp.status)
  }
  return data as T
}

export function galateaErrorResponse(err: unknown) {
  if (err instanceof GalateaError) {
    return Response.json({ message: err.message }, { status: err.status })
  }
  return Response.json({ message: "Unexpected error" }, { status: 500 })
}
