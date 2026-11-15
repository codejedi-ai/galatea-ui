import "server-only"

export interface MemoryStore {
  recall(userId: string, personaId: string, query: string): Promise<string[]>
  remember(userId: string, personaId: string, turn: { user: string; assistant: string }): Promise<void>
}

export const noopMemory: MemoryStore = {
  async recall() {
    return []
  },
  async remember() {},
}

/** Simple per user+persona list of recent turns. Process-local; swap for a real store later. */
export class InMemoryMemoryStore implements MemoryStore {
  private turns = new Map<string, string[]>()
  constructor(
    private maxStored = 50,
    private recallCount = 5,
  ) {}

  private key(userId: string, personaId: string) {
    return JSON.stringify([userId, personaId])
  }

  async recall(userId: string, personaId: string, _query: string): Promise<string[]> {
    return (this.turns.get(this.key(userId, personaId)) ?? []).slice(-this.recallCount)
  }

  async remember(userId: string, personaId: string, turn: { user: string; assistant: string }): Promise<void> {
    const k = this.key(userId, personaId)
    const list = this.turns.get(k) ?? []
    list.push(`User said: ${clip(turn.user)} | You replied: ${clip(turn.assistant)}`)
    this.turns.set(k, list.slice(-this.maxStored))
  }
}

function clip(s: string, n = 200) {
  return s.length > n ? `${s.slice(0, n)}...` : s
}

const g = globalThis as unknown as { __companionMemory?: MemoryStore }
export const defaultMemory: MemoryStore = (g.__companionMemory ??= new InMemoryMemoryStore())
