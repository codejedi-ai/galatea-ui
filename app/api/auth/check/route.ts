import { NextRequest } from "next/server"
import { callGalatea, galateaErrorResponse } from "@/lib/galatea-server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/session"

interface CheckResponse {
  userId: string
  email: string
  sessionId: string
}

// -> galatea.v1.AuthService/Check. Lets client components ask "am I signed
// in, and as whom" without ever handling the token themselves.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) {
    return Response.json({ message: "not signed in" }, { status: 401 })
  }
  try {
    const data = await callGalatea<CheckResponse>("galatea.v1.AuthService/Check", {}, token)
    return Response.json(data)
  } catch (err) {
    return galateaErrorResponse(err)
  }
}
