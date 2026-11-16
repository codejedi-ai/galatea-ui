"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { NavSection } from "@/lib/nav/sections"

interface SectionPanelProps {
  id: string
  section: NavSection
  /** href of the current item, or null when nothing is active */
  activeHref: string | null
  className?: string
}

export function SectionPanel({ id, section, activeHref, className }: SectionPanelProps) {
  return (
    <div className={cn("h-full w-60 shrink-0 flex-col border-r border-border bg-card", className)}>
      <div className="px-5 py-5">
        <h2 className="text-lg font-semibold text-foreground">{section.label}</h2>
      </div>
      <nav id={id} aria-label={`${section.label} menu`} className="flex-1 space-y-1 overflow-y-auto px-3">
        {section.items.map((item) => {
          const active = item.href === activeHref
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "sidebar-item group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active ? "sidebar-item-active" : "sidebar-item-inactive",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
