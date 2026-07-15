---
name: reference-context7-mcp-fallback
description: Context7 MCP (mcp__context7__query-docs) returns "Invalid API key" in this environment — use the ctx7 CLI fallback instead.
metadata:
  type: reference
---

On this VM, `mcp__context7__query-docs` / `resolve-library-id` fail with
"Invalid API key. Please check your API key. API keys should start with
'ctx7sk' prefix." — the MCP server's key is not configured correctly.

**How to apply:** per CLAUDE.md's documented fallback, use the CLI instead:
`npx ctx7@latest library <name> "<query>"` then
`npx ctx7@latest docs <libraryId> "<query>"`. This worked reliably (e.g.
for zod v4 docs) even though the MCP tool did not. Don't waste a retry on
the MCP tool first if it failed earlier in the same session — go straight
to the CLI.
