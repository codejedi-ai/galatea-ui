import { describe, expect, it } from "vitest"
import { CONVERSATION_STORAGE_KEY } from "../start"
import {
  CONVERSATIONS_STORAGE_KEY,
  NEW_CHAT_TITLE,
  applyConversationActivity,
  conversationTitle,
  parseConversations,
  readConversationState,
  startConversation,
  withActiveConversation,
  writeConversationState,
} from "../conversations"

describe("conversationTitle", () => {
  it("collapses whitespace and falls back when empty", () => {
    expect(conversationTitle("  hello   there ")).toBe("hello there")
    expect(conversationTitle("   ")).toBe(NEW_CHAT_TITLE)
  })

  it("clips long titles", () => {
    const title = conversationTitle("a".repeat(50), 42)
    expect(title.endsWith("…")).toBe(true)
    expect(title.length).toBeLessThanOrEqual(43)
  })
})

describe("parseConversations", () => {
  it("drops invalid entries and sorts newest first", () => {
    const raw = JSON.stringify([
      { id: "old", title: "Older", preview: "a", updatedAt: 1 },
      { id: "bad id", title: "nope" },
      { id: "new", title: "Newer", preview: "b", updatedAt: 5 },
    ])
    expect(parseConversations(raw).map((c) => c.id)).toEqual(["new", "old"])
  })

  it("returns empty for junk", () => {
    expect(parseConversations(null)).toEqual([])
    expect(parseConversations("not-json")).toEqual([])
    expect(parseConversations("{}")).toEqual([])
  })
})

describe("withActiveConversation", () => {
  it("keeps an id that is already in the list", () => {
    const list = [{ id: "a", title: "A", preview: "", updatedAt: 1 }]
    const result = withActiveConversation(list, "a", () => "unused")
    expect(result.activeId).toBe("a")
    expect(result.conversations).toBe(list)
  })

  it("seeds a legacy active id that has no list entry", () => {
    const result = withActiveConversation([], "legacy-id", () => "unused", 10)
    expect(result.activeId).toBe("legacy-id")
    expect(result.conversations).toEqual([{ id: "legacy-id", title: NEW_CHAT_TITLE, preview: "", updatedAt: 10 }])
  })

  it("creates a chat when nothing is stored", () => {
    const result = withActiveConversation([], null, () => "fresh", 3)
    expect(result.activeId).toBe("fresh")
    expect(result.conversations[0].id).toBe("fresh")
  })
})

describe("startConversation / applyConversationActivity", () => {
  it("puts a new chat first", () => {
    const list = [{ id: "a", title: "A", preview: "", updatedAt: 5 }]
    expect(startConversation(list, "b", 9).map((c) => c.id)).toEqual(["b", "a"])
  })

  it("names a new chat from the first message and then keeps that title", () => {
    const started = startConversation([], "a", 1)
    const named = applyConversationActivity(started, "a", { title: "Hello there", preview: "Hello there" }, 2)
    expect(named[0]).toMatchObject({ title: "Hello there", preview: "Hello there", updatedAt: 2 })
    const later = applyConversationActivity(named, "a", { title: "A different first line", preview: "latest" }, 3)
    expect(later[0].title).toBe("Hello there")
    expect(later[0].preview).toBe("latest")
  })

  it("returns the same list when nothing changed", () => {
    const list = [{ id: "a", title: "Hello", preview: "Hello", updatedAt: 2 }]
    expect(applyConversationActivity(list, "a", { title: "Hello", preview: "Hello" }, 9)).toBe(list)
  })
})

describe("storage", () => {
  it("round-trips the list and the active id", () => {
    const bag = new Map<string, string>()
    const storage = {
      getItem: (k: string) => bag.get(k) ?? null,
      setItem: (k: string, v: string) => {
        bag.set(k, v)
      },
    }
    const conversations = [{ id: "a", title: "Hello", preview: "Hello", updatedAt: 2 }]
    writeConversationState(storage, conversations, "a")
    expect(bag.get(CONVERSATION_STORAGE_KEY)).toBe("a")
    expect(bag.has(CONVERSATIONS_STORAGE_KEY)).toBe(true)
    const read = readConversationState(storage, () => "unused")
    expect(read.activeId).toBe("a")
    expect(read.conversations[0].title).toBe("Hello")
  })
})
