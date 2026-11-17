"use client"

import Image from "next/image"
import { MoreVertical, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockConversations } from "@/components/messages/mock"

/** Conversation identity and call actions for the messages thread. Lives in the shell header. */
export function MessagesHeader() {
  const conversation = mockConversations[0] ?? null
  if (!conversation) {
    return <span className="truncate text-sm font-semibold text-foreground">Messages</span>
  }

  return (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <Image
            src={conversation.avatar || "/placeholder.svg"}
            alt={conversation.name}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
          {conversation.online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold leading-tight text-foreground">{conversation.name}</h1>
          <p className="text-xs leading-tight text-muted-foreground">{conversation.online ? "Online" : "Offline"}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" aria-label="Call">
          <Phone size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" aria-label="Video">
          <Video size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" aria-label="More">
          <MoreVertical size={18} />
        </Button>
      </div>
    </>
  )
}
