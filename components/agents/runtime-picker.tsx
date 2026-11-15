"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { RUNTIMES, type RuntimeId } from "@/lib/agents/runtimes"

interface RuntimePickerProps {
  value: RuntimeId
  onChange: (id: RuntimeId) => void
}

const SELECTABLE = RUNTIMES.filter((r) => r.status === "available")

export function RuntimePicker({ value, onChange }: RuntimePickerProps) {
  const handleKeyDown = (e: React.KeyboardEvent, id: RuntimeId) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const index = SELECTABLE.findIndex((r) => r.id === id)
    if (index < 0) return
    const next = SELECTABLE[(index + delta + SELECTABLE.length) % SELECTABLE.length]
    onChange(next.id)
    const el = e.currentTarget.parentElement?.querySelector<HTMLElement>(`[data-runtime="${next.id}"]`)
    el?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Agent runtime" className="grid gap-3 sm:grid-cols-2">
      {RUNTIMES.map((r) => {
        const disabled = r.status === "coming-soon"
        const selected = !disabled && r.id === value
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled ? "true" : undefined}
            disabled={disabled}
            data-runtime={r.id}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (!disabled) onChange(r.id)
            }}
            onKeyDown={(e) => handleKeyDown(e, r.id)}
            className={cn(
              "relative rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              disabled
                ? "cursor-not-allowed border-border bg-card opacity-60"
                : selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50",
            )}
          >
            {selected && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
            {disabled && (
              <Badge variant="secondary" className="absolute right-3 top-3">
                Coming soon
              </Badge>
            )}
            <div className="font-semibold text-foreground">{r.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">{r.description}</div>
          </button>
        )
      })}
    </div>
  )
}
