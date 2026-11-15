import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getConversationMessages } from "@/lib/companion"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 })
  const { conversationId } = await params
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(conversationId)) {
    return Response.json({ message: "Invalid conversation id" }, { status: 400 })
  }
  const messages = await getConversationMessages(user.userId, conversationId)
  return Response.json({ messages })
}
