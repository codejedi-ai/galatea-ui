import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { MockLanguageModelV4 } from "ai/test"
import {
  getConversationMessages,
  invokeCompanion,
  streamCompanion,
  CompanionConfigError,
} from "../index"
import { MAX_TOOL_STEPS } from "../graph"
import { getCheckpointer } from "../checkpointer"
import { getModelApiKey } from "../credentials"
import { __setModelResolverForTests } from "../stream"
import { buildSystemPrompt, DEFAULT_PERSONA } from "../persona"
import { actionsToAiTools } from "../action-port"
import { collect, fakePort, promptText, scriptedModel, uid, useModel } from "./helpers"

const savedKey = process.env.AI_GATEWAY_API_KEY
beforeEach(() => {
  __setModelResolverForTests(null)
})
afterEach(() => {
  __setModelResolverForTests(null)
  if (savedKey === undefined) delete process.env.AI_GATEWAY_API_KEY
  else process.env.AI_GATEWAY_API_KEY = savedKey
})

describe("companion graph", () => {
  it("1. simple turn streams deltas in order then finishes with joined text", async () => {
    useModel(scriptedModel([{ text: ["Hel", "lo ", "there"] }]))
    const events = await collect(streamCompanion({ userId: uid(), conversationId: "c", message: "hi" }))
    const deltas = events.filter((e) => e.type === "text-delta").map((e: any) => e.delta)
    expect(deltas).toEqual(["Hel", "lo ", "there"])
    const last = events[events.length - 1]
    expect(last).toMatchObject({ type: "finish", text: "Hello there" })
    expect(events.findIndex((e) => e.type === "finish")).toBe(events.length - 1)
  })

  it("2. tool loop executes via ActionPort and feeds the result back", async () => {
    const model = scriptedModel([
      { text: ["Checking. "], toolCalls: [{ id: "tc1", name: "do_thing", input: { x: "1" } }] },
      { text: ["All done"] },
    ])
    useModel(model)
    const { port, calls } = fakePort({ ok: true, output: { value: 42 } })
    const userId = uid()
    const events = await collect(
      streamCompanion({ userId, conversationId: "c", message: "do it", actionPort: port }),
    )
    expect(calls).toHaveLength(1)
    expect(calls[0].action).toBe("do_thing")
    expect(calls[0].input).toEqual({ x: "1" })
    expect(calls[0].ctx).toMatchObject({ userId, conversationId: "c" })
    expect(events.map((e) => e.type)).toEqual(["text-delta", "tool-call", "tool-result", "text-delta", "finish"])
    expect(events.find((e) => e.type === "tool-result")).toMatchObject({ output: { value: 42 }, action: "do_thing" })
    expect(events[events.length - 1]).toMatchObject({ type: "finish", text: "Checking. All done" })
    // result was fed back into the second model call
    expect(model.doStreamCalls).toHaveLength(2)
    expect(promptText(model.doStreamCalls[1] as any)).toContain("42")
    expect(model.doStreamCalls[0].tools?.length).toBe(1)
  })

  it("3. null actionPort -> model called without tools", async () => {
    const model = scriptedModel([{ text: ["ok"] }])
    useModel(model)
    await collect(streamCompanion({ userId: uid(), conversationId: "c", message: "hi", actionPort: null }))
    expect(model.doStreamCalls).toHaveLength(1)
    expect(model.doStreamCalls[0].tools ?? []).toHaveLength(0)
  })

  it("4. always-tool-calling model stops at MAX_TOOL_STEPS and still finishes", async () => {
    const model = scriptedModel([{ toolCalls: [{ id: "tc", name: "do_thing", input: { x: "1" } }] }])
    useModel(model)
    const { port, calls } = fakePort()
    const events = await collect(
      streamCompanion({ userId: uid(), conversationId: "c", message: "loop", actionPort: port }),
    )
    expect(calls).toHaveLength(MAX_TOOL_STEPS)
    expect(model.doStreamCalls).toHaveLength(MAX_TOOL_STEPS + 1)
    // the final call is offered no tools
    expect(model.doStreamCalls[MAX_TOOL_STEPS].tools ?? []).toHaveLength(0)
    expect(events[events.length - 1].type).toBe("finish")
  })

  it("5. ActionResult ok:false -> tool-result isError and the turn finishes", async () => {
    useModel(
      scriptedModel([
        { toolCalls: [{ id: "tc1", name: "do_thing", input: { x: "1" } }] },
        { text: ["Sorry, that failed"] },
      ]),
    )
    const { port } = fakePort({ ok: false, error: "nope" })
    const events = await collect(streamCompanion({ userId: uid(), conversationId: "c", message: "x", actionPort: port }))
    expect(events.find((e) => e.type === "tool-result")).toMatchObject({ isError: true, output: "nope" })
    expect(events[events.length - 1]).toMatchObject({ type: "finish", text: "Sorry, that failed" })
  })

  it("6. missing credential: invoke throws, stream yields error event", async () => {
    delete process.env.AI_GATEWAY_API_KEY
    const input = { userId: uid(), conversationId: "c", message: "hi" }
    await expect(invokeCompanion(input)).rejects.toBeInstanceOf(CompanionConfigError)
    const events = await collect(streamCompanion(input))
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: "error", code: "missing_credential" })
  })

  it("7. thread isolation between users with the same conversationId", async () => {
    useModel(scriptedModel([{ text: ["a"] }]))
    const A = uid("A")
    const B = uid("B")
    await collect(streamCompanion({ userId: A, conversationId: "same", message: "secret-from-A" }))
    await collect(streamCompanion({ userId: B, conversationId: "same", message: "hello-from-B" }))
    const a = await getConversationMessages(A, "same")
    const b = await getConversationMessages(B, "same")
    expect(JSON.stringify(a)).toContain("secret-from-A")
    expect(JSON.stringify(b)).not.toContain("secret-from-A")
    expect(b[0]).toEqual({ role: "user", text: "hello-from-B" })
  })

  it("8. second turn on the same thread includes prior messages", async () => {
    const model = scriptedModel([{ text: ["first reply"] }, { text: ["second reply"] }])
    useModel(model)
    const userId = uid()
    await collect(streamCompanion({ userId, conversationId: "c", message: "first question" }))
    await collect(streamCompanion({ userId, conversationId: "c", message: "second question" }))
    const prompt = promptText(model.doStreamCalls[1] as any)
    expect(prompt).toContain("first question")
    expect(prompt).toContain("first reply")
    expect(prompt).toContain("second question")
    expect(await getConversationMessages(userId, "c")).toEqual([
      { role: "user", text: "first question" },
      { role: "assistant", text: "first reply" },
      { role: "user", text: "second question" },
      { role: "assistant", text: "second reply" },
    ])
  })

  it("9. checkpoints do not contain the API key", async () => {
    const SECRET = "sk-test-SECRET-9f8e7d"
    process.env.AI_GATEWAY_API_KEY = SECRET
    __setModelResolverForTests(async (userId) => {
      const key = await getModelApiKey(userId)
      expect(key).toBe(SECRET)
      // key lives only in the model closure / configurable, never in state
      const model = scriptedModel([{ text: ["hi"] }]) as MockLanguageModelV4 & { _key?: string }
      model._key = key!
      return model
    })
    const userId = uid()
    await collect(streamCompanion({ userId, conversationId: "c", message: "hello" }))
    const tuples: unknown[] = []
    for await (const t of getCheckpointer().list({ configurable: { thread_id: `${userId}:c` } })) tuples.push(t)
    expect(tuples.length).toBeGreaterThan(0)
    expect(JSON.stringify(tuples)).not.toContain(SECRET)
  })

  it("10. voice channel adds speakable instruction to system prompt", async () => {
    const model = scriptedModel([{ text: ["ok"] }])
    useModel(model)
    await collect(streamCompanion({ userId: uid(), conversationId: "v", message: "hi", channel: "voice" }))
    expect(promptText(model.doStreamCalls[0] as any)).toMatch(/speakable/i)
    expect(buildSystemPrompt(DEFAULT_PERSONA, [], "text")).not.toMatch(/speakable/i)
    expect(buildSystemPrompt(DEFAULT_PERSONA, [], "voice")).toMatch(/no markdown/i)
  })

  it("12. abort ends with error aborted", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () =>
        ({
          stream: new ReadableStream({
            start(c) {
              c.enqueue({ type: "stream-start", warnings: [] })
              c.enqueue({ type: "text-start", id: "t" })
              c.enqueue({ type: "text-delta", id: "t", delta: "partial" })
              // never closes
            },
          }),
        }) as any,
    })
    useModel(model)
    const ac = new AbortController()
    const events: any[] = []
    for await (const e of streamCompanion({ userId: uid(), conversationId: "c", message: "hi", signal: ac.signal })) {
      events.push(e)
      if (e.type === "text-delta") ac.abort()
    }
    expect(events[events.length - 1]).toMatchObject({ type: "error", code: "aborted" })
  }, 10_000)

  it("model errors map to model_error", async () => {
    useModel(
      new MockLanguageModelV4({
        doStream: async () => {
          throw new Error("provider exploded")
        },
      }),
    )
    const events = await collect(streamCompanion({ userId: uid(), conversationId: "c", message: "hi" }))
    expect(events[events.length - 1]).toMatchObject({ type: "error", code: "model_error" })
  })

  it("actionsToAiTools maps descriptors without execute", () => {
    const tools = actionsToAiTools([
      { name: "a", description: "d", inputSchema: { type: "object", properties: {} } },
    ])
    expect(Object.keys(tools)).toEqual(["a"])
    expect((tools.a as any).execute).toBeUndefined()
  })
})
