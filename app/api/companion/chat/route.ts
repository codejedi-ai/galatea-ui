import { NextRequest } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth/current-user"
import { ACCESS_TOKEN_COOKIE } from "@/lib/session"
import { getModelApiKey } from "@/lib/companion/credentials"
import {
  DEFAULT_PERSONA,
  companionEventsToUIMessageStreamResponse,
  loadPersonaFromBot,
  streamCompanion,
} from "@/lib/companion"

export const runtime = "nodejs"
export const maxDuration = 60

const uiMessage = z
  .object({
    role: z.string(),
    parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()).optional(),
    content: z.string().optional(),
  })
  .passthrough()

const conversationIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/)
const botIdSchema = z.string().min(1).max(128).optional()
const MAX_MESSAGE_CHARS = 8000

const bodySchema = z.union([
  // useChat payload
  z.object({ id: conversationIdSchema, messages: z.array(uiMessage).min(1).max(200), botId: botIdSchema }).passthrough(),
  // simple form
  z.object({ conversationId: conversationIdSchema, message: z.string().min(1), botId: botIdSchema }),
])

function lastUserText(messages: z.infer<typeof uiMessage>[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== "user") continue
    const fromParts = (m.parts ?? [])
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("")
    return (fromParts || m.content || "").trim()
  }
  return ""
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 })

  const raw = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return Response.json({ message: "Invalid request body" }, { status: 400 })

  const body = parsed.data
  const conversationId = "messages" in body ? body.id : body.conversationId
  const message = "messages" in body ? lastUserText(body.messages) : body.message.trim()
  if (!message) return Response.json({ message: "No user message provided" }, { status: 400 })
  if (message.length > MAX_MESSAGE_CHARS) return Response.json({ message: "Message too long" }, { status: 400 })

  if (!(await getModelApiKey(user.userId))) {
    return Response.json(
      { code: "missing_credential", kind: "ai_gateway", message: "No model key configured" },
      { status: 409 },
    )
  }

  let persona = DEFAULT_PERSONA
  if (body.botId) {
    const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
    const loaded = token ? await loadPersonaFromBot(body.botId, token) : null
    if (loaded) persona = loaded
  }

  return companionEventsToUIMessageStreamResponse(
    streamCompanion({
      userId: user.userId,
      conversationId,
      message,
      persona,
      actionPort: null,
      channel: "text",
      signal: req.signal,
    }),
  )
}
