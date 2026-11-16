"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SidePanelProps {
  id: string
  className?: string
  children: ReactNode
}

/** Shared frame for every section's second sidebar. The title lives in the top bar, so this frame has no heading. */
export function SidePanel({ id, className, children }: SidePanelProps) {
  return (
    <div
      id={id}
      className={cn("flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-card", className)}
    >
      {children}
    </div>
  )
}
