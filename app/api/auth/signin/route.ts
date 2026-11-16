import { NextRequest, NextResponse } from "next/server"
import { callGalatea, galateaErrorResponse, setSessionCookies } from "@/lib/galatea-server"
import { checkTestCredentials, createTestSessionToken, TEST_SESSION_MAX_AGE } from "@/lib/auth/test-login"

interface SignInResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// -> galatea.v1.AuthService/SignIn. The other of the two routes that
// establishes a session (see also verify/route.ts).
export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = (await req.json()) ?? {}
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  const { email, password } = body

  // Development-only test login (never enabled on Vercel / production by default).
  if (checkTestCredentials(email, password)) {
    const token = createTestSessionToken()
    const res = NextResponse.json({ ok: true })
    setSessionCookies(res, token, token, TEST_SESSION_MAX_AGE)
    return res
  }

  try {
    const data = await callGalatea<SignInResponse>("galatea.v1.AuthService/SignIn", { email, password })
    const res = NextResponse.json({ ok: true })
    setSessionCookies(res, data.accessToken, data.refreshToken, data.expiresIn)
    return res
  } catch (err) {
    return galateaErrorResponse(err)
  }
}
