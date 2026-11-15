import "server-only"
import { createGateway, type LanguageModel } from "ai"
import { getModelApiKey } from "./credentials"
import { CompanionConfigError } from "./types"

export const DEFAULT_COMPANION_MODEL = "anthropic/claude-sonnet-5.5"

export async function resolveCompanionModel(userId: string, modelOverride?: string): Promise<LanguageModel> {
  const apiKey = await getModelApiKey(userId)
  if (!apiKey) throw new CompanionConfigError("No model key configured", "ai_gateway")
  const id = modelOverride || process.env.COMPANION_DEFAULT_MODEL || DEFAULT_COMPANION_MODEL
  return createGateway({ apiKey })(id)
}
