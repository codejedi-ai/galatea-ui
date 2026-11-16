import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { callGalatea } from "@/lib/galatea-server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/session"
import { getTestUser, verifyTestSessionToken } from "@/lib/auth/test-login"

interface CheckResponse {
  userId?: string
  email?: string
  sessionId?: string
}

/** Resolve the signed-in user from the session cookie, or null. Never throws. */
export const getCurrentUser: () => Promise<{ userId: string; email?: string } | null> = cache(async () => {
  try {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
    if (!token) return null
    if (verifyTestSessionToken(token)) return getTestUser()
    const data = await callGalatea<CheckResponse>("galatea.v1.AuthService/Check", {}, token)
    if (!data?.userId) return null
    return { userId: data.userId, email: data.email }
  } catch {
    return null
  }
})
