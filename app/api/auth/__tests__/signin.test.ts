import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"

const callGalatea = vi.fn()
vi.mock("@/lib/galatea-server", async (orig) => ({
  ...(await orig<typeof import("@/lib/galatea-server")>()),
  callGalatea: (...a: unknown[]) => callGalatea(...a),
  galateaErrorResponse: () => NextResponse.json({ error: "upstream" }, { status: 502 }),
}))

import { POST } from "../signin/route"
import { ACCESS_TOKEN_COOKIE } from "@/lib/session"

const req = (body: unknown) =>
  new NextRequest("http://localhost/api/auth/signin", { method: "POST", body: JSON.stringify(body) })

beforeEach(() => {
  callGalatea.mockReset()
  vi.stubEnv("NODE_ENV", "development")
  vi.stubEnv("VERCEL", "")
})
afterEach(() => vi.unstubAllEnvs())

describe("POST /api/auth/signin", () => {
  it("accepts test credentials with a gtest httpOnly cookie", async () => {
    const res = await POST(req({ email: "test@galatea.local", password: "galatea-test" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))!
    expect(cookie).toBeDefined()
    expect(cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=gtest.`)).toBe(true)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(callGalatea).not.toHaveBeenCalled()
  })
  it("sends wrong password to the service", async () => {
    callGalatea.mockRejectedValue(new Error("bad"))
    const res = await POST(req({ email: "test@galatea.local", password: "wrong" }))
    expect(callGalatea).toHaveBeenCalled()
    expect(res.status).not.toBe(200)
  })
  it("does not accept test credentials when disabled", async () => {
    vi.stubEnv("NODE_ENV", "production")
    callGalatea.mockRejectedValue(new Error("bad"))
    const res = await POST(req({ email: "test@galatea.local", password: "galatea-test" }))
    expect(callGalatea).toHaveBeenCalled()
    expect(res.status).not.toBe(200)
    expect(res.headers.getSetCookie().some((c) => c.includes("gtest."))).toBe(false)
  })
  it("returns 400 on bad JSON", async () => {
    const bad = new NextRequest("http://localhost/api/auth/signin", { method: "POST", body: "{" })
    expect((await POST(bad)).status).toBe(400)
  })
})
