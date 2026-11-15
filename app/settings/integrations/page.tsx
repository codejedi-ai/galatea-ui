import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Field {
  id: string
  label: string
  type: "text" | "password"
  placeholder?: string
}

const groups: { title: string; fields: Field[] }[] = [
  {
    title: "Models",
    fields: [{ id: "gateway-key", label: "Vercel AI Gateway key", type: "password" }],
  },
  {
    title: "Voice — ElevenLabs",
    fields: [
      { id: "elevenlabs-key", label: "API key", type: "password" },
      { id: "elevenlabs-agent", label: "Agent ID", type: "text" },
    ],
  },
  {
    title: "Voice — LiveKit",
    fields: [
      { id: "livekit-url", label: "URL", type: "text", placeholder: "wss://…" },
      { id: "livekit-key", label: "API key", type: "password" },
      { id: "livekit-secret", label: "API secret", type: "password" },
    ],
  },
]

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
      <div role="status" className="flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />
        Key storage isn&apos;t connected yet — saving is disabled.
      </div>
      {groups.map((g) => (
        <Card key={g.title}>
          <CardHeader>
            <CardTitle>{g.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {g.fields.map((f) => (
              <div key={f.id} className="space-y-2">
                <Label htmlFor={f.id}>{f.label}</Label>
                <Input
                  id={f.id}
                  name={f.id}
                  type={f.type}
                  placeholder={f.placeholder}
                  autoComplete={f.type === "password" ? "off" : undefined}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button disabled>Save</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
