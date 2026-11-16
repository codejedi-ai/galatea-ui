import { getCurrentUser } from "@/lib/auth/current-user"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getCurrentUser()
  const body = user ? { signedIn: true, email: user.email } : { signedIn: false }
  return Response.json(body, { headers: { "Cache-Control": "no-store" } })
}
