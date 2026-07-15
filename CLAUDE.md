# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Claude Code Instructions

- Use Context7 MCP (`resolve-library-id` + `query-docs`) for any library used in the project. If the MCP is unavailable (e.g. invalid `CONTEXT7_API_KEY`), fall back to the ctx7 CLI: `npx ctx7@latest library <name> "<query>"`, then `npx ctx7@latest docs <libraryId> "<query>"`.
- Use proactively below sub-agents:
  - fe-developer
  - be-developer
  - qa-engineer
