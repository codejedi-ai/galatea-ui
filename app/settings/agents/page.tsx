"use client"

import { useState } from "react"
import { RuntimePicker } from "@/components/agents/runtime-picker"
import { Card, CardContent } from "@/components/ui/card"
import type { RuntimeId } from "@/lib/agents/runtimes"

export default function AgentsPage() {
  const [runtimeId, setRuntimeId] = useState<RuntimeId>("none")

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agents</h1>
        <p className="mt-2 text-muted-foreground">
          Your companion works on its own in chat. Connect an agent runtime to give it a body — a place to act, use tools and run tasks.
        </p>
      </div>
      <RuntimePicker value={runtimeId} onChange={setRuntimeId} />
      {runtimeId === "none" && (
        <Card>
          <CardContent className="p-4 text-sm text-foreground">
            You&apos;re all set. Your companion runs in chat with no extra setup.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
