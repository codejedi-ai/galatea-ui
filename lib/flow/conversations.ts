import { CONVERSATION_STORAGE_KEY } from "@/lib/flow/start"

/** Client-safe list of companion chats. The active id stays in CONVERSATION_STORAGE_KEY. */

export const CONVERSATIONS_STORAGE_KEY = "galatea.companion.conversations"
export const NEW_CHAT_TITLE = "New chat"

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/

export interface CompanionConversation {
  id: string
  title: string
  preview: string
  updatedAt: number
}

export interface ConversationActivity {
  title?: string
  preview?: string
}

export function conversationTitle(text: string, max = 42): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (!clean) return NEW_CHAT_TITLE
  if (clean.length <= max) return clean
  return clean.slice(0, max).trimEnd() + "…"
}

function clipPreview(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max).trimEnd() + "…"
}

export function parseConversations(raw: string | null): CompanionConversation[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    const out: CompanionConversation[] = []
    for (const item of data) {
      if (!item || typeof item !== "object") continue
      const rec = item as Record<string, unknown>
      const id = typeof rec.id === "string" ? rec.id : ""
      if (!ID_RE.test(id)) continue
      const title = typeof rec.title === "string" && rec.title.trim() ? rec.title : NEW_CHAT_TITLE
      const preview = typeof rec.preview === "string" ? rec.preview : ""
      const updatedAt = typeof rec.updatedAt === "number" && Number.isFinite(rec.updatedAt) ? rec.updatedAt : 0
      out.push({ id, title, preview, updatedAt })
    }
    return sortConversations(dedupe(out))
  } catch {
    return []
  }
}

function dedupe(list: CompanionConversation[]): CompanionConversation[] {
  const seen = new Set<string>()
  const out: CompanionConversation[] = []
  for (const item of list) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out
}

export function sortConversations(list: CompanionConversation[]): CompanionConversation[] {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id))
}

export function withActiveConversation(
  list: CompanionConversation[],
  activeId: string | null,
  createId: () => string,
  now = Date.now(),
): { conversations: CompanionConversation[]; activeId: string } {
  if (activeId && ID_RE.test(activeId) && list.some((c) => c.id === activeId)) {
    return { conversations: list, activeId }
  }
  if (activeId && ID_RE.test(activeId)) {
    const created: CompanionConversation = { id: activeId, title: NEW_CHAT_TITLE, preview: "", updatedAt: now }
    return { conversations: sortConversations([created, ...list]), activeId }
  }
  if (list[0]) return { conversations: list, activeId: list[0].id }
  const id = createId()
  return {
    conversations: [{ id, title: NEW_CHAT_TITLE, preview: "", updatedAt: now }],
    activeId: id,
  }
}

export function startConversation(
  list: CompanionConversation[],
  id: string,
  now = Date.now(),
): CompanionConversation[] {
  const created: CompanionConversation = { id, title: NEW_CHAT_TITLE, preview: "", updatedAt: now }
  return sortConversations([created, ...list.filter((c) => c.id !== id)])
}

/** Refresh title and preview. Title sticks once it leaves "New chat". Returns the same list when nothing changed. */
export function applyConversationActivity(
  list: CompanionConversation[],
  id: string,
  patch: ConversationActivity,
  now = Date.now(),
): CompanionConversation[] {
  if (!ID_RE.test(id)) return list
  const current = list.find((c) => c.id === id)
  const incomingTitle = patch.title ? conversationTitle(patch.title) : undefined
  const title =
    incomingTitle &&
    incomingTitle !== NEW_CHAT_TITLE &&
    (!current || current.title === NEW_CHAT_TITLE)
      ? incomingTitle
      : (current?.title ?? NEW_CHAT_TITLE)
  const preview = clipPreview(patch.preview ?? current?.preview ?? "")
  if (current && current.title === title && current.preview === preview) return list
  const next: CompanionConversation = { id, title, preview, updatedAt: now }
  return sortConversations([next, ...list.filter((c) => c.id !== id)])
}

export function readConversationState(storage: Pick<Storage, "getItem">, createId: () => string, now = Date.now()) {
  let active: string | null = null
  let raw: string | null = null
  try {
    active = storage.getItem(CONVERSATION_STORAGE_KEY)
    raw = storage.getItem(CONVERSATIONS_STORAGE_KEY)
  } catch {
    active = null
    raw = null
  }
  return withActiveConversation(parseConversations(raw), active, createId, now)
}

export function writeConversationList(storage: Pick<Storage, "setItem">, conversations: CompanionConversation[]) {
  try {
    storage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations))
  } catch {
    // storage unavailable
  }
}

export function writeConversationState(storage: Pick<Storage, "setItem">, conversations: CompanionConversation[], activeId: string) {
  writeConversationList(storage, conversations)
  try {
    storage.setItem(CONVERSATION_STORAGE_KEY, activeId)
  } catch {
    // storage unavailable
  }
}
