---
name: project-poc-phase2-backend-worktree
description: PoC Phase 2 backend (B3-B6, image/policies/prompts/llm) happens in worktree wt-be2, branch poc/p2-be — a separate worktree from Phase 1's wt-be.
metadata:
  type: project
---

Phase 2 backend tasks (B3 sharp image compression, B4 policy loader, B5
prompt builders, B6 OpenRouter provider/model resolution) for the course's
multimodal-assistant PoC are done in `C:\Users\labuser\DEV\wt-be2` on branch
`poc/p2-be` — a **different** worktree from Phase 1's `wt-be`
(`poc/p1-be`, see [[project-poc-phase1-backend-worktree]]). Each phase gets
its own fresh worktree; don't assume the previous phase's worktree path
still applies.

**Why:** same per-phase/per-agent worktree isolation pattern as Phase 1, now
with parallel `wt-fe2` (frontend) and `wt-qa2` (QA) siblings for the same
phase.

**How to apply:** always verify the current phase's worktree path via
`git worktree list` from the main repo rather than trusting a stale path
from memory — confirm the branch name matches the task before editing.

As of 2026-07-15: B3-B6 implemented TDD, 133 tests passing, lint clean,
build green, committed as `040f769`, `f7639e6`, `32435bf`, `7ded6d8` on
`poc/p2-be`. See [[reference-npm-ci-windows-file-lock-race]] and
[[reference-openrouter-provider-overload-gotcha]] for two environment/API
gotchas hit this session.
