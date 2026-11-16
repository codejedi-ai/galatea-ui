"use client"

import { CompanionChat } from "@/components/companion/companion-chat"
import { useCompanionState } from "@/components/companion/companion-workspace"

export default function CompanionPage() {
  const { activeId, onActivity } = useCompanionState()
  return <CompanionChat conversationId={activeId} onActivity={onActivity} />
}
