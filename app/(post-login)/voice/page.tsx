import { Sidebar } from "@/components/swipe/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VoicePage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-galatea-darker">
        <div className="mx-auto max-w-3xl p-8">
          <h1 className="mb-6 text-3xl font-bold text-foreground">Voice</h1>
          <Card>
            <CardHeader>
              <CardTitle>Coming soon</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">Talk to your companion. Coming soon.</CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
