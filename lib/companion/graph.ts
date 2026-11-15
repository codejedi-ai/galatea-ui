import "server-only"
import { Annotation, END, START, StateGraph, type BaseCheckpointSaver, type LangGraphRunnableConfig } from "@langchain/langgraph"
import { streamText, type LanguageModel, type ModelMessage, type ToolSet } from "ai"
import { actionsToAiTools, type ActionPort } from "./action-port"
import type { MemoryStore } from "./memory"
import { buildSystemPrompt } from "./persona"
import type { CompanionChannel, CompanionEvent, Persona } from "./types"

export const MAX_TOOL_STEPS = 5
const MAX_TOOL_OUTPUT_CHARS = 8 * 1024

/**
 * Per-run, NON-checkpointed values. They are passed as `config.configurable`
 * and must never be copied into graph state (state is checkpointed).
 */
export interface CompanionConfigurable {
  model: LanguageModel
  actionPort?: ActionPort | null
  signal?: AbortSignal
  /** Fallback event sink used only if `config.writer` is unavailable. */
  emit?: (event: CompanionEvent) => void
  [k: string]: unknown
}

interface PendingToolCall {
  toolCallId: string
  toolName: string
  input: unknown
}

const replace = <T,>(_: T, b: T) => b

const CompanionState = Annotation.Root({
  messages: Annotation<ModelMessage[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  // Transient per-turn fields (non-secret; reset by loadContext).
  userId: Annotation<string>({ reducer: replace, default: () => "" }),
  conversationId: Annotation<string>({ reducer: replace, default: () => "" }),
  persona: Annotation<Persona>({ reducer: replace, default: () => ({ id: "", name: "" }) }),
  channel: Annotation<CompanionChannel>({ reducer: replace, default: () => "text" as CompanionChannel }),
  userMessage: Annotation<string>({ reducer: replace, default: () => "" }),
  memories: Annotation<string[]>({ reducer: replace, default: () => [] }),
  system: Annotation<string>({ reducer: replace, default: () => "" }),
  steps: Annotation<number>({ reducer: replace, default: () => 0 }),
  turnText: Annotation<string>({ reducer: replace, default: () => "" }),
  pendingToolCalls: Annotation<PendingToolCall[]>({ reducer: replace, default: () => [] }),
  usage: Annotation<{ inputTokens?: number; outputTokens?: number }>({ reducer: replace, default: () => ({}) }),
})

type State = typeof CompanionState.State

function getEmit(config: LangGraphRunnableConfig): (e: CompanionEvent) => void {
  const writer = (config as { writer?: (chunk: unknown) => void }).writer
  if (typeof writer === "function") return (e) => writer(e)
  const emit = (config.configurable as CompanionConfigurable | undefined)?.emit
  return emit ?? (() => {})
}

function cfg(config: LangGraphRunnableConfig): CompanionConfigurable {
  return (config.configurable ?? {}) as CompanionConfigurable
}

function capOutput(output: unknown): unknown {
  let json: string
  try {
    json = JSON.stringify(output ?? null) ?? "null"
  } catch {
    json = JSON.stringify(String(output))
  }
  if (json.length <= MAX_TOOL_OUTPUT_CHARS) return JSON.parse(json)
  return { truncated: true, preview: json.slice(0, MAX_TOOL_OUTPUT_CHARS) }
}

function sum(a?: number, b?: number) {
  return a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0)
}

export function buildCompanionGraph({
  checkpointer,
  memory,
}: {
  checkpointer: BaseCheckpointSaver
  memory: MemoryStore
}) {
  const loadContext = async (state: State) => {
    const memories = await memory.recall(state.userId, state.persona.id, state.userMessage).catch(() => [])
    return {
      memories,
      system: buildSystemPrompt(state.persona, memories, state.channel),
      steps: 0,
      turnText: "",
      pendingToolCalls: [] as PendingToolCall[],
      usage: {},
    }
  }

  const respond = async (state: State, config: LangGraphRunnableConfig) => {
    const { model, actionPort, signal } = cfg(config)
    const emit = getEmit(config)
    const ctx = { userId: state.userId, conversationId: state.conversationId, signal }

    let tools: ToolSet | undefined
    if (actionPort && state.steps < MAX_TOOL_STEPS) {
      const descriptors = await actionPort.listActions(ctx)
      if (descriptors.length > 0) tools = actionsToAiTools(descriptors)
    }

    const result = streamText({
      model,
      instructions: state.system,
      messages: state.messages,
      ...(tools ? { tools } : {}),
      abortSignal: signal,
    })

    let text = ""
    const toolCalls: PendingToolCall[] = []
    let usage = state.usage
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        text += part.text
        emit({ type: "text-delta", delta: part.text })
      } else if (part.type === "tool-call") {
        if (!tools) continue // no tools offered: ignore stray calls
        toolCalls.push({ toolCallId: part.toolCallId, toolName: part.toolName, input: part.input })
        emit({ type: "tool-call", toolCallId: part.toolCallId, action: part.toolName, input: part.input })
      } else if (part.type === "error") {
        throw part.error instanceof Error ? part.error : new Error(String(part.error))
      } else if (part.type === "abort") {
        const e = new Error("aborted")
        e.name = "AbortError"
        throw e
      } else if (part.type === "finish") {
        usage = {
          inputTokens: sum(usage.inputTokens, part.totalUsage?.inputTokens),
          outputTokens: sum(usage.outputTokens, part.totalUsage?.outputTokens),
        }
      }
    }

    const content: Array<
      { type: "text"; text: string } | { type: "tool-call"; toolCallId: string; toolName: string; input: unknown }
    > = []
    if (text) content.push({ type: "text", text })
    for (const c of toolCalls) content.push({ type: "tool-call", ...c })

    return {
      ...(content.length > 0 ? { messages: [{ role: "assistant", content } as ModelMessage] } : {}),
      steps: state.steps + 1,
      turnText: state.turnText + text,
      pendingToolCalls: toolCalls,
      usage,
    }
  }

  const act = async (state: State, config: LangGraphRunnableConfig) => {
    const { actionPort, signal } = cfg(config)
    const emit = getEmit(config)
    const ctx = { userId: state.userId, conversationId: state.conversationId, signal }
    const results: Array<{
      type: "tool-result"
      toolCallId: string
      toolName: string
      output: { type: "json"; value: never } | { type: "error-text"; value: string }
    }> = []

    for (const call of state.pendingToolCalls) {
      if (signal?.aborted) {
        const e = new Error("aborted")
        e.name = "AbortError"
        throw e
      }
      let ok = false
      let output: unknown
      let error = ""
      try {
        const res = await actionPort!.execute(call.toolName, call.input, ctx)
        if (res.ok) {
          ok = true
          output = capOutput(res.output)
        } else {
          error = res.error
        }
      } catch (err) {
        error = err instanceof Error ? err.message : "Action failed"
      }
      if (ok) {
        emit({ type: "tool-result", toolCallId: call.toolCallId, action: call.toolName, output })
        results.push({
          type: "tool-result",
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          output: { type: "json", value: output as never },
        })
      } else {
        emit({ type: "tool-result", toolCallId: call.toolCallId, action: call.toolName, output: error, isError: true })
        results.push({
          type: "tool-result",
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          output: { type: "error-text", value: error },
        })
      }
    }
    return { messages: [{ role: "tool", content: results } as ModelMessage], pendingToolCalls: [] as PendingToolCall[] }
  }

  const remember = async (state: State) => {
    if (state.turnText) {
      await memory
        .remember(state.userId, state.persona.id, { user: state.userMessage, assistant: state.turnText })
        .catch(() => {})
    }
    return {}
  }

  return new StateGraph(CompanionState)
    .addNode("loadContext", loadContext)
    .addNode("respond", respond)
    .addNode("act", act)
    .addNode("remember", remember)
    .addEdge(START, "loadContext")
    .addEdge("loadContext", "respond")
    .addConditionalEdges(
      "respond",
      (state: State, config: LangGraphRunnableConfig) =>
        state.pendingToolCalls.length > 0 && cfg(config).actionPort ? "act" : "remember",
      { act: "act", remember: "remember" },
    )
    .addEdge("act", "respond")
    .addEdge("remember", END)
    .compile({ checkpointer })
}

export type CompanionGraph = ReturnType<typeof buildCompanionGraph>
