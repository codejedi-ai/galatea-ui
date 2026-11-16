import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const cookieGet = vi.fn()
const callGalatea = vi.fn()

vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }))
vi.mock("@/lib/galatea-server", () => ({ callGalatea: (...a: unknown[]) => callGalatea(...a) }))
// React's request-scoped cache() is a no-op outside a render; make it a passthrough.
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }))

import { getCurrentUser } from "../current-user"
import { createTestSessionToken } from "../test-login"

beforeEach(() => {
  cookieGet.mockReset()
  callGalatea.mockReset()
})
afterEach(() => vi.unstubAllEnvs())

describe("getCurrentUser", () => {
  it("returns null without a cookie", async () => {
    cookieGet.mockReturnValue(undefined)
    expect(await getCurrentUser()).toBeNull()
    expect(callGalatea).not.toHaveBeenCalled()
  })
  it("returns the user on success", async () => {
    cookieGet.mockReturnValue({ value: "tok" })
    callGalatea.mockResolvedValue({ userId: "u1", email: "a@b.c", sessionId: "s" })
    expect(await getCurrentUser()).toEqual({ userId: "u1", email: "a@b.c" })
    expect(callGalatea).toHaveBeenCalledWith("galatea.v1.AuthService/Check", {}, "tok")
  })
  it("returns null when callGalatea throws", async () => {
    cookieGet.mockReturnValue({ value: "tok" })
    callGalatea.mockRejectedValue(new Error("boom"))
    expect(await getCurrentUser()).toBeNull()
  })
  it("returns null without userId", async () => {
    cookieGet.mockReturnValue({ value: "tok" })
    callGalatea.mockResolvedValue({ email: "a@b.c" })
    expect(await getCurrentUser()).toBeNull()
  })

  describe("test login token", () => {
    it("returns the test user without calling the service", async () => {
      vi.stubEnv("NODE_ENV", "development")
      cookieGet.mockReturnValue({ value: createTestSessionToken() })
      expect(await getCurrentUser()).toEqual({ userId: "test-user", email: "test@galatea.local" })
      expect(callGalatea).not.toHaveBeenCalled()
    })
    it("falls through when disabled in production", async () => {
      vi.stubEnv("NODE_ENV", "development")
      const token = createTestSessionToken()
      vi.stubEnv("NODE_ENV", "production")
      cookieGet.mockReturnValue({ value: token })
      callGalatea.mockRejectedValue(new Error("boom"))
      expect(await getCurrentUser()).toBeNull()
      expect(callGalatea).toHaveBeenCalled()
    })
    it("falls through on Vercel", async () => {
      vi.stubEnv("NODE_ENV", "development")
      const token = createTestSessionToken()
      vi.stubEnv("VERCEL", "1")
      cookieGet.mockReturnValue({ value: token })
      callGalatea.mockRejectedValue(new Error("boom"))
      expect(await getCurrentUser()).toBeNull()
      expect(callGalatea).toHaveBeenCalled()
    })
  })
})
