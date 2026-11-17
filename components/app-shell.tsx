"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { PanelToggleIcon } from "@/components/nav/panel-toggle-icon"
import { Rail } from "@/components/nav/rail"
import { SectionPanel } from "@/components/nav/section-panel"
import { SidePanel } from "@/components/nav/side-panel"
import { usePersistedOpen, type SidebarPanelSlot } from "@/components/swipe/sidebar"
import { NAV_SECTIONS, getActiveItem } from "@/lib/nav/sections"
import { cn } from "@/lib/utils"

const DESKTOP_PANEL_ID = "section-panel"
const MOBILE_PANEL_ID = "section-panel-mobile"
/** One open/closed value for the section menu on every section. */
const SECTION_PANEL_STORAGE_KEY = "galatea.nav.panelOpen"

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return desktop
}

interface AppShellProps {
  children: ReactNode
  /** Replaces the section menu. The companion chat passes its conversation list. */
  panel?: (slot: SidebarPanelSlot) => ReactNode
  /** Replaces the default section label in the top bar (e.g. the chat title and New chat). */
  header?: ReactNode
}

export function AppShell({ children, panel, header }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const desktop = useIsDesktop()
  const active = getActiveItem(pathname)
  const persisted = usePersistedOpen(SECTION_PANEL_STORAGE_KEY)
  const [mobileOpen, setMobileOpen] = useState(false)
  const open = persisted.open

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const closeMobileRef = useRef(closeMobile)
  closeMobileRef.current = closeMobile

  useEffect(() => {
    closeMobileRef.current()
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileRef.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [mobileOpen])

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
    } finally {
      router.replace("/")
      router.refresh()
    }
  }

  const toggle = () => {
    if (desktop) persisted.toggle()
    else setMobileOpen((v) => !v)
  }
  const expanded = desktop ? open : mobileOpen
  const label = expanded ? "Collapse section menu" : "Expand section menu"
  const section = active?.section ?? NAV_SECTIONS[0]
  const activeHref = active?.item.href ?? null

  const renderPanel = (slot: SidebarPanelSlot) => (
    <SidePanel id={slot.id} className={slot.className}>
      {panel ? panel(slot) : <SectionPanel section={section} activeHref={activeHref} />}
    </SidePanel>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <Rail
        activeSectionId={active?.section.id ?? null}
        desktopPanelId={DESKTOP_PANEL_ID}
        mobilePanelId={MOBILE_PANEL_ID}
        desktopOpen={open}
        mobileOpen={mobileOpen}
        onToggleDesktop={persisted.toggle}
        onToggleMobile={() => setMobileOpen((v) => !v)}
        onSignOut={handleSignOut}
        showToggle={false}
      />

      {open && renderPanel({ id: DESKTOP_PANEL_ID, className: "hidden md:flex" })}

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {mobileOpen && (
          <div className="md:hidden">
            <button
              type="button"
              aria-label="Close section menu"
              onClick={closeMobile}
              className="absolute inset-0 z-40 bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            {renderPanel({
              id: MOBILE_PANEL_ID,
              className: "absolute left-0 top-0 z-50 flex h-full shadow-lg",
            })}
          </div>
        )}

        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={label}
            aria-expanded={expanded}
            aria-controls={desktop ? DESKTOP_PANEL_ID : MOBILE_PANEL_ID}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PanelToggleIcon open={expanded} className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            {header ?? <span className="truncate text-sm font-semibold text-foreground">{section.label}</span>}
          </div>
        </header>

        <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-galatea-darker")}>{children}</div>
      </div>
    </div>
  )
}
