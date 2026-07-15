---
name: project-course-worktree-phasing
description: This course project runs QA in isolated git worktrees, one per role, with phased scope that starts before real UI exists.
metadata:
  type: project
---

The "Hardware Service Decision Copilot" course app (repo:
claude-code-course-jsystems-2026-07) is built by parallel role-based agents,
each in its own git worktree off `main`: `wt-be2` (branch `poc/p2-be`),
`wt-fe2` (branch `poc/p2-fe`), `wt-qa2` (branch `poc/p2-qa`). Each worktree
has an assigned dev port to avoid collisions when multiple dev servers run
side by side (QA's was 3003 as of Phase 2 / 2026-07-15).

**Why:** lets be-developer, fe-developer, and qa-engineer work concurrently
without stepping on each other's `npm run dev` or git state.

**How to apply:** When picking up a new QA phase task in this repo, expect
to `EnterWorktree`/`cd` into a dedicated `wt-qa*` path first (or a fresh one
per phase), run `npm ci` there (a clean worktree has no `node_modules`), and
respect the ALLOWED PATHS scope given in the task — other roles own
`src/`, `docs/`, etc. concurrently.

Phase 2 (Q1) shipped only a view-shell placeholder (form/analyzing/chat
states from ADR-002 §7 state diagram) — the real CaseForm and chat UI land
in later phases. E2E specs must only assert what's actually rendered; don't
write specs against ADR-002 §8's full scenario list (decision banners,
chat follow-up, etc.) until those views exist. See
[[technique-synthetic-image-fixtures]] for how fixtures were prepared ahead
of that later phase.
