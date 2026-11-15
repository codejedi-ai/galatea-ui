import type { ReactNode } from "react"
import { Sidebar } from "@/components/swipe/sidebar"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-galatea-darker">
        {children}
      </main>
    </div>
  )
}
