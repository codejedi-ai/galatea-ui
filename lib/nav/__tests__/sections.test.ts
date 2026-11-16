import { describe, it, expect } from "vitest"
import { NAV_SECTIONS, getActiveItem, getActiveSection } from "../sections"

const allItems = NAV_SECTIONS.flatMap((s) => s.items.map((item) => ({ s, item })))

describe("NAV_SECTIONS config", () => {
  it("has unique hrefs", () => {
    const h = allItems.map((x) => x.item.href)
    expect(new Set(h).size).toBe(h.length)
  })
  it("has unique section ids", () => {
    const ids = NAV_SECTIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it("every section has items", () => {
    for (const s of NAV_SECTIONS) expect(s.items.length).toBeGreaterThanOrEqual(1)
  })
})

describe("getActiveItem / getActiveSection", () => {
  it.each(allItems.map((x) => [x.item.href, x.s.id, x.item.label]))(
    "%s -> %s / %s",
    (href, sid, label) => {
      const r = getActiveItem(href)
      expect(r?.section.id).toBe(sid)
      expect(r?.item.label).toBe(label)
      expect(getActiveSection(href)?.id).toBe(sid)
    },
  )
  it("prefers longest match", () => {
    expect(getActiveItem("/settings/agents")?.item.label).toBe("Agents")
    expect(getActiveItem("/settings")?.item.label).toBe("Overview")
    expect(getActiveItem("/dashboard/messages")?.item.label).toBe("Messages")
    expect(getActiveItem("/dashboard")?.item.label).toBe("Dashboard")
  })
  it("matches nested paths", () => {
    expect(getActiveItem("/settings/agents/foo")?.item.label).toBe("Agents")
  })
  it("handles trailing slash", () => {
    expect(getActiveItem("/companion/")?.item.label).toBe("Chat")
  })
  it("respects segment boundary", () => {
    expect(getActiveItem("/settingsx")).toBeNull()
  })
  it("returns null for unknown, root, null, empty", () => {
    expect(getActiveItem("/nope")).toBeNull()
    expect(getActiveItem("/")).toBeNull()
    expect(getActiveItem(null)).toBeNull()
    expect(getActiveItem("")).toBeNull()
    expect(getActiveSection("/nope")).toBeNull()
  })
})
