import { describe, expect, it } from "vitest"
import {
  checkTestCredentials,
  createTestSessionToken,
  getTestUser,
  isTestLoginEnabled,
  verifyTestSessionToken,
} from "../test-login"

const dev = { NODE_ENV: "development" }
const prod = { NODE_ENV: "production" }
const prodFlag = { NODE_ENV: "production", GALATEA_TEST_LOGIN: "1" }

describe("isTestLoginEnabled", () => {
  it("matrix", () => {
    expect(isTestLoginEnabled(dev)).toBe(true)
    expect(isTestLoginEnabled(prod)).toBe(false)
    expect(isTestLoginEnabled(prodFlag)).toBe(true)
    expect(isTestLoginEnabled({ ...dev, VERCEL: "1" })).toBe(false)
    expect(isTestLoginEnabled({ ...prodFlag, VERCEL: "1" })).toBe(false)
  })
})

describe("checkTestCredentials", () => {
  it("accepts the right credentials", () => {
    expect(checkTestCredentials("test@galatea.local", "galatea-test", dev)).toBe(true)
    expect(checkTestCredentials("  TEST@galatea.local ", "galatea-test", dev)).toBe(true)
  })
  it("honours env overrides", () => {
    const env = { ...dev, GALATEA_TEST_EMAIL: "a@b.c", GALATEA_TEST_PASSWORD: "pw" }
    expect(checkTestCredentials("a@b.c", "pw", env)).toBe(true)
    expect(checkTestCredentials("test@galatea.local", "galatea-test", env)).toBe(false)
  })
  it("rejects wrong values", () => {
    expect(checkTestCredentials("test@galatea.local", "nope", dev)).toBe(false)
    expect(checkTestCredentials("x@galatea.local", "galatea-test", dev)).toBe(false)
    expect(checkTestCredentials("test@galatea.local", "GALATEA-TEST", dev)).toBe(false)
  })
  it("rejects non-strings", () => {
    expect(checkTestCredentials(undefined, "galatea-test", dev)).toBe(false)
    expect(checkTestCredentials("test@galatea.local", 123, dev)).toBe(false)
    expect(checkTestCredentials(null, null, dev)).toBe(false)
  })
  it("rejects when disabled", () => {
    expect(checkTestCredentials("test@galatea.local", "galatea-test", prod)).toBe(false)
  })
})

describe("session token", () => {
  const now = 1_700_000_000_000
  it("round trips", () => {
    const t = createTestSessionToken(dev, now)
    expect(t.startsWith("gtest.")).toBe(true)
    expect(verifyTestSessionToken(t, dev, now)).toBe(true)
    expect(getTestUser(dev)).toEqual({ userId: "test-user", email: "test@galatea.local" })
  })
  it("rejects tampered signature", () => {
    const t = createTestSessionToken(dev, now)
    const bad = t.slice(0, -2) + (t.endsWith("AA") ? "BB" : "AA")
    expect(verifyTestSessionToken(bad, dev, now)).toBe(false)
  })
  it("rejects tampered expiry", () => {
    const [p, e, s] = createTestSessionToken(dev, now).split(".")
    expect(verifyTestSessionToken(`${p}.${Number(e) + 1000}.${s}`, dev, now)).toBe(false)
  })
  it("rejects wrong prefix and malformed", () => {
    const t = createTestSessionToken(dev, now)
    expect(verifyTestSessionToken(t.replace("gtest", "other"), dev, now)).toBe(false)
    expect(verifyTestSessionToken("gtest.abc", dev, now)).toBe(false)
    expect(verifyTestSessionToken("gtest.1.5x.sig", dev, now)).toBe(false)
    expect(verifyTestSessionToken("gtest.1e9.sig", dev, now)).toBe(false)
    expect(verifyTestSessionToken("", dev, now)).toBe(false)
    expect(verifyTestSessionToken(undefined, dev, now)).toBe(false)
  })
  it("rejects expired", () => {
    const t = createTestSessionToken(dev, now)
    expect(verifyTestSessionToken(t, dev, now + 7 * 24 * 3600 * 1000 + 1000)).toBe(false)
  })
  it("fails when disabled", () => {
    const t = createTestSessionToken(dev, now)
    expect(verifyTestSessionToken(t, prod, now)).toBe(false)
    expect(() => createTestSessionToken(prod, now)).toThrow()
  })
  it("a secret alone does not enable it when disabled", () => {
    const env = { ...prod, GALATEA_SESSION_SECRET: "s" }
    const t = createTestSessionToken({ ...dev, GALATEA_SESSION_SECRET: "s" }, now)
    expect(verifyTestSessionToken(t, env, now)).toBe(false)
  })
})
