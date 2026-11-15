import type { ActionPort } from "./action-port"

export type CompanionChannel = "text" | "voice"

export interface Persona {
  id: string
  name: string
  description?: string
  systemPrompt?: string
  greeting?: string
}

export interface CompanionTurnInput {
  userId: string
  conversationId: string
  message: string
  persona?: Persona
  actionPort?: ActionPort | null
  channel?: CompanionChannel
  modelOverride?: string
  signal?: AbortSignal
}

export type CompanionEvent =
  | { type: "text-delta"; delta: string }
  | { type: "tool-call"; toolCallId: string; action: string; input: unknown }
  | { type: "tool-result"; toolCallId: string; action: string; output: unknown; isError?: boolean }
  | { type: "finish"; text: string; usage?: { inputTokens?: number; outputTokens?: number } }
  | {
      type: "error"
      code: "missing_credential" | "model_error" | "action_error" | "aborted"
      message: string
    }

export class CompanionConfigError extends Error {
  code = "missing_credential" as const
  kind: string
  constructor(message: string, kind = "ai_gateway") {
    super(message)
    this.name = "CompanionConfigError"
    this.kind = kind
  }
}
