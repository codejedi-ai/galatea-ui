import { ProviderManagement, type ProviderId } from "@/components/dashboard/provider-management"
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

/** The gateway key belongs to whichever provider the configured model id names. */
function providerForGatewayModel(modelId: string): ProviderId | null {
  const prefix = modelId.toLowerCase().split("/")[0]
  if (prefix === "openai") return "openai"
  if (prefix === "google" || prefix === "gemini") return "gemini"
  if (prefix === "anthropic") return "anthropic"
  return null
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const modelConnected = user ? (await getCredentialStatus(user.userId)).aiGateway : false
  const modelId = process.env.COMPANION_DEFAULT_MODEL || DEFAULT_COMPANION_MODEL
  const gatewayProvider = providerForGatewayModel(modelId)
  const chatRuntime = RUNTIMES.find((runtime) => runtime.id === "none")
  const upcomingRuntimes = RUNTIMES.filter((runtime) => runtime.status === "coming-soon").map((runtime) => runtime.name)

  const providerStatus = (id: ProviderId): "Connected" | "Not set" =>
    modelConnected && gatewayProvider === id ? "Connected" : "Not set"

  const geographies = [
    {
      id: "europe" as const,
      label: "European",
      flag: "🇪🇺",
      routed: "Data is processed in the European Union.",
      benefits: "The benefit is that data can stay in the EU under GDPR.",
      risks: "The risk is that fewer models are available.",
      providers: [
        {
          id: "mistral" as const,
          name: "Mistral",
          description: "Mistral models from Mistral AI.",
          status: "Not set" as const,
        },
        {
          id: "aleph-alpha" as const,
          name: "Aleph Alpha",
          description: "Models from Aleph Alpha.",
          status: "Not set" as const,
        },
        {
          id: "salamandra-aguila" as const,
          name: "Salamandra and Aguila",
          description: "Barcelona Supercomputing Center's open-weight Spanish and Iberian models.",
          status: "Not set" as const,
        },
      ],
    },
    {
      id: "usa" as const,
      label: "USA",
      flag: "🇺🇸",
      routed: "Data is processed in the United States.",
      benefits: "The benefit is a broad model choice and mature APIs.",
      risks: "The risk is that data leaves the user's country and is subject to US law.",
      providers: [
        {
          id: "openai" as const,
          name: "OpenAI",
          description: gatewayProvider === "openai" ? `GPT models from OpenAI. ${modelId}` : "GPT models from OpenAI.",
          status: providerStatus("openai"),
        },
        {
          id: "anthropic" as const,
          name: "Anthropic",
          description:
            gatewayProvider === "anthropic"
              ? `Claude models from Anthropic. ${modelId}`
              : "Claude models from Anthropic.",
          status: providerStatus("anthropic"),
        },
        {
          id: "gemini" as const,
          name: "Gemini",
          description: gatewayProvider === "gemini" ? `Google Gemini models. ${modelId}` : "Google Gemini models.",
          status: providerStatus("gemini"),
        },
        {
          id: "venice" as const,
          name: "Venice AI",
          description: "Models from Venice AI.",
          status: "Not set" as const,
        },
        {
          id: "xai" as const,
          name: "xAI Grok",
          description: "Grok models from xAI.",
          status: "Not set" as const,
        },
        {
          id: "meta" as const,
          name: "Meta",
          description: "Llama models from Meta.",
          status: "Not set" as const,
        },
      ],
    },
    {
      id: "china" as const,
      label: "China",
      flag: "🇨🇳",
      routed: "Data is processed in China.",
      benefits: "The benefit is strong low-cost models.",
      risks: "The risk is that data is subject to Chinese law and crosses the border if the user is elsewhere.",
      providers: [
        {
          id: "deepseek" as const,
          name: "DeepSeek",
          description: "DeepSeek models.",
          status: "Not set" as const,
        },
        {
          id: "qwen" as const,
          name: "Qwen (Alibaba)",
          description: "Qwen models from Alibaba.",
          status: "Not set" as const,
        },
        {
          id: "kimi" as const,
          name: "Kimi (Moonshot)",
          description: "Kimi models from Moonshot.",
          status: "Not set" as const,
        },
        {
          id: "glm" as const,
          name: "GLM (Zhipu)",
          description: "GLM models from Zhipu.",
          status: "Not set" as const,
        },
        {
          id: "minimax" as const,
          name: "MiniMax",
          description: "MiniMax models.",
          status: "Not set" as const,
        },
        {
          id: "doubao" as const,
          name: "Doubao (ByteDance)",
          description: "Doubao models from ByteDance.",
          status: "Not set" as const,
        },
      ],
    },
    {
      id: "canada" as const,
      label: "Canada",
      flag: "🇨🇦",
      routed: "Cohere is headquartered in Canada. Where data is processed depends on the provider's hosting terms.",
      benefits: "Canadian company, so it is subject to Canadian privacy law.",
      risks: "Smaller model catalog than the USA and China options, and data residency must be checked per deployment.",
      providers: [
        {
          id: "cohere" as const,
          name: "Cohere",
          description: "Enterprise language models from Cohere, headquartered in Canada.",
          status: "Not set" as const,
        },
      ],
    },
    {
      id: "russia" as const,
      label: "Russia",
      flag: "🇷🇺",
      routed:
        "Russian providers process data in Russia, which requires personal data of Russian citizens to be stored on servers in Russia.",
      benefits: "Strong Russian-language and local business and legal context.",
      risks:
        "Subject to Russian law and state access (for example SORM surveillance requirements), and some Western services and chips are restricted by sanctions.",
      providers: [
        {
          id: "gigachat" as const,
          name: "GigaChat",
          description: "Sber's Russian multimodal family, with open-weight releases.",
          status: "Not set" as const,
        },
        {
          id: "yandexgpt" as const,
          name: "YandexGPT / Alice AI",
          description: "YandexGPT and Alice AI from Yandex.",
          status: "Not set" as const,
        },
        {
          id: "t-lite" as const,
          name: "T-Lite / T-Pro",
          description: "T-Lite and T-Pro from T-Bank.",
          status: "Not set" as const,
        },
        {
          id: "vikhrmodels" as const,
          name: "Vikhrmodels",
          description: "Open-source community fine-tunes for Russian.",
          status: "Not set" as const,
        },
      ],
    },
    {
      id: "india" as const,
      label: "India",
      flag: "🇮🇳",
      routed: "Indian providers process data in India, under the Digital Personal Data Protection Act, 2023.",
      benefits: "Strong support for 22 Indian languages, Hinglish, and voice-first use.",
      risks:
        "Government access can be required under Indian law (for example IT Act section 69), and the DPDP Act's rules are still being implemented.",
      providers: [
        {
          id: "sarvam" as const,
          name: "Sarvam AI",
          description: "Sarvam-30B and Sarvam-105B for Indic languages and voice.",
          status: "Not set" as const,
        },
        {
          id: "krutrim" as const,
          name: "Krutrim",
          description: "Krutrim-2 from Ola, for 22 Indian languages.",
          status: "Not set" as const,
        },
        {
          id: "bharatgpt" as const,
          name: "BharatGPT",
          description: "Multilingual enterprise and public-sector assistant from CoRover.ai.",
          status: "Not set" as const,
        },
        {
          id: "ai4bharat" as const,
          name: "AI4Bharat",
          description: "Open Indic datasets and IndicTrans2 from IIT Madras.",
          status: "Not set" as const,
        },
      ],
    },
    {
      id: "latin-america" as const,
      label: "Latin America",
      flag: "🌎",
      routed:
        "Processing depends on the provider and country. Brazil, Chile, Mexico, Argentina and others each have their own personal-data laws.",
      benefits: "Models trained on Spanish, Portuguese, and Indigenous languages, and regional legal and cultural context.",
      risks:
        "Protection and oversight vary by country, and the open-weight and smaller-budget models may have fewer safety guardrails and less support.",
      providers: [
        {
          id: "latamgpt" as const,
          name: "LatamGPT",
          description: "Open-source 70B model built on Llama 3.1, from Chile's CENIA with institutions in 15 countries.",
          status: "Not set" as const,
        },
        {
          id: "sabia" as const,
          name: "Sabia",
          description: "Portuguese model from Maritaca AI in Brazil.",
          status: "Not set" as const,
        },
        {
          id: "tucano-bode" as const,
          name: "Tucano and Bode",
          description: "Open-weight Brazilian models.",
          status: "Not set" as const,
        },
      ],
    },
  ]

  const compatible = {
    id: "openai-compatible" as const,
    name: "OpenAI-compatible",
    description: "Other APIs that speak the OpenAI protocol.",
    status: "Not set" as const,
    baseUrl: "Not set",
  }

  const configuration: ConfigRow[] = [
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
          <ProviderManagement
            geographies={geographies}
            compatible={compatible}
            activeId={modelConnected ? gatewayProvider : null}
          />
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
