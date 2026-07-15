---
name: reference-zod-v4-api
description: Zod v4.4.3 API quirks used in app/ — custom error messages, z.iso.date, addIssue shape. Verified against installed node_modules/zod types, not training data.
metadata:
  type: reference
---

The course app (`app/package.json`) pins `zod: ^4.4.3`. Verified against
`app/node_modules/zod/v4/**/*.d.ts` (Context7 MCP was unavailable — invalid
API key — so this was cross-checked directly against installed type defs
instead of docs).

- **Custom error messages**: pass a plain string as the second arg —
  `z.string("msg")`, `.min(1, "msg")`, `.max(200, "msg")`, `z.enum([...], "msg")`,
  `z.iso.date("msg")`, `z.array(schema, "msg")`. This form is accepted
  everywhere (`params?: string | $Zod*Params`) and is simpler than the
  object form (`{ error: "msg" }` in current v4 docs, `{ message: "msg" }`
  in v3-era docs still present in the repo) — use the string shorthand for
  consistency.
- **`z.iso.date()`** validates an ISO `YYYY-MM-DD` string (re-exported as
  `export * as iso from "./iso.js"` in `zod/v4/classic/external.d.ts`).
  Chain `.refine()` on it for extra rules (e.g. "not in the future").
- **`superRefine` / `ctx.addIssue`**: for cross-field validation use
  `ctx.addIssue({ code: "custom", path: ["field"], message: "..." })`.
  `$ZodIssueCustom` only requires `code: "custom"`; `message`/`path` come
  from `$ZodIssueBase` and are safe to always supply.
- **`.flatten()`** still works in v4 the same as v3 for turning a
  `safeParse` failure into `{ formErrors, fieldErrors }`.

See [[project-poc-phase1-backend-worktree]] for where this was applied
(`app/src/lib/validation/*`).
