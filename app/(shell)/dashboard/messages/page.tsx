"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { mockConversations, mockMessages } from "@/components/messages/mock"
import { Send, Paperclip } from "lucide-react"

export default function MessagesPage() {
  const activeConversation = mockConversations[0] ?? null
  const [messageText, setMessageText] = useState("")
  const messages = mockMessages

  // Facade: sending is display-only. Nothing is stored and no reply is generated.
  const handleSendMessage = () => {}

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {activeConversation ? (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                {!message.isUser && (
                  <div className="mr-2 flex-shrink-0">
                    <Image
                      src={activeConversation.avatar || "/placeholder.svg"}
                      alt={activeConversation.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.isUser
                      ? "rounded-tr-none bg-primary/20 text-primary"
                      : "rounded-tl-none bg-muted text-foreground"
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="mt-1 text-right text-xs text-muted-foreground">{message.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Paperclip size={20} />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button
                size="icon"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Card className="max-w-md p-8 text-center">
            <h2 className="mb-2 text-xl font-bold text-foreground">No Conversation Selected</h2>
            <p className="text-muted-foreground">Select a conversation from the list to start chatting.</p>
          </Card>
        </div>
      )}
    </div>
  )
}
