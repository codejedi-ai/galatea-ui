import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RUNTIMES } from "@/lib/agents/runtimes"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getCredentialStatus } from "@/lib/companion/credentials"
import { DEFAULT_COMPANION_MODEL } from "@/lib/companion/model"
import { DEFAULT_PERSONA } from "@/lib/companion/persona"

export const dynamic = "force-dynamic"

type Status = "Connected" | "Not set" | "Coming soon"

interface ConfigRow {
  name: string
  value: string
  detail: string
  status: Status
}

const METRICS = [
  { label: "Conversations", value: "18" },
  { label: "Messages", value: "246" },
  { label: "Active companions", value: "1" },
  { label: "Response time", value: "1.4s" },
  { label: "Errors", value: "2" },
]

const MESSAGE_VOLUME = [
  { day: "Mon", messages: 28 },
  { day: "Tue", messages: 41 },
  { day: "Wed", messages: 36 },
  { day: "Thu", messages: 52 },
  { day: "Fri", messages: 33 },
  { day: "Sat", messages: 22 },
  { day: "Sun", messages: 34 },
]

const ACTIVITY = [
  { when: "2 min ago", title: "Galatea", detail: "Conversation · 12 messages" },
  { when: "26 min ago", title: "Galatea", detail: "Reply · 1.1s" },
  { when: "1 hour ago", title: "Model provider", detail: "Request timed out" },
  { when: "3 hours ago", title: "Galatea", detail: "Conversation · 8 messages" },
  { when: "Yesterday", title: "Voice", detail: "No session · coming soon" },
]

function statusBadgeClass(status: Status): string {
  if (status === "Connected") return "border-transparent bg-primary/15 text-primary"
  if (status === "Not set") return "border-border bg-transparent text-muted-foreground"
  return ""
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const modelConnected = user ? (await getCredentialStatus(user.userId)).aiGateway : false
  const modelId = process.env.COMPANION_DEFAULT_MODEL || DEFAULT_COMPANION_MODEL
  const chatRuntime = RUNTIMES.find((runtime) => runtime.id === "none")
  const upcomingRuntimes = RUNTIMES.filter((runtime) => runtime.status === "coming-soon").map((runtime) => runtime.name)

  const configuration: ConfigRow[] = [
    {
      name: "Model provider",
      value: modelConnected ? modelId : "Not set",
      detail: "Vercel AI Gateway",
      status: modelConnected ? "Connected" : "Not set",
    },
    {
      name: "Voice",
      value: "Not set",
      detail: "ElevenLabs, LiveKit",
      status: "Coming soon",
    },
    {
      name: "Agent runtime",
      value: chatRuntime?.name ?? "Chat only (no runtime)",
      detail: upcomingRuntimes.length > 0 ? `${upcomingRuntimes.join(", ")} coming soon` : "No extra runtime",
      status: "Connected",
    },
    {
      name: "Companion",
      value: DEFAULT_PERSONA.name,
      detail: DEFAULT_PERSONA.description ?? "Default companion",
      status: "Connected",
    },
  ]

  const peak = Math.max(...MESSAGE_VOLUME.map((row) => row.messages))

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-10 p-8">
        <p className="text-muted-foreground">Configuration and usage for this workspace.</p>

        <section aria-labelledby="configuration-heading" className="space-y-4">
          <h2 id="configuration-heading" className="text-lg font-semibold text-foreground">
            Configuration
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {configuration.map((row) => (
              <Card key={row.name}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{row.name}</CardTitle>
                  <Badge variant={row.status === "Coming soon" ? "secondary" : "outline"} className={statusBadgeClass(row.status)}>
                    {row.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-foreground">{row.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="metrics-heading" className="space-y-4">
          <div>
            <h2 id="metrics-heading" className="text-lg font-semibold text-foreground">
              Metrics
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Last 7 days</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {METRICS.map((metric) => (
              <Card key={metric.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-semibold tabular-nums ${metric.label === "Errors" ? "text-destructive" : "text-foreground"}`}>
                    {metric.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {MESSAGE_VOLUME.map((row) => (
                    <li key={row.day} className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-3">
                      <span className="text-sm text-muted-foreground">{row.day}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(row.messages / peak) * 100}%` }} />
                      </div>
                      <span className="text-right text-sm tabular-nums text-foreground">{row.messages}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <ul className="divide-y divide-border">
                  {ACTIVITY.map((item) => (
                    <li key={`${item.when}-${item.detail}`} className="flex items-start justify-between gap-4 px-6 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{item.when}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
