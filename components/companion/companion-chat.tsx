"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { AlertCircle, KeyRound, Plus, Send, Square } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

const STORAGE_KEY = "galatea.companion.conversationId"

function newConversationId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isMissingCredential(error: Error | undefined) {
  return !!error && /missing_credential|No model key configured/i.test(error.message)
}

function messageText(m: UIMessage) {
  return m.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export function CompanionChat() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null)

  // Stable conversation id, persisted across reloads.
  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = newConversationId()
      localStorage.setItem(STORAGE_KEY, id)
    }
    setConversationId(id)
  }, [])

  // Load history whenever the conversation changes.
  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    setInitialMessages(null)
    fetch(`/api/companion/conversations/${encodeURIComponent(conversationId)}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data: { messages?: Array<{ role: "user" | "assistant"; text: string }> }) => {
        if (cancelled) return
        setInitialMessages(
          (data.messages ?? []).map((m, i) => ({
            id: `history-${i}`,
            role: m.role,
            parts: [{ type: "text", text: m.text }],
          })),
        )
      })
      .catch(() => !cancelled && setInitialMessages([]))
    return () => {
      cancelled = true
    }
  }, [conversationId])

  const startNew = () => {
    const id = newConversationId()
    localStorage.setItem(STORAGE_KEY, id)
    setConversationId(id)
  }

  return (
    <Card className="flex h-[calc(100vh-8rem)] flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Companion</CardTitle>
        <Button variant="outline" size="sm" onClick={startNew} disabled={!conversationId}>
          <Plus className="mr-1 h-4 w-4" />
          New conversation
        </Button>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {conversationId && initialMessages ? (
          <ChatSession key={conversationId} conversationId={conversationId} initialMessages={initialMessages} />
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}
      </CardContent>
    </Card>
  )
}

function ChatSession({ conversationId, initialMessages }: { conversationId: string; initialMessages: UIMessage[] }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/companion/chat",
        // The server only reads the last user message; history lives server-side.
        prepareSendMessagesRequest: ({ id, messages }) => ({ body: { id, messages: messages.slice(-1) } }),
      }),
    [],
  )
  const { messages, sendMessage, status, stop, error } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
  })
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const busy = status === "submitted" || status === "streaming"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const submit = () => {
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    void sendMessage({ text })
  }

  return (
    <>
      <ScrollArea className="min-h-0 flex-1 pr-4">
        <div className="space-y-3 pb-2">
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
      </ScrollArea>

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
        className="flex items-end gap-2 pt-2"
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
    </>
  )
}
