"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { AlertCircle, KeyRound, Send, Square } from "lucide-react"
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
  onActivity,
}: {
  conversationId: string | null
  onActivity: (id: string, patch: ConversationActivity) => void
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
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const busy = status === "submitted" || status === "streaming"

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    // Explicit height beats flex stretch, so the box can shrink back to one line.
    el.style.height = "0px"
    el.style.height = `${el.scrollHeight}px`
  }, [input])

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
          className="mx-auto flex w-full max-w-4xl items-stretch gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Message your companion..."
            rows={1}
            className="max-h-40 min-h-10 resize-none"
          />
          {busy ? (
            <Button
              type="button"
              variant="outline"
              className="h-auto self-stretch"
              onClick={() => void stop()}
              aria-label="Stop"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" className="h-auto self-stretch" disabled={!input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </>
  )
}
