import { Sidebar } from "@/components/swipe/sidebar"
import { CompanionChat } from "@/components/companion/companion-chat"

export default function CompanionPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-galatea-darker p-8">
        <div className="mx-auto max-w-3xl">
          <CompanionChat />
        </div>
      </main>
    </div>
  )
}
