import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const getCurrentUser = vi.fn()
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: () => getCurrentUser() }))

import { POST } from "../chat/route"
import { GET } from "../conversations/[conversationId]/route"
import { __setModelResolverForTests } from "@/lib/companion/stream"
import { scriptedModel, uid, useModel } from "@/lib/companion/__tests__/helpers"

const savedKey = process.env.AI_GATEWAY_API_KEY
const req = (body: unknown) =>
  new NextRequest("http://localhost/api/companion/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })

beforeEach(() => {
  getCurrentUser.mockReset()
})
afterEach(() => {
  __setModelResolverForTests(null)
  if (savedKey === undefined) delete process.env.AI_GATEWAY_API_KEY
  else process.env.AI_GATEWAY_API_KEY = savedKey
})

describe("POST /api/companion/chat", () => {
  it("401 without a session", async () => {
    getCurrentUser.mockResolvedValue(null)
    const res = await POST(req({ conversationId: "c", message: "hi" }))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ message: "Unauthorized" })
  })

  it("400 on bad body", async () => {
    getCurrentUser.mockResolvedValue({ userId: "u" })
    expect((await POST(req({ nope: true }))).status).toBe(400)
    expect((await POST(req("not json"))).status).toBe(400)
    expect((await POST(req({ id: "c", messages: [{ role: "assistant", parts: [] }] }))).status).toBe(400)
  })

  it("409 when no model key is configured", async () => {
    delete process.env.AI_GATEWAY_API_KEY
    getCurrentUser.mockResolvedValue({ userId: "u" })
    const res = await POST(req({ conversationId: "c", message: "hi" }))
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      code: "missing_credential",
      kind: "ai_gateway",
      message: "No model key configured",
    })
  })

  it("200 streams UI message events for a useChat payload", async () => {
    process.env.AI_GATEWAY_API_KEY = "test-key"
    const userId = uid()
    getCurrentUser.mockResolvedValue({ userId })
    const model = scriptedModel([{ text: ["Hey ", "you"] }])
    useModel(model)
    const res = await POST(
      req({ id: "conv1", messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: "hello bot" }] }] }),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/event-stream")
    const body = await res.text()
    expect(body).toContain('"type":"text-delta"')
    expect(body).toContain("Hey ")
    expect(JSON.stringify(model.doStreamCalls[0].prompt)).toContain("hello bot")

    const hist = await GET(new NextRequest("http://localhost/x"), { params: Promise.resolve({ conversationId: "conv1" }) })
    expect(await hist.json()).toEqual({
      messages: [
        { role: "user", text: "hello bot" },
        { role: "assistant", text: "Hey you" },
      ],
    })
  })

  it("400 on over-long message, accepts 8000", async () => {
    getCurrentUser.mockResolvedValue({ userId: "u" })
    const long = "x".repeat(8001)
    const a = await POST(req({ conversationId: "c", message: long }))
    expect(a.status).toBe(400)
    expect(await a.json()).toEqual({ message: "Message too long" })
    const b = await POST(req({ id: "c", messages: [{ role: "user", parts: [{ type: "text", text: long }] }] }))
    expect(b.status).toBe(400)
    expect(await b.json()).toEqual({ message: "Message too long" })
  })

  it("400 on invalid conversation id or oversized arrays", async () => {
    getCurrentUser.mockResolvedValue({ userId: "u" })
    for (const id of ["a:b", "x".repeat(200), "a b"]) {
      expect((await POST(req({ conversationId: id, message: "hi" }))).status).toBe(400)
      expect((await POST(req({ id, messages: [{ role: "user", content: "hi" }] }))).status).toBe(400)
      const g = await GET(new NextRequest("http://localhost/x"), { params: Promise.resolve({ conversationId: id }) })
      expect(g.status).toBe(400)
    }
    const many = Array.from({ length: 201 }, () => ({ role: "user", content: "hi" }))
    expect((await POST(req({ id: "c", messages: many }))).status).toBe(400)
    expect((await POST(req({ conversationId: "c", message: "hi", botId: "b".repeat(129) }))).status).toBe(400)
  })

  it("accepts a randomUUID conversation id", async () => {
    process.env.AI_GATEWAY_API_KEY = "test-key"
    getCurrentUser.mockResolvedValue({ userId: uid() })
    useModel(scriptedModel([{ text: ["ok"] }]))
    const id = crypto.randomUUID()
    const res = await POST(req({ id, messages: [{ role: "user", parts: [{ type: "text", text: "hi" }] }] }))
    expect(res.status).toBe(200)
    await res.text()
    const g = await GET(new NextRequest("http://localhost/x"), { params: Promise.resolve({ conversationId: id }) })
    expect(g.status).toBe(200)
  })

  it("conversations GET is 401 without a session", async () => {
    getCurrentUser.mockResolvedValue(null)
    const res = await GET(new NextRequest("http://localhost/x"), { params: Promise.resolve({ conversationId: "c" }) })
    expect(res.status).toBe(401)
  })
})
