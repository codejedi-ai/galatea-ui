"use client"

import Link from "next/link"
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS } from "@/lib/nav/sections"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
const railBtn =
  "flex h-10 w-10 items-center justify-center rounded-lg transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground " +
  focusRing

interface RailProps {
  activeSectionId: string | null
  desktopPanelId: string
  mobilePanelId: string
  desktopOpen: boolean
  mobileOpen: boolean
  onToggleDesktop: () => void
  onToggleMobile: () => void
  onSignOut: () => void
  showToggle?: boolean
}

interface ToggleProps {
  open: boolean
  panelId: string
  onToggle: () => void
  className: string
}

function PanelToggle({ open, panelId, onToggle, className }: ToggleProps) {
  const Icon = open ? PanelLeftClose : PanelLeftOpen
  const label = open ? "Collapse section menu" : "Expand section menu"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(railBtn, className)}
        >
          <Icon className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function Rail({
  activeSectionId,
  desktopPanelId,
  mobilePanelId,
  desktopOpen,
  mobileOpen,
  onToggleDesktop,
  onToggleMobile,
  onSignOut,
  showToggle = true,
}: RailProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <nav
        aria-label="Sections"
        className="flex h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-4"
      >
        {showToggle && (
          <>
            <PanelToggle
              open={desktopOpen}
              panelId={desktopPanelId}
              onToggle={onToggleDesktop}
              className="mb-2 hidden md:flex"
            />
            <PanelToggle
              open={mobileOpen}
              panelId={mobilePanelId}
              onToggle={onToggleMobile}
              className="mb-2 md:hidden"
            />
          </>
        )}

        {NAV_SECTIONS.map((section) => {
          const active = section.id === activeSectionId
          const Icon = section.icon
          return (
            <Tooltip key={section.id}>
              <TooltipTrigger asChild>
                <Link
                  href={section.items[0].href}
                  aria-label={section.label}
                  aria-current={active ? "true" : undefined}
                  className={cn(railBtn, active && "bg-secondary text-primary")}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{section.label}</TooltipContent>
            </Tooltip>
          )
        })}

        <div className="mt-auto flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={onSignOut} aria-label="Sign out" className={railBtn}>
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  )
}
