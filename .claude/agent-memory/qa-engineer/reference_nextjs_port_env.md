---
name: reference-nextjs-port-env
description: Next.js `next dev`/`next start` read the PORT env var directly from process env, not from .env files — relevant for Playwright webServer config.
metadata:
  type: reference
---

Confirmed via Context7 (`/vercel/next.js` docs, v16.1.0) for this project's
stack (Next.js 16.2.10): `next dev` and `next start` honor the `PORT`
environment variable, but it must be set as a real process/shell env var —
it **cannot** be set via `.env`/`.env.local`, because Next's HTTP server
boots before `.env` files are processed. The `-p`/`--port` CLI flag is the
documented alternative/primary way.

**Why:** this repo runs multiple Next.js dev servers in parallel (one per
role worktree, see [[project-course-worktree-phasing]]), each needing a
distinct port. Playwright's `webServer.env` option sets real process env on
the spawned child, so `env: { PORT }` in `playwright.config.ts` works
correctly cross-platform (including Windows) — no shell-specific export
syntax needed, and no risk of Next silently ignoring a `.env`-based PORT.

**How to apply:** when configuring `playwright.config.ts` `webServer` for
any Next.js app in this repo, prefer `webServer.env.PORT` over relying on
`.env` files or assuming the default 3000.
