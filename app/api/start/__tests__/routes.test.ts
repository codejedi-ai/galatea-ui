import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const getCurrentUser = vi.fn()
vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: () => getCurrentUser() }))

import { GET as sessionGET } from "../session/route"
import { GET as setupGET } from "../setup/route"

beforeEach(() => getCurrentUser.mockReset())
afterEach(() => vi.unstubAllEnvs())

describe("GET /api/start/session", () => {
  it("signed out", async () => {
    getCurrentUser.mockResolvedValue(null)
    const res = await sessionGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ signedIn: false })
    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })
  it("signed in", async () => {
    getCurrentUser.mockResolvedValue({ userId: "u1", email: "a@b.c" })
    const res = await sessionGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ signedIn: true, email: "a@b.c" })
    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })
})

describe("GET /api/start/setup", () => {
  it("401 without user", async () => {
    getCurrentUser.mockResolvedValue(null)
    const res = await setupGET()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ message: "Unauthorized" })
  })
  it("reports key presence without leaking it", async () => {
    getCurrentUser.mockResolvedValue({ userId: "u1" })
    vi.stubEnv("AI_GATEWAY_API_KEY", "sk-secret-xyz")
    const res = await setupGET()
    const text = await res.text()
    expect(res.headers.get("Cache-Control")).toBe("no-store")
    expect(JSON.parse(text)).toEqual({ modelKeyConfigured: true })
    expect(text).not.toContain("sk-secret-xyz")
  })
  it("false when unset", async () => {
    getCurrentUser.mockResolvedValue({ userId: "u1" })
    vi.stubEnv("AI_GATEWAY_API_KEY", "")
    const res = await setupGET()
    expect(await res.json()).toEqual({ modelKeyConfigured: false })
  })
})
