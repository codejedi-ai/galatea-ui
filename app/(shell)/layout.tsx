"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { CompanionChatSidebar, CompanionHeader, CompanionProvider } from "@/components/companion/companion-workspace"

export default function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isCompanion = pathname === "/companion" || pathname.startsWith("/companion/")
  const shell = (
    <AppShell
      panel={isCompanion ? () => <CompanionChatSidebar /> : undefined}
      header={isCompanion ? <CompanionHeader /> : undefined}
    >
      {children}
    </AppShell>
  )
  return isCompanion ? <CompanionProvider>{shell}</CompanionProvider> : shell
}
