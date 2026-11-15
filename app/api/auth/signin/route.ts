import { NextRequest, NextResponse } from "next/server"
import { callGalatea, galateaErrorResponse, setSessionCookies } from "@/lib/galatea-server"

interface SignInResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// -> galatea.v1.AuthService/SignIn. The other of the two routes that
// establishes a session (see also verify/route.ts).
export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  try {
    const data = await callGalatea<SignInResponse>("galatea.v1.AuthService/SignIn", { email, password })
    const res = NextResponse.json({ ok: true })
    setSessionCookies(res, data.accessToken, data.refreshToken, data.expiresIn)
    return res
  } catch (err) {
    return galateaErrorResponse(err)
  }
}
