"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type GeographyId = "europe" | "usa" | "china" | "canada" | "russia" | "india" | "latin-america"

export type ProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "venice"
  | "xai"
  | "meta"
  | "cohere"
  | "mistral"
  | "aleph-alpha"
  | "salamandra-aguila"
  | "deepseek"
  | "qwen"
  | "kimi"
  | "glm"
  | "minimax"
  | "doubao"
  | "gigachat"
  | "yandexgpt"
  | "t-lite"
  | "vikhrmodels"
  | "sarvam"
  | "krutrim"
  | "bharatgpt"
  | "ai4bharat"
  | "latamgpt"
  | "sabia"
  | "tucano-bode"
  | "openai-compatible"

export type ProviderStatus = "Connected" | "Not set"

export interface ProviderRow {
  id: ProviderId
  name: string
  description: string
  status: ProviderStatus
  baseUrl?: string
}

export interface GeographyChoice {
  id: GeographyId
  label: string
  flag: string
  routed: string
  benefits: string
  risks: string
  providers: ProviderRow[]
}

function statusBadgeClass(status: ProviderStatus): string {
  if (status === "Connected") return "border-transparent bg-primary/15 text-primary"
  return "border-border bg-transparent text-muted-foreground"
}

function ProviderListItem({
  provider,
  using,
  onUse,
}: {
  provider: ProviderRow
  using: boolean
  onUse: () => void
}) {
  return (
    <li className="flex items-start justify-between gap-4 px-6 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{provider.name}</p>
        <p className="break-words text-sm text-muted-foreground">{provider.description}</p>
        {provider.baseUrl !== undefined && (
          <p className="text-sm text-muted-foreground">Base URL: {provider.baseUrl}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Badge variant="outline" className={statusBadgeClass(provider.status)}>
          {provider.status}
        </Badge>
        <Button type="button" variant={using ? "secondary" : "outline"} size="sm" aria-pressed={using} onClick={onUse}>
          {using ? "Using" : "Use"}
        </Button>
      </div>
    </li>
  )
}

export function ProviderManagement({
  geographies,
  compatible,
  activeId,
}: {
  geographies: GeographyChoice[]
  compatible: ProviderRow
  activeId: ProviderId | null
}) {
  const [geographyId, setGeographyId] = useState<GeographyId>("usa")
  const [usingId, setUsingId] = useState<ProviderId | null>(activeId)
  const selected = geographies.find((geography) => geography.id === geographyId) ?? geographies[0]

  if (!selected) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base">Provider management</CardTitle>
        <Link
          href="/settings/integrations"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Manage keys
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <p className="px-6 pb-3">
          <Link
            href="/dashboard/data-residency"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Where your data goes
          </Link>
        </p>
        <div role="radiogroup" aria-label="Lab geography" className="flex flex-wrap gap-2 px-6">
          {geographies.map((geography) => {
            const chosen = geography.id === selected.id
            return (
              <Button
                key={geography.id}
                type="button"
                role="radio"
                aria-checked={chosen}
                variant={chosen ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setGeographyId(geography.id)}
              >
                <span aria-hidden="true">{geography.flag}</span>
                {geography.label}
              </Button>
            )
          })}
        </div>
        <div className="space-y-1 border-b border-border px-6 py-4 text-sm text-muted-foreground">
          <p>{selected.routed}</p>
          <p>{selected.benefits}</p>
          <p>{selected.risks}</p>
        </div>
        <ul className="divide-y divide-border">
          {selected.providers.map((provider) => (
            <ProviderListItem
              key={provider.id}
              provider={provider}
              using={usingId === provider.id}
              onUse={() => setUsingId(usingId === provider.id ? null : provider.id)}
            />
          ))}
          <ProviderListItem
            provider={compatible}
            using={usingId === compatible.id}
            onUse={() => setUsingId(usingId === compatible.id ? null : compatible.id)}
          />
        </ul>
      </CardContent>
    </Card>
  )
}
