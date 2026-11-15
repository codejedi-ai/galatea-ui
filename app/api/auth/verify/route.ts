import { NextRequest, NextResponse } from "next/server"
import { callGalatea, galateaErrorResponse, setSessionCookies } from "@/lib/galatea-server"

interface VerifyResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// -> galatea.v1.AuthService/Verify. On success this is one of the two places
// (with signin) that actually establishes a session, so it sets the httpOnly
// cookies itself rather than handing tokens back to the client.
export async function POST(req: NextRequest) {
  const { type, email, token } = await req.json()
  try {
    const data = await callGalatea<VerifyResponse>("galatea.v1.AuthService/Verify", { type, email, token })
    const res = NextResponse.json({ ok: true })
    setSessionCookies(res, data.accessToken, data.refreshToken, data.expiresIn)
    return res
  } catch (err) {
    return galateaErrorResponse(err)
  }
}
