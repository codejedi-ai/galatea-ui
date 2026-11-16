"use client"

import { useCallback, useEffect, useState } from "react"
import { Sidebar, usePersistedOpen } from "@/components/swipe/sidebar"
import { ChatSidebar } from "@/components/companion/chat-sidebar"
import { CompanionChat } from "@/components/companion/companion-chat"
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

const CHAT_PANEL_KEY = "galatea.nav.chatPanelOpen"

export function CompanionWorkspace() {
  const [conversations, setConversations] = useState<CompanionConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const panel = usePersistedOpen(CHAT_PANEL_KEY)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), [])

  useEffect(() => {
    const state = readConversationState(localStorage, newConversationId)
    setConversations(state.conversations)
    setActiveId(state.activeId)
    writeConversationState(localStorage, state.conversations, state.activeId)
  }, [])

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

  const activeTitle = conversations.find((c) => c.id === activeId)?.title ?? "Companion"

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        storageKey={CHAT_PANEL_KEY}
        open={panel.open}
        onToggleDesktop={panel.toggle}
        mobileOpen={mobileOpen}
        onToggleMobile={toggleMobile}
        showToggle={false}
        panel={({ id, className }) => (
          <ChatSidebar
            id={id}
            className={className}
            conversations={conversations}
            activeId={activeId}
            onSelect={select}
            onNew={startNew}
          />
        )}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-galatea-darker">
        <CompanionChat
          conversationId={activeId}
          title={activeTitle}
          onNew={startNew}
          onActivity={onActivity}
          panelOpen={panel.open}
          mobilePanelOpen={mobileOpen}
          onTogglePanel={panel.toggle}
          onToggleMobilePanel={toggleMobile}
        />
      </main>
    </div>
  )
}
