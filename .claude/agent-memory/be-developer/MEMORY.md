# be-developer Memory Index

- [Zod v4 API quirks](reference_zod_v4_api.md) — custom error message shorthand, z.iso.date, addIssue shape (verified against installed types)
- [Context7 MCP fallback](reference_context7_mcp_fallback.md) — MCP query-docs returns invalid API key here; use `npx ctx7@latest` CLI instead
- [PoC Phase 1 backend worktree](project_poc_phase1_backend_worktree.md) — backend work happens in `wt-be` worktree (branch `poc/p1-be`), frozen deps, narrow allowed paths
- [PoC Phase 2 backend worktree](project_poc_phase2_backend_worktree.md) — Phase 2 (B3-B6) is in a DIFFERENT worktree `wt-be2` (branch `poc/p2-be`) — verify path per phase
- [npm ci Windows file-lock race](reference_npm_ci_windows_file_lock_race.md) — don't run a second npm ci while a backgrounded one is still finishing; causes ENOTEMPTY loops
- [OpenRouter provider overload gotcha](reference_openrouter_provider_overload_gotcha.md) — use `provider.chat(modelId)`, not bare `provider(modelId)`; only `next build` typecheck catches the overload mismatch
