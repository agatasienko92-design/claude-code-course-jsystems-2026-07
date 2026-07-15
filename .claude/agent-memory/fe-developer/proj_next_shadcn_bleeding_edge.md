---
name: proj-next-shadcn-bleeding-edge
description: Course PoC (app/) scaffolded on bleeding-edge Next.js 16 / shadcn 4.13 / AI Elements 1.9 — API surface differs from training data
metadata:
  type: project
---

The course PoC's Next.js app (`app/` in the repo, built during Phase 0 of
`docs/PLAN.md`) was scaffolded with versions newer than typical training
data: Next.js 16.2.10, shadcn CLI 4.13.0, AI Elements 1.9.0, Vitest 4.1.10.
Several things differ from the well-known older APIs — always verify via
Context7/ctx7 before assuming a v3-era shadcn or pre-1.0 AI Elements
behavior:

- **shadcn CLI has a new "base" system** (`-b radix` vs `-b base`, plus named
  presets like `nova`/`vega`/`custom`) replacing the old single "new-york"
  style. Non-interactive init needs explicit `-y -b radix -t next -p nova
  --no-monorepo` (or whichever preset) — `-d/--defaults` alone still prompts
  for a preset name in this version.
- **shadcn's `form` registry item ships with no files** for the `radix-nova`
  style in 4.13.0 (confirmed via `shadcn view form` — empty `files` array).
  The documented replacement is composing forms by hand with
  `react-hook-form` + `@hookform/resolvers/zod` + the `label`/`input`
  primitives (install those two packages directly).
- **AI Elements folded `response` into `message.tsx`** as the `MessageResponse`
  component (Streamdown-based markdown rendering) — there is no standalone
  `response` registry item anymore, it 404s.
- **AI Elements dropped a standalone `loader`** — the loading spinner is now
  shadcn's own `ui/spinner.tsx` (pulled in automatically as a `prompt-input`
  dependency).
- **`@vitejs/plugin-react@6.x` requires `@babel/core@^8`** via an optional
  `@rolldown/plugin-babel` peer, which conflicts with shadcn's own
  `@babel/core@^7` dependency already in the tree → `npm install` ERESOLVE.
  Pin to `@vitejs/plugin-react@5.2.0` (peer range `vite: ^4.2 || ^5 || ^6 ||
  ^7 || ^8`) to avoid it.
- **Tailwind v4 `@theme inline` "inlines" derived values into the utility
  class itself**, not into an overridable custom property. E.g.
  `--radius-xl: calc(var(--radius) * 1.4);` inside `@theme inline` compiles
  to `.rounded-xl{border-radius:calc(var(--radius) * 1.4)}` — overriding
  `--radius-xl` in a later `:root` block has **no effect** on that utility.
  To decouple a derived token from the base scale (e.g. Play's brand needs
  6px controls but 12px cards, not a fixed ratio), edit the literal value
  directly inside the `@theme inline` block itself, not in `:root`.
  Verify by grepping the actual compiled CSS
  (`.next/static/chunks/*.css`) after `npm run build`, not just by reading
  source.

- **`vitest.config.ts` in this repo has no `@/*` alias resolution** (no
  `resolve.alias`, no `vite-tsconfig-paths` plugin) even though
  `tsconfig.json` defines `"@/*": ["./src/*"]` for Next/TypeScript. Any
  Vitest test that imports a file using the `@/` specifier — or imports a
  file that itself uses `@/` internally, e.g. every `components/ui/*.tsx`
  shadcn primitive imports `@/lib/utils` — fails immediately with `Failed to
  resolve import "@/..."`, before any assertion runs. Confirmed by a probe
  test importing `@/components/ui/button` directly (bare error, not a
  business-logic failure). Next's own build (`next build`) resolves the
  alias fine via `tsconfig.json` — this is Vitest-only.
  Precedent workaround (used by `components/shell/Shell.tsx`, and by me for
  `case-form/CaseForm.tsx` + `chat/DecisionBanner.tsx` in Phase 2): skip the
  shadcn `components/ui/*` primitives entirely in any component that gets a
  Vitest component test; hand-roll the markup with plain elements + Tailwind
  utility classes bound to the same CSS vars (`bg-primary`,
  `text-primary-foreground`, `border-border`, `rounded-lg`/`rounded-xl`,
  etc. — these work fine, no alias involved) and use **relative imports**
  (`../../lib/...`) for any shared lib code instead of `@/lib/...`. Native
  `<select>`/`<input type="date">`/`<input type="file">` stand in for
  shadcn Select/Calendar+Popover/dropzone; `lucide-react` icons are safe to
  use directly (no alias dependency). If a future task needs the actual
  shadcn primitives in a tested component, the real fix is adding
  `resolve.alias` (or `vite-tsconfig-paths`) to `vitest.config.ts` — flag it
  explicitly rather than reintroducing this workaround silently, since it's
  a config file usually outside a task's allowed-paths scope.
- **React Compiler ESLint rule (`react-hooks/refs`, via `eslint-config-next`
  16) flags ref access inside closures passed to a call in the render body**
  — e.g. `handleSubmit(onValid, onInvalid)` from react-hook-form, where
  `onValid`/`onInvalid` read `ref.current` — as "Cannot access refs during
  render" **errors** (not warnings), even though the refs are only actually
  read when the returned handler later fires on submit. This only surfaces
  once the component is otherwise "compilable"; a component that already
  bails out via `react-hooks/incompatible-library` (e.g. calling
  react-hook-form's `watch()`, which is flagged as incompatible-to-memoize)
  skips the whole compiler pass and the refs rule doesn't run either — so
  switching `watch()` to `useWatch()` to silence one warning surfaced two
  new errors elsewhere in the same file. If you hit `react-hooks/refs`
  errors around an RHF `handleSubmit`-built handler, the pragmatic fix is
  reverting to `watch()` (accept the one incompatible-library *warning*,
  which doesn't fail `npm run lint`) rather than chasing the refs rule
  through a proper `useEffect`-based rewrite, unless the task specifically
  calls for eliminating that warning too.

See also [[env-windows-dev-server]].
