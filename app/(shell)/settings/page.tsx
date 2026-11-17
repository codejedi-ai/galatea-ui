import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const links = [
  { href: "/settings/integrations", title: "Integrations", description: "API keys for models and voice" },
  { href: "/settings/agents", title: "Agents", description: "Connect an agent runtime, or run standalone" },
]

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle>{l.title}</CardTitle>
                <CardDescription>{l.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
