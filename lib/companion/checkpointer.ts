import "server-only"
import { MemorySaver } from "@langchain/langgraph"

const g = globalThis as unknown as { __companionCheckpointer?: MemorySaver }

/** Process-wide MemorySaver (survives dev HMR). Swap for a durable saver later. */
export function getCheckpointer(): MemorySaver {
  return (g.__companionCheckpointer ??= new MemorySaver())
}
