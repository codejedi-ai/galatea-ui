"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS, getActiveItem } from "@/lib/nav/sections"
import { Rail } from "@/components/nav/rail"
import { SectionPanel } from "@/components/nav/section-panel"

export interface SidebarPanelSlot {
  id: string
  className: string
}

interface SidebarProps {
  className?: string
  /** Replaces the section menu. Used by the companion chat for its own conversation list. */
  panel?: (slot: SidebarPanelSlot) => ReactNode
  /** localStorage key for the open/closed state. A custom panel should use its own key. */
  storageKey?: string
  /** Controlled desktop panel. The chat page owns this so its top bar can toggle it. */
  open?: boolean
  onToggleDesktop?: () => void
  mobileOpen?: boolean
  onToggleMobile?: () => void
  /** The chat page puts this control in its top bar instead of the rail. */
  showToggle?: boolean
}

export function usePersistedOpen(storageKey: string, defaultOpen = true) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored === "true") setOpen(true)
      else if (stored === "false") setOpen(false)
    } catch {
      // storage unavailable
    }
  }, [storageKey])

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(storageKey, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [storageKey])

  return { open, toggle }
}

const STORAGE_KEY = "galatea.nav.panelOpen"
const DESKTOP_PANEL_ID = "section-panel"
const MOBILE_PANEL_ID = "section-panel-mobile"

export function Sidebar({
  className,
  panel,
  storageKey = STORAGE_KEY,
  open: openProp,
  onToggleDesktop,
  mobileOpen: mobileOpenProp,
  onToggleMobile,
  showToggle = true,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const persisted = usePersistedOpen(storageKey)
  const [mobileOpenState, setMobileOpenState] = useState(false)
  const open = openProp ?? persisted.open
  const mobileOpen = mobileOpenProp ?? mobileOpenState
  const toggleDesktop = onToggleDesktop ?? persisted.toggle
  const toggleMobile = useCallback(() => {
    if (onToggleMobile) onToggleMobile()
    else setMobileOpenState((v) => !v)
  }, [onToggleMobile])
  const closeMobile = useCallback(() => {
    if (!mobileOpen) return
    if (onToggleMobile) onToggleMobile()
    else setMobileOpenState(false)
  }, [mobileOpen, onToggleMobile])
  const closeMobileRef = useRef(closeMobile)
  closeMobileRef.current = closeMobile

  // Close the mobile overlay on navigation.
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

  const active = getActiveItem(pathname)
  const panelSection = active?.section ?? NAV_SECTIONS[0]
  const activeHref = active?.item.href ?? null

  return (
    <div className={cn("relative flex h-full shrink-0", className)}>
      <Rail
        activeSectionId={active?.section.id ?? null}
        desktopPanelId={DESKTOP_PANEL_ID}
        mobilePanelId={MOBILE_PANEL_ID}
        desktopOpen={open}
        mobileOpen={mobileOpen}
        onToggleDesktop={toggleDesktop}
        onToggleMobile={toggleMobile}
        onSignOut={handleSignOut}
        showToggle={showToggle}
      />

      {open &&
        (panel ? (
          panel({ id: DESKTOP_PANEL_ID, className: "hidden md:flex" })
        ) : (
          <SectionPanel
            id={DESKTOP_PANEL_ID}
            section={panelSection}
            activeHref={activeHref}
            className="hidden md:flex"
          />
        ))}

      {mobileOpen && (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close section menu"
            onClick={closeMobile}
            className="fixed inset-0 z-40 bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {panel ? (
            panel({ id: MOBILE_PANEL_ID, className: "absolute left-16 top-0 z-50 flex shadow-lg" })
          ) : (
            <SectionPanel
              id={MOBILE_PANEL_ID}
              section={panelSection}
              activeHref={activeHref}
              className="absolute left-16 top-0 z-50 flex shadow-lg"
            />
          )}
        </div>
      )}
    </div>
  )
}
