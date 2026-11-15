import "server-only"
import { createUIMessageStreamResponse, generateId, type UIMessageChunk } from "ai"
import type { CompanionEvent } from "./types"

/**
 * Adapt companion events to the AI SDK UI message stream (SSE) consumed by
 * `useChat`. Text -> text parts; tool calls -> dynamic tool parts; errors -> error chunks.
 */
export function companionEventsToUIMessageStreamResponse(events: AsyncIterable<CompanionEvent>): Response {
  const stream = new ReadableStream<UIMessageChunk>({
    async start(controller) {
      let textId: string | null = null
      const closeText = () => {
        if (textId) controller.enqueue({ type: "text-end", id: textId })
        textId = null
      }
      controller.enqueue({ type: "start" })
      controller.enqueue({ type: "start-step" })
      try {
        for await (const ev of events) {
          switch (ev.type) {
            case "text-delta":
              if (!textId) {
                textId = generateId()
                controller.enqueue({ type: "text-start", id: textId })
              }
              controller.enqueue({ type: "text-delta", id: textId, delta: ev.delta })
              break
            case "tool-call":
              closeText()
              controller.enqueue({
                type: "tool-input-available",
                toolCallId: ev.toolCallId,
                toolName: ev.action,
                input: ev.input,
                dynamic: true,
              })
              break
            case "tool-result":
              if (ev.isError) {
                controller.enqueue({
                  type: "tool-output-error",
                  toolCallId: ev.toolCallId,
                  errorText: typeof ev.output === "string" ? ev.output : "Action failed",
                  dynamic: true,
                })
              } else {
                controller.enqueue({
                  type: "tool-output-available",
                  toolCallId: ev.toolCallId,
                  output: ev.output,
                  dynamic: true,
                })
              }
              break
            case "error":
              closeText()
              controller.enqueue({ type: "error", errorText: ev.message })
              break
            case "finish":
              closeText()
              break
          }
        }
      } catch (err) {
        closeText()
        controller.enqueue({ type: "error", errorText: err instanceof Error ? err.message : "Stream failed" })
      }
      closeText()
      controller.enqueue({ type: "finish-step" })
      controller.enqueue({ type: "finish" })
      controller.close()
    },
  })
  return createUIMessageStreamResponse({ stream })
}
