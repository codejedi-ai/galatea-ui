import SignInClient from "./signin-client"
import { getTestCredentials, isTestLoginEnabled } from "@/lib/auth/test-login"

// Evaluate env at request time so the dev hint reflects runtime configuration.
export const dynamic = "force-dynamic"

export default function SignInPage() {
  const testHint = isTestLoginEnabled() ? getTestCredentials() : undefined
  return <SignInClient testHint={testHint} />
}
