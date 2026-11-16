"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { AlertCircle, KeyRound, PanelLeftClose, PanelLeftOpen, Plus, Send, Square } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ConversationActivity } from "@/lib/flow/conversations"

function isMissingCredential(error: Error | undefined) {
  return !!error && /missing_credential|No model key configured/i.test(error.message)
}

function messageText(m: UIMessage) {
  return m.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export function CompanionChat({
  conversationId,
  title,
  onNew,
  onActivity,
  panelOpen,
  mobilePanelOpen,
  onTogglePanel,
  onToggleMobilePanel,
}: {
  conversationId: string | null
  title: string
  onNew: () => void
  onActivity: (id: string, patch: ConversationActivity) => void
  panelOpen: boolean
  mobilePanelOpen: boolean
  onTogglePanel: () => void
  onToggleMobilePanel: () => void
}) {
  const [history, setHistory] = useState<{ id: string; messages: UIMessage[] } | null>(null)
  const initialMessages = history && history.id === conversationId ? history.messages : null

  // Load history whenever the conversation changes.
  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    fetch(`/api/companion/conversations/${encodeURIComponent(conversationId)}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data: { messages?: Array<{ role: "user" | "assistant"; text: string }> }) => {
        if (cancelled) return
        setHistory({
          id: conversationId,
          messages: (data.messages ?? []).map((m, i) => ({
            id: `history-${i}`,
            role: m.role,
            parts: [{ type: "text", text: m.text }],
          })),
        })
      })
      .catch(() => {
        if (!cancelled) setHistory({ id: conversationId, messages: [] })
      })
    return () => {
      cancelled = true
    }
  }, [conversationId])

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden shrink-0 md:inline-flex"
            aria-label={panelOpen ? "Collapse chats" : "Expand chats"}
            aria-expanded={panelOpen}
            aria-controls="section-panel"
            onClick={onTogglePanel}
          >
            {panelOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            aria-label={mobilePanelOpen ? "Collapse chats" : "Expand chats"}
            aria-expanded={mobilePanelOpen}
            aria-controls="section-panel-mobile"
            onClick={onToggleMobilePanel}
          >
            {mobilePanelOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
          <h1 className="truncate text-lg font-semibold leading-none tracking-tight">{title}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={onNew} disabled={!conversationId}>
          <Plus className="mr-1 h-4 w-4" />
          New chat
        </Button>
      </div>
      {conversationId && initialMessages ? (
        <ChatSession
          key={conversationId}
          conversationId={conversationId}
          initialMessages={initialMessages}
          onActivity={onActivity}
        />
      ) : (
        <div className="min-h-0 flex-1 px-4 py-6 md:px-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
    </div>
  )
}

function ChatSession({
  conversationId,
  initialMessages,
  onActivity,
}: {
  conversationId: string
  initialMessages: UIMessage[]
  onActivity: (id: string, patch: ConversationActivity) => void
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/companion/chat",
        // The server only reads the last user message; history lives server-side.
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: { id, messages: messages.slice(-1) },
        }),
      }),
    [],
  )
  // Seed once per session. Later sidebar updates must not push this array back into the hook.
  const seedMessages = useRef(initialMessages)
  const { messages, sendMessage, status, stop, error } = useChat({
    id: conversationId,
    messages: seedMessages.current,
    transport,
  })
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const busy = status === "submitted" || status === "streaming"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const firstUser = messages.find((m) => m.role === "user" && messageText(m))
    const last = [...messages].reverse().find((m) => messageText(m))
    if (!firstUser && !last) return
    // Skip assistant tokens while a reply is still streaming.
    if (busy && last?.role !== "user") return
    onActivity(conversationId, {
      title: firstUser ? messageText(firstUser) : undefined,
      preview: last ? messageText(last) : undefined,
    })
  }, [busy, conversationId, messages, onActivity])

  const submit = () => {
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    void sendMessage({ text })
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto w-full max-w-4xl space-y-3 pb-2">
          {messages.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">Say hello to start the conversation.</p>
          )}
          {messages.map((m) => {
            const text = messageText(m)
            if (!text) return null
            return (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm " +
                    (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")
                  }
                >
                  {text}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-galatea-darker px-4 py-3 md:px-6">
        {error &&
          (isMissingCredential(error) ? (
            <Alert className="mb-3">
              <KeyRound className="h-4 w-4" />
              <AlertTitle>No model key configured</AlertTitle>
              <AlertDescription>
                Set AI_GATEWAY_API_KEY on the server (or add a key under Settings, Integrations) to chat with your
                companion.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>Your companion could not reply. Please try again.</AlertDescription>
            </Alert>
          ))}

        <form
          className="mx-auto flex w-full max-w-4xl items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Message your companion..."
            rows={2}
            className="resize-none"
          />
          {busy ? (
            <Button type="button" variant="outline" onClick={() => void stop()} aria-label="Stop">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={!input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </>
  )
}
