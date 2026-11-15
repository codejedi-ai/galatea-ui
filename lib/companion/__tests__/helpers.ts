import { MockLanguageModelV4 } from "ai/test"
import type { ActionPort, ActionResult } from "../action-port"
import { __setModelResolverForTests } from "../stream"
import type { CompanionEvent } from "../types"

type Step = { text?: string[]; toolCalls?: Array<{ id: string; name: string; input: unknown }> }

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 2, text: 2, reasoning: undefined },
}

function streamFor(step: Step) {
  const chunks: any[] = [{ type: "stream-start", warnings: [] }]
  if (step.text) {
    chunks.push({ type: "text-start", id: "t" })
    for (const d of step.text) chunks.push({ type: "text-delta", id: "t", delta: d })
    chunks.push({ type: "text-end", id: "t" })
  }
  for (const c of step.toolCalls ?? []) {
    chunks.push({ type: "tool-call", toolCallId: c.id, toolName: c.name, input: JSON.stringify(c.input) })
  }
  chunks.push({
    type: "finish",
    usage,
    finishReason: { unified: step.toolCalls?.length ? "tool-calls" : "stop", raw: undefined },
  })
  return new ReadableStream({
    start(c) {
      for (const ch of chunks) c.enqueue(ch)
      c.close()
    },
  })
}

/** Scripted model: call N uses steps[min(N, last)]. */
export function scriptedModel(steps: Step[]) {
  let i = 0
  return new MockLanguageModelV4({
    doStream: async () => ({ stream: streamFor(steps[Math.min(i++, steps.length - 1)]) }) as any,
  })
}

export function useModel(model: MockLanguageModelV4) {
  __setModelResolverForTests(async () => model)
}

export async function collect(it: AsyncIterable<CompanionEvent>) {
  const out: CompanionEvent[] = []
  for await (const e of it) out.push(e)
  return out
}

export function fakePort(result: ActionResult | ((a: string, i: unknown) => ActionResult) = { ok: true, output: { done: true } }) {
  const calls: Array<{ action: string; input: unknown; ctx: unknown }> = []
  const port: ActionPort = {
    runtimeId: "fake",
    async listActions() {
      return [
        {
          name: "do_thing",
          description: "Does a thing",
          inputSchema: { type: "object", properties: { x: { type: "string" } }, required: ["x"] },
        },
      ]
    },
    async execute(action, input, ctx) {
      calls.push({ action, input, ctx })
      return typeof result === "function" ? result(action, input) : result
    },
  }
  return { port, calls }
}

let n = 0
export const uid = (p = "u") => `${p}-${++n}-${Math.random().toString(36).slice(2, 8)}`

export function promptText(call: { prompt: any[] }) {
  return JSON.stringify(call.prompt)
}
