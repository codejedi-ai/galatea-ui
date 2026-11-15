import { NextRequest } from "next/server"
import { callGalatea, galateaErrorResponse } from "@/lib/galatea-server"

// -> galatea.v1.AuthService/SignUp. GoTrue requires email confirmation
// before a session exists, so this intentionally does not set any cookies —
// the client follows up with /api/auth/verify once the user has the code.
export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  try {
    const data = await callGalatea("galatea.v1.AuthService/SignUp", { email, password })
    return Response.json(data)
  } catch (err) {
    return galateaErrorResponse(err)
  }
}
