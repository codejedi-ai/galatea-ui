"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { CompanionChatSidebar, CompanionHeader, CompanionProvider } from "@/components/companion/companion-workspace"
import { MessagesConversationList } from "@/components/messages/conversation-list"
import { MessagesHeader } from "@/components/messages/messages-header"

export default function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isCompanion = pathname === "/companion" || pathname.startsWith("/companion/")
  const isMessages = pathname === "/dashboard/messages" || pathname.startsWith("/dashboard/messages/")
  // Keep this provider mounted on every section. Wrapping AppShell only on the
  // companion chat remounts the shell and resets the shared section-menu state.
  return (
    <CompanionProvider persist={isCompanion}>
      <AppShell
        panel={
          isCompanion
            ? () => <CompanionChatSidebar />
            : isMessages
              ? () => <MessagesConversationList />
              : undefined
        }
        header={isCompanion ? <CompanionHeader /> : isMessages ? <MessagesHeader /> : undefined}
      >
        {children}
      </AppShell>
    </CompanionProvider>
  )
}
