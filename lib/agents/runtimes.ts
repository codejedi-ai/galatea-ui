export type RuntimeId = "none" | "openclaw" | "nanobot" | "hermes"
export type RuntimeStatus = "available" | "coming-soon"

export interface RuntimeDef {
  id: RuntimeId
  name: string
  description: string
  status: RuntimeStatus
}

export const RUNTIMES: RuntimeDef[] = [
  {
    id: "none",
    name: "Chat only (no runtime)",
    description: "Your companion runs here in chat. Nothing else to set up.",
    status: "available",
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    description: "An optional body for your companion: OpenClaw lets it act, use tools and run tasks.",
    status: "coming-soon",
  },
  {
    id: "nanobot",
    name: "nanobot",
    description: "An optional body for your companion: nanobot lets it act, use tools and run tasks.",
    status: "coming-soon",
  },
  {
    id: "hermes",
    name: "Hermes",
    description: "An optional body for your companion: Hermes lets it act, use tools and run tasks.",
    status: "coming-soon",
  },
]
