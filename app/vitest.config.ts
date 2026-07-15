import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit/integration tests (Vitest). E2E tests live under `e2e/` and run via
// Playwright (`npm run test:e2e`), not through this config.
// Default environment is jsdom for component tests; route-handler/lib tests
// that need Node APIs can opt out per-file with a `// @vitest-environment node`
// docblock at the top of the file.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    globals: false,
  },
});
