import "server-only"
import { jsonSchema, tool, type ToolSet } from "ai"

export interface JsonSchemaObject {
  type: "object"
  properties?: Record<string, unknown>
  required?: string[]
  [k: string]: unknown
}

export interface ActionDescriptor {
  name: string
  description: string
  inputSchema: JsonSchemaObject
}

export interface ActionContext {
  userId: string
  conversationId: string
  signal?: AbortSignal
}

export type ActionResult = { ok: true; output: unknown } | { ok: false; error: string }

export interface ActionPort {
  readonly runtimeId: string
  listActions(ctx: ActionContext): Promise<ActionDescriptor[]>
  execute(action: string, input: unknown, ctx: ActionContext): Promise<ActionResult>
}

export type ActionPortResolver = (userId: string) => Promise<ActionPort | null>

/**
 * Map action descriptors to AI SDK tools WITHOUT `execute`: the model's tool
 * calls come back to the graph, which runs them through the ActionPort.
 */
export function actionsToAiTools(descriptors: ActionDescriptor[]): ToolSet {
  const tools: ToolSet = {}
  for (const d of descriptors) {
    tools[d.name] = tool({
      description: d.description,
      inputSchema: jsonSchema(d.inputSchema as Parameters<typeof jsonSchema>[0]),
    })
  }
  return tools
}
