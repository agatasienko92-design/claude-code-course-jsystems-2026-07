---
name: project-poc-phase1-backend-worktree
description: PoC Phase 1 backend work happens in a separate worktree (wt-be, branch poc/p1-be) with frozen deps and a narrow allowed-paths scope.
metadata:
  type: project
---

Backend implementation for the course's multimodal-assistant PoC (Phase 1,
"B1/B2" tasks: shared Zod validation + decision-marker parser) is done in a
dedicated git worktree at `C:\Users\labuser\DEV\wt-be` on branch `poc/p1-be`,
separate from the main repo checkout at
`C:\Users\labuser\DEV\claude-code-course-jsystems-2026-07`. The app lives at
`app/` inside that worktree.

**Why:** the course splits work into per-phase/per-agent worktrees so
frontend, backend, and QA agents can progress in parallel without stepping on
each other's files. Tasks come with a strict "ALLOWED PATHS" list and frozen
dependencies (no add/remove packages) — respect that scope exactly.

**How to apply:** when resuming or continuing backend work on this PoC, `cd`
into the worktree path above (not the main repo) before reading/editing
files, and check the task's ALLOWED PATHS before touching anything outside
`app/src/lib/**`. Relevant specs live at `docs/ADR/001-backend-api.md` and
`docs/PRD.md` in that same worktree. See [[reference_zod_v4_api]] for the
Zod API details already verified in this worktree's `app/src/lib/validation/`.

As of 2026-07-15: B1 (validation schemas + types) and B2 (decision marker
parser) are implemented, tested (58 tests passing), lint-clean, and build
succeeds — committed as `acc6b91` and `2cb9f3a` on `poc/p1-be`. A prior agent
had already left correct, spec-complete WIP; this session mainly verified and
committed rather than rewriting.
