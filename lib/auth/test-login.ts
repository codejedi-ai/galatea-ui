import "server-only"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"

// Development-only test login. Disabled on Vercel and in production builds
// unless GALATEA_TEST_LOGIN=1 is set explicitly.

type Env = NodeJS.ProcessEnv | Record<string, string | undefined>

export const TEST_USER_ID = "test-user"
export const TEST_SESSION_MAX_AGE = 7 * 24 * 3600
const TOKEN_PREFIX = "gtest"
const DEV_FALLBACK_SECRET = "galatea-dev-only-test-login-secret"

export function isTestLoginEnabled(env: Env = process.env): boolean {
  if (env.VERCEL) return false
  return env.NODE_ENV !== "production" || env.GALATEA_TEST_LOGIN === "1"
}

export function getTestCredentials(env: Env = process.env): { email: string; password: string } {
  return {
    email: env.GALATEA_TEST_EMAIL || "test@galatea.local",
    password: env.GALATEA_TEST_PASSWORD || "galatea-test",
  }
}

export function getTestUser(env: Env = process.env): { userId: string; email: string } {
  return { userId: TEST_USER_ID, email: getTestCredentials(env).email }
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest()
}

export function checkTestCredentials(email: unknown, password: unknown, env: Env = process.env): boolean {
  if (!isTestLoginEnabled(env)) return false
  if (typeof email !== "string" || typeof password !== "string") return false
  const expected = getTestCredentials(env)
  const emailOk = timingSafeEqual(digest(email.trim().toLowerCase()), digest(expected.email.trim().toLowerCase()))
  const passOk = timingSafeEqual(digest(password), digest(expected.password))
  return emailOk && passOk
}

function getSecret(env: Env): string | null {
  if (env.GALATEA_SESSION_SECRET) return env.GALATEA_SESSION_SECRET
  return isTestLoginEnabled(env) ? DEV_FALLBACK_SECRET : null
}

function sign(secret: string, expiry: number): string {
  return createHmac("sha256", secret).update(`${TOKEN_PREFIX}.${expiry}`).digest("base64url")
}

export function createTestSessionToken(env: Env = process.env, now: number = Date.now()): string {
  const secret = getSecret(env)
  if (!secret) throw new Error("test login is disabled")
  const expiry = Math.floor(now / 1000) + TEST_SESSION_MAX_AGE
  return `${TOKEN_PREFIX}.${expiry}.${sign(secret, expiry)}`
}

export function verifyTestSessionToken(
  token: string | undefined,
  env: Env = process.env,
  now: number = Date.now(),
): boolean {
  try {
    if (!token || !isTestLoginEnabled(env)) return false
    const secret = getSecret(env)
    if (!secret) return false
    const parts = token.split(".")
    if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return false
    if (!/^\d+$/.test(parts[1])) return false
    const expiry = Number(parts[1])
    if (!Number.isSafeInteger(expiry) || expiry * 1000 <= now) return false
    const given = Buffer.from(parts[2])
    const want = Buffer.from(sign(secret, expiry))
    if (given.length !== want.length) return false
    return timingSafeEqual(given, want)
  } catch {
    return false
  }
}
