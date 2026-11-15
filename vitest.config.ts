import path from "node:path"
import { defineConfig } from "vitest/config"

const root = __dirname

export default defineConfig({
  resolve: {
    alias: [
      // `server-only` throws outside the react-server condition; stub it for tests.
      { find: /^server-only$/, replacement: path.resolve(root, "lib/companion/__tests__/server-only-stub.ts") },
      { find: /^@\//, replacement: `${root}/` },
    ],
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
  },
})
