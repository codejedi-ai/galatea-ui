/** Pure, client-safe model of the /start flow. No server imports. */

export const CONVERSATION_STORAGE_KEY = "galatea.companion.conversationId"
export const START_STEP_TIMEOUT_MS = 10_000

export function resolveStartDestination({ signedIn }: { signedIn: boolean }): "/signin" | "/companion" {
  return signedIn ? "/companion" : "/signin"
}

export type StepId = "session" | "setup" | "companion"
export type StepStatus = "pending" | "running" | "done" | "failed"

export interface Step {
  id: StepId
  label: string
  status: StepStatus
  detail?: string
}

export const INITIAL_STEPS: Step[] = [
  { id: "session", label: "Checking your session", status: "pending" },
  { id: "setup", label: "Checking model key", status: "pending" },
  { id: "companion", label: "Loading your companion", status: "pending" },
]

export type StartAction =
  | { type: "start"; id: StepId }
  | { type: "done"; id: StepId; detail?: string }
  | { type: "fail"; id: StepId; detail: string }
  | { type: "timeout"; id: StepId }
  | { type: "retry" }

export function startReducer(state: Step[], action: StartAction): Step[] {
  switch (action.type) {
    case "start":
      return state.map((s) => (s.id === action.id ? { ...s, status: "running", detail: undefined } : s))
    case "done":
      return state.map((s) => (s.id === action.id ? { ...s, status: "done", detail: action.detail } : s))
    case "fail":
      return state.map((s) => (s.id === action.id ? { ...s, status: "failed", detail: action.detail } : s))
    case "timeout":
      return state.map((s) =>
        s.id === action.id ? { ...s, status: "failed", detail: "Timed out after 10s" } : s,
      )
    case "retry": {
      const idx = state.findIndex((s) => s.status === "failed")
      if (idx === -1) return state
      return state.map((s, i) => (i >= idx ? { ...s, status: "pending", detail: undefined } : s))
    }
  }
}

export function nextPendingStep(state: Step[]): Step | undefined {
  return state.find((s) => s.status === "pending")
}
