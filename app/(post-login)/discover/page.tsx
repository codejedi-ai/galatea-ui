"use client"

import { Sidebar, usePersistedOpen } from "@/components/swipe/sidebar"
import { SwipeInterface } from "./swipe-interface"

const DISCOVER_PANEL_KEY = "galatea.nav.discoverPanelOpen"

export default function DiscoverPage() {
  const panel = usePersistedOpen(DISCOVER_PANEL_KEY, false)

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        storageKey={DISCOVER_PANEL_KEY}
        open={panel.open}
        onToggleDesktop={panel.toggle}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-galatea-darker">
        <div className="h-full w-full min-w-0">
          <SwipeInterface />
        </div>
      </main>
    </div>
  )
}
