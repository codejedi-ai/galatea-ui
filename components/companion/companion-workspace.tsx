"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "@/components/companion/chat-sidebar"
import {
  applyConversationActivity,
  readConversationState,
  startConversation,
  writeConversationList,
  writeConversationState,
  type CompanionConversation,
  type ConversationActivity,
} from "@/lib/flow/conversations"

function newConversationId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

interface CompanionState {
  conversations: CompanionConversation[]
  activeId: string | null
  title: string
  select: (id: string) => void
  startNew: () => void
  onActivity: (id: string, patch: ConversationActivity) => void
}

const CompanionContext = createContext<CompanionState | null>(null)

export function CompanionProvider({
  children,
  persist = true,
}: {
  children: ReactNode
  /** Read and write conversation storage. The shell leaves this mounted and turns persistence on only for the chat. */
  persist?: boolean
}) {
  const [conversations, setConversations] = useState<CompanionConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!persist) return
    const state = readConversationState(localStorage, newConversationId)
    setConversations(state.conversations)
    setActiveId(state.activeId)
    writeConversationState(localStorage, state.conversations, state.activeId)
  }, [persist])

  const select = useCallback((id: string) => {
    setActiveId(id)
    setConversations((current) => {
      writeConversationState(localStorage, current, id)
      return current
    })
  }, [])

  const startNew = useCallback(() => {
    const id = newConversationId()
    setConversations((current) => {
      const next = startConversation(current, id)
      writeConversationState(localStorage, next, id)
      return next
    })
    setActiveId(id)
  }, [])

  const onActivity = useCallback((id: string, patch: ConversationActivity) => {
    setConversations((current) => {
      const next = applyConversationActivity(current, id, patch)
      if (next === current) return current
      writeConversationList(localStorage, next)
      return next
    })
  }, [])

  const title = conversations.find((c) => c.id === activeId)?.title ?? "Companion"

  return (
    <CompanionContext.Provider value={{ conversations, activeId, title, select, startNew, onActivity }}>
      {children}
    </CompanionContext.Provider>
  )
}

export function useCompanionState() {
  const state = useContext(CompanionContext)
  if (!state) throw new Error("useCompanionState must be used inside CompanionProvider")
  return state
}

/** Top-bar content for the companion chat: the conversation title and New chat. Lives in the shell header. */
export function CompanionHeader() {
  const { activeId, title, startNew } = useCompanionState()
  return (
    <>
      <h1 className="truncate text-base font-semibold leading-none tracking-tight">{title}</h1>
      <Button variant="outline" size="sm" onClick={startNew} disabled={!activeId} className="shrink-0">
        <Plus className="mr-1 h-4 w-4" />
        New chat
      </Button>
    </>
  )
}

export function CompanionChatSidebar() {
  const { conversations, activeId, select, startNew } = useCompanionState()
  return (
    <ChatSidebar conversations={conversations} activeId={activeId} onSelect={select} onNew={startNew} />
  )
}
