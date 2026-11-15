import "server-only"
import type { LanguageModel } from "ai"
import { getCheckpointer } from "./checkpointer"
import { buildCompanionGraph, type CompanionGraph, type CompanionConfigurable } from "./graph"
import { defaultMemory } from "./memory"
import { resolveCompanionModel } from "./model"
import { DEFAULT_PERSONA } from "./persona"
import { CompanionConfigError, type CompanionEvent, type CompanionTurnInput } from "./types"

type ModelResolver = (userId: string, modelOverride?: string) => Promise<LanguageModel>

let modelResolver: ModelResolver = resolveCompanionModel

/** INTERNAL: tests inject a mock model. Not part of the public barrel. Pass null to restore. */
export function __setModelResolverForTests(resolver: ModelResolver | null) {
  modelResolver = resolver ?? resolveCompanionModel
}

const g = globalThis as unknown as { __companionGraph?: CompanionGraph }
function getGraph(): CompanionGraph {
  return (g.__companionGraph ??= buildCompanionGraph({ checkpointer: getCheckpointer(), memory: defaultMemory }))
}

const threadId = (userId: string, conversationId: string) => `${userId}:${conversationId}`

function isAbort(err: unknown, signal?: AbortSignal) {
  return !!signal?.aborted || (err instanceof Error && (err.name === "AbortError" || err.name === "ResponseAborted"))
}

export async function* streamCompanion(input: CompanionTurnInput): AsyncGenerator<CompanionEvent> {
  const { userId, conversationId, message, signal } = input
  let model: LanguageModel
  try {
    model = await modelResolver(userId, input.modelOverride)
  } catch (err) {
    if (err instanceof CompanionConfigError) {
      yield { type: "error", code: "missing_credential", message: err.message }
      return
    }
    yield { type: "error", code: "model_error", message: err instanceof Error ? err.message : "Model error" }
    return
  }

  const configurable: CompanionConfigurable = {
    thread_id: threadId(userId, conversationId),
    model,
    actionPort: input.actionPort ?? null,
    signal,
  }

  let finalText = ""
  try {
    if (signal?.aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" })
    const graph = getGraph()
    const stream = await graph.stream(
      {
        messages: [{ role: "user", content: message }],
        userId,
        conversationId,
        persona: input.persona ?? DEFAULT_PERSONA,
        channel: input.channel ?? "text",
        userMessage: message,
      },
      { configurable, streamMode: "custom", signal },
    )
    for await (const chunk of stream) {
      const ev = chunk as CompanionEvent
      if (ev.type === "text-delta") finalText += ev.delta
      yield ev
    }
    const state = await graph.getState({ configurable: { thread_id: threadId(userId, conversationId) } })
    const usage = (state.values as { usage?: { inputTokens?: number; outputTokens?: number } }).usage
    yield { type: "finish", text: finalText, ...(usage && Object.keys(usage).length ? { usage } : {}) }
  } catch (err) {
    if (isAbort(err, signal)) {
      yield { type: "error", code: "aborted", message: "Request aborted" }
    } else {
      yield { type: "error", code: "model_error", message: err instanceof Error ? err.message : "Model error" }
    }
  }
}

export async function invokeCompanion(input: CompanionTurnInput): Promise<{ text: string; events: CompanionEvent[] }> {
  const events: CompanionEvent[] = []
  for await (const ev of streamCompanion(input)) {
    if (ev.type === "error" && ev.code === "missing_credential") throw new CompanionConfigError(ev.message)
    events.push(ev)
  }
  const fin = events.find((e) => e.type === "finish")
  return { text: fin && fin.type === "finish" ? fin.text : "", events }
}

export async function getConversationMessages(
  userId: string,
  conversationId: string,
): Promise<Array<{ role: "user" | "assistant"; text: string }>> {
  const state = await getGraph().getState({ configurable: { thread_id: threadId(userId, conversationId) } })
  const messages = ((state.values as { messages?: Array<{ role: string; content: unknown }> }).messages ?? [])
  const out: Array<{ role: "user" | "assistant"; text: string }> = []
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") continue
    const text =
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content
              .filter((p): p is { type: "text"; text: string } => p?.type === "text" && typeof p.text === "string")
              .map((p) => p.text)
              .join("")
          : ""
    if (!text) continue
    out.push({ role: m.role, text })
  }
  return out
}
