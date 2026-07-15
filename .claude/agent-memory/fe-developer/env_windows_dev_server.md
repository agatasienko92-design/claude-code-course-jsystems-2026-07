---
name: env-windows-dev-server
description: Windows/Turbopack quirks when running `next dev` in the background for manual verification
metadata:
  type: project
---

On this VM (Windows Server 2022, Git Bash tool), backgrounding `npm run dev`
(Next.js + Turbopack) with the Bash tool's `run_in_background` spawns a
Turbopack child process that **outlives** `TaskStop` — the wrapper task is
killed but the actual listener on the port stays up. A second `PORT=3002 npm
run dev` in the same or a later turn then fails with `EADDRINUSE`.

**Why:** Turbopack detaches its dev-server process from the npm/node wrapper
PID that `TaskStop` targets.

**How to apply:** After using a background dev server for a manual/Playwright
verification step, don't trust `TaskStop` alone — verify the port is actually
free with `netstat -ano | grep ":<port>"`, and if a `LISTENING` entry remains,
`taskkill //F //PID <pid>` it before finishing. Do this before ending a task
that used a dev server, so the next phase/agent doesn't hit a stale
EADDRINUSE.

Also: `curl` is blocked by this environment's Bash permission policy (denied
regardless of target, including localhost). Use the Playwright MCP tools
(`browser_navigate` + `browser_evaluate`/`browser_take_screenshot`) to verify
a dev server boots and renders, instead of curl.

See also [[proj-next-shadcn-bleeding-edge]] for the versions encountered
during Phase 0 scaffold of the course PoC (`app/`).

**Stale Playwright MCP browser ("Browser is already in use for ... use
--isolated"):** on this shared VM, a prior interrupted session can leave the
Playwright MCP's dedicated Chrome profile (`%LOCALAPPDATA%\ms-playwright-mcp\
mcp-chrome-<hash>`) running, so a fresh `browser_navigate`/`browser_tabs
list`/`browser_close` call in a new conversation fails with that error
instead of connecting.

**Why:** the MCP server allows only one live connection to that profile; the
leftover Chrome process from the earlier session still holds it.

**How to apply:** `tasklist //FI "IMAGENAME eq chrome.exe"` then `wmic
process where "name='chrome.exe'" get ProcessId,CommandLine` to confirm the
process's `--user-data-dir` points at the `ms-playwright-mcp` profile (not
the user's real browser) — only then `taskkill //F //PID <main-pid> //T` the
top-level one (`--remote-debugging-pipe`, no `--type=`) to cascade-kill its
children. Retry `browser_navigate` after. Also remember screenshots/snapshots
saved by the Playwright MCP tools land relative to the MCP server's own cwd
(observed: the outer repo root), not the worktree/bash cwd — search for the
file there if a `Read` on the reported path 404s, then delete it if it's
debris outside your worktree.
