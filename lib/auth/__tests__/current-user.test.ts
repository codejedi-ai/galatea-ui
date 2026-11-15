import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieGet = vi.fn()
const callGalatea = vi.fn()

vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }))
vi.mock("@/lib/galatea-server", () => ({ callGalatea: (...a: unknown[]) => callGalatea(...a) }))
// React's request-scoped cache() is a no-op outside a render; make it a passthrough.
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }))

import { getCurrentUser } from "../current-user"

beforeEach(() => {
  cookieGet.mockReset()
  callGalatea.mockReset()
})

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
})
