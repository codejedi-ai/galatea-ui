import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: __dirname,
  // All frontend traffic stays same-origin against the Next.js server; the
  // browser never talks to galatea_server (or Supabase/GoTrue, or Firebase)
  // directly. Each app/api/**/route.ts handler forwards its one RPC
  // server-side, reading the session out of an httpOnly cookie and turning
  // it into the Authorization header the Go server expects.
}

export default nextConfig
