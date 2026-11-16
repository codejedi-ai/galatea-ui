import type { ReactNode } from "react"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto">{children}</div>
}
