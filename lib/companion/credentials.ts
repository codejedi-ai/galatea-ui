import "server-only"

/**
 * The ONLY place that reads AI_GATEWAY_API_KEY. A per-user Vault lookup will
 * replace this later; callers must treat the key as secret (never log/persist).
 */
export async function getModelApiKey(_userId: string): Promise<string | null> {
  return process.env.AI_GATEWAY_API_KEY || null
}

/** Presence-only check; never returns the key itself. */
export async function getCredentialStatus(userId: string): Promise<{ aiGateway: boolean }> {
  return { aiGateway: !!(await getModelApiKey(userId)) }
}
