"use client"

import { MessageCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CompanionConversation } from "@/lib/flow/conversations"

interface ChatSidebarProps {
  conversations: CompanionConversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function ChatSidebar({ conversations, activeId, onSelect, onNew }: ChatSidebarProps) {
  return (
    <>
      <div className="px-3 pb-3 pt-3">
        <Button type="button" variant="outline" className="w-full justify-start" onClick={onNew}>
          <Plus className="mr-2 h-4 w-4" />
          New chat
        </Button>
      </div>
      <nav aria-label="Chats" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No chats yet.</p>
        ) : (
          conversations.map((conversation) => {
            const active = conversation.id === activeId
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "sidebar-item group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active ? "sidebar-item-active" : "sidebar-item-inactive",
                )}
              >
                <MessageCircle
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{conversation.title}</span>
                  {conversation.preview ? (
                    <span
                      className={cn(
                        "block truncate text-xs",
                        active ? "text-primary/70" : "text-muted-foreground",
                      )}
                    >
                      {conversation.preview}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })
        )}
      </nav>
    </>
  )
}
