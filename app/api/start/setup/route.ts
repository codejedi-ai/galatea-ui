import { getCurrentUser } from "@/lib/auth/current-user"
import { getCredentialStatus } from "@/lib/companion/credentials"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const headers = { "Cache-Control": "no-store" }

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401, headers })
  const { aiGateway } = await getCredentialStatus(user.userId)
  return Response.json({ modelKeyConfigured: aiGateway }, { headers })
}
