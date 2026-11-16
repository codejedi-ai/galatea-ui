"use client"

import { useEffect, useReducer, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Circle, Loader2, X } from "lucide-react"
import { GlowingGalateaAILogo } from "@/components/loading"
import { Button } from "@/components/ui/button"
import {
  CONVERSATION_STORAGE_KEY,
  INITIAL_STEPS,
  START_STEP_TIMEOUT_MS,
  nextPendingStep,
  resolveStartDestination,
  startReducer,
  type Step,
  type StepId,
} from "@/lib/flow/start"

function newConversationId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readOrCreateConversationId(): string {
  try {
    const existing = localStorage.getItem(CONVERSATION_STORAGE_KEY)
    if (existing) return existing
  } catch {
    // storage unavailable; fall through to a fresh id
  }
  const id = newConversationId()
  try {
    localStorage.setItem(CONVERSATION_STORAGE_KEY, id)
  } catch {
    // ignore
  }
  return id
}

class StepFailure extends Error {}

export default function StartClient() {
  const router = useRouter()
  const [steps, dispatch] = useReducer(startReducer, INITIAL_STEPS)
  const [attempt, setAttempt] = useState(0)
  const stepsRef = useRef<Step[]>(steps)
  stepsRef.current = steps

  useEffect(() => {
    let cancelled = false
    let controller: AbortController | null = null

    // Fetch with a real timeout; returns the Response or throws StepFailure.
    async function request(id: StepId, url: string): Promise<Response> {
      controller = new AbortController()
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        controller?.abort()
      }, START_STEP_TIMEOUT_MS)
      try {
        return await fetch(url, { cache: "no-store", signal: controller.signal })
      } catch (err) {
        if (timedOut) {
          dispatch({ type: "timeout", id })
          throw new StepFailure("timeout")
        }
        if (cancelled) throw new StepFailure("cancelled")
        dispatch({
          type: "fail",
          id,
          detail: `Network error: ${err instanceof Error ? err.message : String(err)}`,
        })
        throw new StepFailure("network")
      } finally {
        clearTimeout(timer)
      }
    }

    async function readJson(id: StepId, res: Response) {
      try {
        return await res.json()
      } catch {
        dispatch({ type: "fail", id, detail: "Unreadable server response" })
        throw new StepFailure("json")
      }
    }

    function requireOk(id: StepId, res: Response) {
      if (!res.ok) {
        dispatch({ type: "fail", id, detail: `Server responded ${res.status}` })
        throw new StepFailure("http")
      }
    }

    async function run() {
      // Let StrictMode's immediate cleanup cancel the first pass before any request goes out.
      await Promise.resolve()
      if (cancelled) return
      try {
        for (let step = nextPendingStep(stepsRef.current); step; step = undefined) {
          let id: StepId = step.id
          if (id === "session") {
            dispatch({ type: "start", id })
            const res = await request(id, "/api/start/session")
            requireOk(id, res)
            const data: { signedIn?: boolean; email?: string } = await readJson(id, res)
            if (cancelled) return
            if (!data.signedIn) {
              dispatch({ type: "done", id, detail: "Not signed in" })
              router.replace(resolveStartDestination({ signedIn: false }))
              return
            }
            dispatch({ type: "done", id, detail: data.email ? `Signed in as ${data.email}` : "Signed in" })
            id = "setup"
          }
          if (id === "setup") {
            dispatch({ type: "start", id })
            const res = await request(id, "/api/start/setup")
            if (res.status === 401) {
              if (cancelled) return
              dispatch({ type: "done", id, detail: "Session expired" })
              router.replace("/signin")
              return
            }
            requireOk(id, res)
            const data: { modelKeyConfigured?: boolean } = await readJson(id, res)
            if (cancelled) return
            dispatch({
              type: "done",
              id,
              detail: data.modelKeyConfigured ? "Model key configured" : "No model key — chat will ask for one",
            })
            id = "companion"
          }
          if (id === "companion") {
            dispatch({ type: "start", id })
            const convId = readOrCreateConversationId()
            const res = await request(id, `/api/companion/conversations/${encodeURIComponent(convId)}`)
            if (res.status === 401) {
              if (cancelled) return
              dispatch({ type: "done", id, detail: "Session expired" })
              router.replace("/signin")
              return
            }
            requireOk(id, res)
            const data: { messages?: unknown[] } = await readJson(id, res)
            if (cancelled) return
            const n = data.messages?.length ?? 0
            dispatch({
              type: "done",
              id,
              detail: n > 0 ? `Loaded ${n} earlier message${n === 1 ? "" : "s"}` : "New conversation",
            })
          }
        }
        if (cancelled) return
        router.replace(resolveStartDestination({ signedIn: true }))
      } catch (err) {
        if (!(err instanceof StepFailure)) {
          if (cancelled) return
          const failing = stepsRef.current.find((s) => s.status === "running")
          if (failing) {
            dispatch({
              type: "fail",
              id: failing.id,
              detail: err instanceof Error ? err.message : "Unexpected error",
            })
          }
        }
      }
    }

    void run()
    return () => {
      cancelled = true
      controller?.abort()
    }
    // router is stable; attempt re-runs the flow after a retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  const doneCount = steps.filter((s) => s.status === "done").length
  const failed = steps.some((s) => s.status === "failed")

  const retry = () => {
    dispatch({ type: "retry" })
    setAttempt((a) => a + 1)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <GlowingGalateaAILogo />
        <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Galatea AI</h1>

        <div
          className="w-full h-2 bg-muted rounded-full mb-6 overflow-hidden"
          role="progressbar"
          aria-label="Startup progress"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={doneCount}
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>

        <ul aria-live="polite" className="w-full space-y-3">
          {steps.map((s) => (
            <li key={s.id} className="flex items-start gap-3">
              <StepIcon status={s.status} />
              <div>
                <p className="text-foreground">{s.label}</p>
                {s.detail && (
                  <p className={s.status === "failed" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                    {s.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {failed && (
          <Button onClick={retry} className="mt-8">
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

function StepIcon({ status }: { status: Step["status"] }) {
  const cls = "h-5 w-5 mt-0.5 shrink-0"
  switch (status) {
    case "running":
      return <Loader2 className={`${cls} animate-spin text-primary`} aria-label="In progress" />
    case "done":
      return <Check className={`${cls} text-primary`} aria-label="Done" />
    case "failed":
      return <X className={`${cls} text-destructive`} aria-label="Failed" />
    default:
      return <Circle className={`${cls} text-muted-foreground`} aria-label="Pending" />
  }
}
