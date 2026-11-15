import "server-only"

export { streamCompanion, invokeCompanion, getConversationMessages } from "./stream"
export { CompanionConfigError } from "./types"
export type { CompanionChannel, Persona, CompanionTurnInput, CompanionEvent } from "./types"
export type {
  JsonSchemaObject,
  ActionDescriptor,
  ActionContext,
  ActionResult,
  ActionPort,
  ActionPortResolver,
} from "./action-port"
export type { MemoryStore } from "./memory"
export { DEFAULT_PERSONA, buildSystemPrompt, loadPersonaFromBot, personaFromBot } from "./persona"
export { companionEventsToUIMessageStreamResponse } from "./ui-stream"
