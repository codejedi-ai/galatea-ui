import "server-only"
import { callGalatea } from "@/lib/galatea-server"
import type { CompanionChannel, Persona } from "./types"

export const DEFAULT_PERSONA: Persona = {
  id: "galatea-default",
  name: "Galatea",
  description: "A warm, curious, emotionally attentive companion.",
  systemPrompt:
    "You are Galatea, a warm, attentive and playful companion. You remember what the user tells you, " +
    "ask thoughtful follow-up questions, and respond with genuine personality rather than generic assistant boilerplate. " +
    "Stay in character, be kind and honest, and never claim to be human if sincerely asked.",
  greeting: "Hi, I'm Galatea. What's on your mind?",
}

interface BotLike {
  id: string
  name: string
  description?: string
  avatarUrl?: string
}

export function personaFromBot(bot: BotLike): Persona {
  return {
    id: bot.id,
    name: bot.name,
    description: bot.description,
    systemPrompt:
      `You are ${bot.name}, a persona-driven companion.` +
      (bot.description ? ` About you: ${bot.description}` : "") +
      " Stay in character, be warm and honest, and never claim to be human if sincerely asked.",
  }
}

export async function loadPersonaFromBot(botId: string, accessToken: string): Promise<Persona | null> {
  try {
    const data = await callGalatea<{ bots?: BotLike[] }>("galatea.v1.BotService/BotAll", {}, accessToken)
    const bot = (data.bots ?? []).find((b) => b.id === botId)
    return bot ? personaFromBot(bot) : null
  } catch {
    return null
  }
}

export function buildSystemPrompt(persona: Persona, memories: string[], channel: CompanionChannel): string {
  const parts: string[] = [persona.systemPrompt ?? `You are ${persona.name}.`]
  if (persona.description && !persona.systemPrompt?.includes(persona.description)) {
    parts.push(`About you: ${persona.description}`)
  }
  if (memories.length > 0) {
    parts.push("Things you remember from earlier conversations:\n" + memories.map((m) => `- ${m}`).join("\n"))
  }
  if (channel === "voice") {
    parts.push(
      "This is a spoken voice conversation. Keep replies short and speakable: one to three brief sentences, " +
        "no markdown, no lists, no emojis, no special formatting.",
    )
  }
  return parts.join("\n\n")
}
