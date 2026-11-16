import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VoicePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Voice</h1>
        <Card>
          <CardHeader>
            <CardTitle>Coming soon</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">Talk to your companion. Coming soon.</CardContent>
        </Card>
      </div>
    </div>
  )
}
