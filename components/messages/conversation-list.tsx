"use client"

import { useState } from "react"
import Image from "next/image"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { mockConversations } from "@/components/messages/mock"

/** Conversation list for the shell's secondary sidebar. SidePanel supplies the frame. */
export function MessagesConversationList() {
  const [searchQuery, setSearchQuery] = useState("")
  const activeId = mockConversations[0]?.id ?? null
  const filteredConversations = mockConversations.filter((convo) =>
    convo.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <>
      <div className="px-3 pb-3 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search conversations"
          />
        </div>
      </div>
      <nav aria-label="Conversations" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {filteredConversations.map((conversation) => {
          const active = conversation.id === activeId
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => {}}
              aria-current={active ? "page" : undefined}
              className={cn(
                "sidebar-item group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active ? "sidebar-item-active" : "sidebar-item-inactive",
              )}
            >
              <span className="relative shrink-0">
                <Image
                  src={conversation.avatar || "/placeholder.svg"}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
                {conversation.online && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{conversation.name}</span>
                  <span className={cn("shrink-0 text-xs", active ? "text-primary/70" : "text-muted-foreground")}>
                    {conversation.time}
                  </span>
                </span>
                <span className={cn("block truncate text-xs", active ? "text-primary/70" : "text-muted-foreground")}>
                  {conversation.lastMessage}
                </span>
              </span>
              {conversation.unread > 0 && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {conversation.unread}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </>
  )
}
