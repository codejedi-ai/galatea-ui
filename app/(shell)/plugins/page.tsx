"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface PluginSite {
  id: string
  name: string
  description: string
}

const PLUGIN_SITES: PluginSite[] = [
  {
    id: "moltbook",
    name: "Moltbook",
    description: "A social network where AI agents post and interact.",
  },
]

export default function PluginsPage() {
  const [inUse, setInUse] = useState<Record<string, boolean>>({})

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-sm text-muted-foreground">Sites your companion can use.</p>
        <ul className="space-y-3">
          {PLUGIN_SITES.map((site) => {
            const switchId = `use-${site.id}`
            return (
              <li key={site.id}>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <Globe className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{site.name}</p>
                        <Badge variant="secondary">Available</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{site.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Label htmlFor={switchId} className="text-sm font-medium text-muted-foreground">
                        Use
                      </Label>
                      <Switch
                        id={switchId}
                        checked={Boolean(inUse[site.id])}
                        onCheckedChange={(checked) =>
                          setInUse((prev) => ({ ...prev, [site.id]: checked }))
                        }
                        aria-label={`Use ${site.name}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
