import { describe, expect, it } from "vitest"
import { INITIAL_STEPS, nextPendingStep, resolveStartDestination, startReducer } from "../start"

describe("resolveStartDestination", () => {
  it("routes by sign-in state", () => {
    expect(resolveStartDestination({ signedIn: true })).toBe("/companion")
    expect(resolveStartDestination({ signedIn: false })).toBe("/signin")
  })
})

describe("startReducer", () => {
  it("start/done/fail/timeout", () => {
    let s = startReducer(INITIAL_STEPS, { type: "start", id: "session" })
    expect(s[0].status).toBe("running")
    s = startReducer(s, { type: "done", id: "session", detail: "ok" })
    expect(s[0]).toMatchObject({ status: "done", detail: "ok" })
    s = startReducer(s, { type: "fail", id: "setup", detail: "Server responded 500" })
    expect(s[1]).toMatchObject({ status: "failed", detail: "Server responded 500" })
    s = startReducer(s, { type: "timeout", id: "companion" })
    expect(s[2]).toMatchObject({ status: "failed", detail: "Timed out after 10s" })
  })

  it("retry resets failed and later steps, keeps earlier done", () => {
    let s = startReducer(INITIAL_STEPS, { type: "done", id: "session", detail: "a" })
    s = startReducer(s, { type: "fail", id: "setup", detail: "x" })
    s = startReducer(s, { type: "done", id: "companion", detail: "late" })
    s = startReducer(s, { type: "retry" })
    expect(s[0]).toMatchObject({ status: "done", detail: "a" })
    expect(s[1]).toEqual({ ...INITIAL_STEPS[1] })
    expect(s[2].status).toBe("pending")
    expect(s[2].detail).toBeUndefined()
  })

  it("retry with no failure is a no-op", () => {
    expect(startReducer(INITIAL_STEPS, { type: "retry" })).toBe(INITIAL_STEPS)
  })

  it("nextPendingStep", () => {
    expect(nextPendingStep(INITIAL_STEPS)?.id).toBe("session")
    let s = startReducer(INITIAL_STEPS, { type: "done", id: "session" })
    expect(nextPendingStep(s)?.id).toBe("setup")
    s = INITIAL_STEPS.map((x) => ({ ...x, status: "done" as const }))
    expect(nextPendingStep(s)).toBeUndefined()
  })
})
