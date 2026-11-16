"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { NavSection } from "@/lib/nav/sections"

interface SectionPanelProps {
  section: NavSection
  /** href of the current item, or null when nothing is active */
  activeHref: string | null
}

export function SectionPanel({ section, activeHref }: SectionPanelProps) {
  return (
    <nav aria-label={`${section.label} menu`} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
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
  )
}
