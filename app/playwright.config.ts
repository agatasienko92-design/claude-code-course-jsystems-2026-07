import { defineConfig, devices } from "@playwright/test";

// E2E tests (real stack, nothing mocked per AGENTS.md test strategy).
// This worktree's assigned dev port is 3003 (see docs/ADR/000 §... port
// allocation per participant worktree); override with PORT env var if needed.
const PORT = process.env.PORT ?? "3003";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10 * 1000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Windows-friendly: `npm run dev` -> `next dev`, which reads PORT directly
  // from the process environment (cannot come from .env files — Next boots
  // its HTTP server before .env is processed). Passing PORT via `env` below
  // works identically on Windows/macOS/Linux since Playwright sets it on the
  // spawned child process env, not via shell export syntax.
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      PORT,
    },
  },
});
