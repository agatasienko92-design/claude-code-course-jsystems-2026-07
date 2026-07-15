# Implementation Plan — Hardware Service Decision Copilot PoC

**Date:** 2026-07-15
**Status:** Approved for execution (execution starts on explicit command)
**Sources:** `docs/PRD.md` (full MVP scope, AC-01..AC-30), `docs/ADR/000-main-architecture.md`, `docs/ADR/001-backend-api.md`, `docs/ADR/002-frontend.md`, `docs/design-guidelines.md` + `assets/design-tokens.json`

The orchestrator (main Claude Code session) **implements nothing itself**. It delegates every task to one of three specialized agents, provides each task's exact context bundle, reviews results, and merges. Agents: **fe-developer**, **be-developer**, **qa-engineer**.

---

## 1. Ground Rules

### 1.1 Worktree isolation model (chosen)

- Integration branch: **`moja-praca`** (never edited directly by agents).
- Per phase, the orchestrator creates **fresh worktrees + branches off current `moja-praca`**, e.g. for phase 2: `poc/p2-be` (be-developer), `poc/p2-fe` (fe-developer), `poc/p2-qa` (qa-engineer). Command pattern:
  `git worktree add ../wt-be poc/p2-be` (branch created from `moja-praca`).
- Agents work **only inside their own worktree** and commit there after each step (agent makes its own commits — TDD + verification first).
- At each **sync point (M0..M5)** the orchestrator merges agent branches into `moja-praca` in the documented order, resolves anything unexpected (task scoping should make conflicts impossible), removes worktrees (`git worktree remove`), and starts the next phase from the updated `moja-praca`.
- Merge order within a sync point: **backend branch first, then frontend, then qa** (frontend consumes backend types; qa consumes both).
- Nothing is ever pushed unless the user pushes/asks.

### 1.2 Conflict prevention

- **All npm dependencies are installed in Phase 0** (single agent). After M0, `package.json`/`package-lock.json` are **frozen** — no agent may add/remove dependencies without an explicit orchestrator task. This removes the highest-risk shared file from all parallel phases.
- File-ownership matrix per phase (below) keeps parallel tasks on **disjoint paths**; the orchestrator states the allowed paths in every delegation prompt and rejects diffs outside them.
- Parallel dev servers: main worktree uses `PORT=3000`, be worktree `3001`, fe worktree `3002`, qa worktree `3003` (set per command, `.env` is not modified).
- `.env` (gitignored): the orchestrator instructs each agent to copy `app/.env` from the main worktree (or `app/.env.example` → `app/.env`) into its worktree before running the app. Agents never print or commit secret values.

### 1.3 TDD protocol (every implementation step)

Per AGENTS.md, for every feature step the delegated agent must:
1. Write/extend tests **first** (from the spec excerpt in the task card, not from existing code).
2. Run them, confirm they **fail for the expected reason**, note the failure in the task report.
3. Implement the minimum to pass.
4. Run scope verification: `npm test` + `npm run lint` + `npm run build` (in `app/`).
5. **Manual QA validation (mandatory when the step affects runtime/UI behavior, per AGENTS.md TDD step 7):** start the dev server on the worktree's assigned port and drive the affected flow with **Playwright MCP or Playwright CLI** — open the screen, fill the form, submit, follow the flow. Screenshot each step and compare against the Play reference screens in `assets/` + `docs/design-guidelines.md` (CTX-DESIGN). Automated tests can false-pass; nothing ships unseen. Backend-only steps with no UI yet satisfy this by exercising the running endpoint (e.g. a real request against `npm run dev`).
6. Commit with the prescribed message format (`Backend:` / `Frontend:` / `QA:`).

Exception: pure scaffold/config steps (Phase 0) have no unit-testable behavior; their verification is `npm run lint` + `npm run build` + app boots (`npm run dev` responds on `/`) + a Playwright screenshot of the rendered page compared against the Play reference.

**Sync-point gate (M0–M5):** after every phase merge, before declaring the milestone done, the orchestrator (or a delegated qa-engineer task) runs a manual Playwright walkthrough of the merged app on `moja-praca`: open the app, complete the currently implemented flow, screenshot, compare visuals to the Play reference screens in `assets/`. A milestone with a failing or unverified walkthrough is not passed — defects become fix micro-tasks before the next phase starts.

### 1.4 Delegation prompt template (what the orchestrator sends per task)

Every task prompt contains **only** what that task needs (no full PRD/ADR dumps):

```
ROLE CONTEXT   – you are working in worktree <path> on branch <branch>; app lives in app/
TASK           – one step, precisely bounded
ALLOWED PATHS  – exact files/dirs you may create/modify; touching anything else = task failure
SPEC EXCERPT   – the exact PRD ACs / ADR sections / data contracts pasted or referenced by §
INTERFACES     – exact type/field names from ADR-001 §4 that this task must consume/expose
TDD            – the tests to write first, expected failure mode
VERIFY         – commands that must pass before commit + the manual Playwright
                 walkthrough (screenshots vs Play reference) when runtime/UI is affected
COMMIT         – message format + granularity (one commit per step)
DO NOT         – install deps, touch docs/, push, modify files outside ALLOWED PATHS, print env secrets
REPORT BACK    – files changed, test results (before/after), manual-validation result
                 (what was clicked, screenshots taken, visual match verdict), commit hash, deviations
```

### 1.5 Standing context bundles (referenced by task cards)

- **CTX-CONTRACT** — ADR-001 §4 Data Structures (CaseFields, ImageAnalysis, CaseContext, AnalyzeResponse, ApiError + error codes, ChatRequest) — the binding names for both sides.
- **CTX-MARKER** — ADR-001 D-101 (`[DECYZJA: <CATEGORY>]` first-line marker; categories `APPROVED|REJECTED|NEEDS_MORE_INFO|ESCALATE`; strip from display; latest wins; graceful degradation).
- **CTX-DESIGN** — `docs/design-guidelines.md` + ADR-002 "Design system (Play brand)" (purple #6C43BF = actions, pink #E6144B = highlights only, links #266DD9, radii 6/12/3px, Manrope 500/600/700 via next/font/google, buttons never blue).
- **CTX-ENV** — ADR-000 §7 env var table (`OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_TEXT_MODEL`, `OPENROUTER_VISION_MODEL`, `OPENROUTER_MODEL` fallback, `PORT`).
- **CTX-PL** — All UI strings and agent-facing error messages in Polish (PRD AC-29); code/comments in English.
- **CTX-C7** — Context7 handles table from ADR-000 §2; agents use Context7 MCP, fallback `npx ctx7@latest` per CLAUDE.md.

---

## 2. Phases and Task Cards

### Phase 0 — Scaffold (sequential, fe-developer only)

Branch `poc/p0-scaffold`, worktree `../wt-p0`. No parallelism — everything depends on this.

#### S0.1 — Initialize Next.js app
- **Agent:** fe-developer
- **Depends on:** —
- **Allowed paths:** `app/**`
- **Task:** Move `app/README.md` content aside (restore as part of this step after scaffold), run `create-next-app@latest` in `app/` with `--ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`; verify `tsconfig.json` `"strict": true`.
- **Context:** ADR-000 D-2; ADR-002 §3 init steps 1–2; CTX-C7 (`/vercel/next.js`).
- **Verify:** `npm run lint`, `npm run build`, dev server serves `/`.
- **Commit:** `Frontend: scaffold Next.js app (create-next-app, TS strict)`

#### S0.2 — shadcn/ui + AI Elements
- **Agent:** fe-developer
- **Depends on:** S0.1
- **Allowed paths:** `app/**`
- **Task:** `shadcn` init; add components: form, input, select, textarea, calendar, popover, button, card, dialog, badge, alert; install AI Elements via CLI (min: conversation, message, response, prompt-input, loader) into `src/components/ai-elements/`.
- **Context:** ADR-002 §3 init steps 3–4; CTX-C7 (`/shadcn-ui/ui`, `/vercel/ai-elements`).
- **Verify:** lint + build.
- **Commit:** `Frontend: add shadcn/ui components and AI Elements`

#### S0.3 — All dependencies + test infrastructure + env
- **Agent:** fe-developer
- **Depends on:** S0.2
- **Allowed paths:** `app/**`
- **Task:** Install runtime deps `ai`, `@ai-sdk/react`, `@openrouter/ai-sdk-provider`, `sharp`, `zod`; dev deps `vitest`, `@vitejs/plugin-react`, `@playwright/test`, `jsdom`, `@testing-library/react`. Configure `vitest.config.ts` (jsdom + node env split), `playwright.config.ts` skeleton (baseURL from `PORT`), npm scripts (`test`, `test:e2e`), copy `.env.example` → `app/.env.example` adjusted paths if needed. Add a trivial passing smoke unit test so `npm test` is green.
- **Context:** ADR-002 §3 step 5–6; CTX-ENV; AGENTS.md verification commands. **After this commit `package.json` is frozen for all later phases.**
- **Verify:** `npm test`, lint, build.
- **Commit:** `Frontend: add runtime deps and Vitest/Playwright test infrastructure`

#### S0.4 — Play brand theme + app shell layout
- **Agent:** fe-developer
- **Depends on:** S0.3
- **Allowed paths:** `app/src/app/globals.css`, `app/src/app/layout.tsx`, `app/src/app/favicon.ico`, `app/public/**`
- **Task:** Map Play tokens onto Tailwind/shadcn CSS variables in `globals.css`; Manrope via `next/font/google` (500/600/700); copy `assets/logo.svg` + `assets/favicon.ico` into the app; root layout with Polish `<html lang="pl">`, app header (white bg, Play logo left, app title), metadata (Polish title/description).
- **Context:** CTX-DESIGN; `assets/design-tokens.json` (full file — it is small); CTX-PL.
- **Verify:** lint + build + visual boot check (dev server).
- **Commit:** `Frontend: Play brand theme, Manrope font, app layout shell`

**M0 sync:** orchestrator merges `poc/p0-scaffold` → `moja-praca`, removes worktree.

---

### Phase 1 — Shared contracts & pure logic (parallel: be ∥ fe)

Branches `poc/p1-be`, `poc/p1-fe`. Disjoint paths: be owns `app/src/lib/**` + their tests; fe owns `app/src/app/page.tsx`, `app/src/components/shell/**`.

#### B1 — lib/validation (Zod schemas)
- **Agent:** be-developer
- **Depends on:** M0
- **Allowed paths:** `app/src/lib/validation/**`, `app/src/lib/types.ts`, tests alongside
- **Task:** TDD: schemas for CaseFields (requestType enum, category enum per PRD AC-02, modelName 1–200 chars, purchaseDate ISO ≤ today, reason ≥10 chars required iff complaint), file constraints (MIME allowlist jpeg/png/webp, ≤10 MB — pure functions usable client-side on `File` metadata), ChatRequest body. Isomorphic (no Node-only APIs — ADR-002 D-204). Polish error messages.
- **Context:** CTX-CONTRACT; PRD AC-01..07 text; ADR-001 §3.2; CTX-PL.
- **Tests first:** validation matrix incl. edge cases: future date, complaint w/o reason, return w/o reason (OK), 201-char modelName, exactly 10 MB (pass).
- **Commit:** `Backend: shared Zod validation schemas for case form and chat body`

#### B2 — lib/decision (marker parser)
- **Agent:** be-developer
- **Depends on:** M0 (parallel-safe with B1 — same agent, sequential within worktree: B1 → B2)
- **Allowed paths:** `app/src/lib/decision/**` + tests
- **Task:** TDD: parse `[DECYZJA: <CATEGORY>]` from first line; return `{category, displayText}`; null category + unchanged text on missing/malformed; helper "latest marker across message list wins"; never throws.
- **Context:** CTX-MARKER; ADR-000 §10 scenario 4; TAC-001-06.
- **Commit:** `Backend: decision marker protocol parser`

#### F1 — View shell state machine
- **Agent:** fe-developer
- **Depends on:** M0
- **Allowed paths:** `app/src/app/page.tsx`, `app/src/components/shell/**` + tests
- **Task:** TDD: four-state machine `form | analyzing | analysisError | chat` as a pure reducer + shell component with placeholder slots for the screens; transitions exactly per ADR-002 state diagram; state preserved on retry; full reset on confirmed new case.
- **Context:** ADR-002 §3 "View shell", §7 state diagram, D-201; ShellState shape from ADR-002 §4.
- **Tests first:** transition table incl. illegal-transition guards; retry keeps payload; reset clears everything.
- **Commit:** `Frontend: view shell state machine (form→analyzing→chat)`

**M1 sync:** merge `poc/p1-be`, then `poc/p1-fe` → `moja-praca`. Gate: B1 types are now importable by frontend tasks.

---

### Phase 2 — Feature modules (parallel: be ∥ fe ∥ qa)

Branches `poc/p2-be`, `poc/p2-fe`, `poc/p2-qa`.
Path ownership: be `app/src/lib/{image,policies,prompts,llm}/**`; fe `app/src/components/{case-form,chat}/**`; qa `app/e2e/**`, `app/playwright.config.ts`, `app/e2e/fixtures/**`.

#### B3 — lib/image (sharp pipeline)
- **Agent:** be-developer | **Depends on:** M1
- **Task:** TDD: buffer+mime → JPEG, longest edge ≤1024 px, quality ~80, EXIF stripped; constants in one place.
- **Context:** ADR-001 D-103, §3.3; TAC-001-02; test inputs: generated 4000×3000 PNG, already-small image, WebP input.
- **Commit:** `Backend: sharp image compression pipeline`

#### B4 — lib/policies (loader)
- **Agent:** be-developer | **Depends on:** M1 (sequential after B3 in worktree)
- **Task:** TDD: scenario → `docs/policies/{return,complaint}-policy.md` resolved from repo root (path configurable via constant), read at request time, missing file → typed `CONFIG_ERROR`.
- **Context:** ADR-001 D-104, §3.4; repo layout note (app lives in `app/`, policies at `../docs/policies` relative to it).
- **Commit:** `Backend: policy document loader`

#### B5 — lib/prompts (4 builders)
- **Agent:** be-developer | **Depends on:** B1, B4
- **Task:** TDD: vision-complaint, vision-return (structured sections, no decision), decision-complaint, decision-return (embed: PRD §11 behavior spec digest, full policy text, case fields, ImageAnalysis, marker protocol verbatim). Prompts in English, demand Polish output.
- **Context:** ADR-001 §3.5; PRD §11 (full section pasted); CTX-MARKER; TAC-001-05.
- **Commit:** `Backend: prompt builders for vision and decision stages`

#### B6 — lib/llm (provider + model resolution)
- **Agent:** be-developer | **Depends on:** M1
- **Task:** TDD: `createOpenRouter` from env; text model = `OPENROUTER_TEXT_MODEL ?? OPENROUTER_MODEL`, vision analogous; missing key/all models → typed config error; no env values in error messages.
- **Context:** ADR-001 §3.6; CTX-ENV; TAC-001-07; TAC-08; CTX-C7 (`/openrouterteam/ai-sdk-provider`).
- **Commit:** `Backend: OpenRouter provider and model resolution`

#### F3 — Case form
- **Agent:** fe-developer | **Depends on:** M1 (imports B1 schemas)
- **Task:** TDD (component tests): controlled form, all AC-01..08 behaviors — segmented request type toggling reason requirement + helper text, category select, date picker (future disabled), dropzone with MIME/size pre-check + thumbnail + remove X, per-field Polish errors, scroll-to-first-invalid, builds `FormData` on valid submit (callback prop; no fetch yet).
- **Context:** PRD AC-01..09 + §9.1 wireframe (pasted); ADR-002 §3 "Case form", D-204; CTX-DESIGN; CTX-PL; import surface of `lib/validation` (from merged code).
- **Commit:** `Frontend: case form with shared validation and Play styling`

#### F4 — Decision banner
- **Agent:** fe-developer | **Depends on:** M1 (imports B2 parser; sequential after F3 in worktree)
- **Task:** TDD: banner component — four visually distinct variants (semantic status colors, Play geometry: 12px card, badge styling), `data-decision="<CATEGORY>"` attribute, marker line never rendered; helper that runs parser over assistant message text.
- **Context:** CTX-MARKER; PRD AC-20/22; TAC-002-01/02; CTX-DESIGN.
- **Commit:** `Frontend: decision banner component (four categories)`

#### Q1 — Test fixtures + Playwright config
- **Agent:** qa-engineer | **Depends on:** M1
- **Task:** Prepare E2E foundations: fixture photos (generate/source: a damaged-device photo stand-in, a clean-device photo, a >10 MB file, a `.gif`), `playwright.config.ts` (webServer start `npm run dev`, baseURL, trace on failure), smoke spec asserting the form page renders (Polish title, submit button present). No LLM-dependent specs yet.
- **Context:** ADR-000 §10 layers; ADR-002 §8 E2E list (for planning ahead only); AGENTS.md E2E = mock nothing; app boot instructions; PORT assignment 3003.
- **Commit:** `QA: Playwright config and test fixtures, form smoke test`

**M2 sync:** merge be → fe → qa branches into `moja-praca`.

---

### Phase 3 — API routes & chat screen (parallel: be ∥ fe)

Branches `poc/p3-be`, `poc/p3-fe`. Paths: be `app/src/app/api/**` + integration tests; fe `app/src/components/chat/**`.

#### B7 — POST /api/analyze
- **Agent:** be-developer | **Depends on:** M2 (B1,B3,B5,B6 merged)
- **Task:** TDD (integration, AI SDK mock provider at `lib/llm` boundary): multipart parse → validation order (fields → content-sniffed MIME → size) → compress → `generateText` vision call with file part → lenient section parse into ImageAnalysis (+`raw`, mismatch flag default rules per ADR-001 §5) → `AnalyzeResponse`. Error contract: 400 `VALIDATION_ERROR`/`UNSUPPORTED_FILE_TYPE`/`FILE_TOO_LARGE`, 502 `UPSTREAM_LLM_ERROR`, 500 `CONFIG_ERROR`, Polish messages.
- **Context:** ADR-001 §5 (analyze contract, pasted), CTX-CONTRACT; ADR-001 D-102; TAC-001-01..04; TAC-04; CTX-C7 (`/vercel/ai` — generateText file parts, mock provider).
- **Commit:** `Backend: /api/analyze route with vision pipeline and error contract`

#### B8 — POST /api/chat
- **Agent:** be-developer | **Depends on:** B7 (sequential in worktree; shares error mapping helpers)
- **Task:** TDD (integration): validate ChatRequest → load policy by `fields.requestType` → build decision system prompt → convert UI messages → `streamText` → UI message stream response. Empty `messages` ⇒ first decision message. Assert: system prompt contains policy + analysis + marker protocol; complaint/return policy isolation (TAC-06); history forwarded in order; stream consumable; 400/500 paths.
- **Context:** ADR-001 §5 chat contract + §7 sequence diagram; TAC-05, TAC-06, TAC-001-05; CTX-MARKER; CTX-C7 (`/vercel/ai` — streamText → toUIMessageStreamResponse).
- **Commit:** `Backend: /api/chat streaming route with policy-injected decision prompt`

#### F5 — Chat screen (AI Elements + useChat)
- **Agent:** fe-developer | **Depends on:** M2 (F4 banner, AI Elements present)
- **Task:** TDD (component tests with mocked transport): chat view — `useChat` with transport to `/api/chat` carrying `caseContext` in body on every request; **bootstrap first request on mount, exactly once (StrictMode guard, TAC-002-04), no user-authored text rendered before first agent bubble**; Conversation/Message/Response rendering with banner injection per assistant message; PromptInput (Enter send, Shift+Enter newline, disabled while streaming); inline error bubble + "Ponów" retry preserving history.
- **Context:** ADR-002 §3 "Chat screen" + D-202/D-203 (pasted); PRD AC-20..23, AC-27; CTX-MARKER; CTX-PL; CTX-DESIGN; exact ChatRequest shape; CTX-C7 (`/vercel/ai` — useChat transport custom body).
- **Commit:** `Frontend: streaming chat screen with decision banners and bootstrap`

#### F6 — Case summary panel + new-case dialog
- **Agent:** fe-developer | **Depends on:** F5 (same worktree, sequential)
- **Task:** TDD: collapsible summary panel (type badge, category, model, date, reason excerpt, thumbnail → dialog enlarge from client object URL), "Nowe zgłoszenie" with confirm dialog wired to shell reset (PRD AC-24/25; TAC-002-06).
- **Context:** PRD §9.2 (pasted), AC-24/25; CTX-DESIGN; shell reset API from F1.
- **Commit:** `Frontend: case summary panel and new-case confirmation`

**M3 sync:** merge be → fe.

---

### Phase 4 — Full-flow integration (sequential: fe, then qa smoke)

Branch `poc/p4-fe`.

#### F7 — Wire the end-to-end flow
- **Agent:** fe-developer | **Depends on:** M3 (everything merged)
- **Task:** TDD where feasible (state-level tests), then wiring: form submit → POST `/api/analyze` (FormData) → loading state with staged Polish text → on 200 build CaseContext + switch to chat (bootstrap fires) → on error `analysisError` state with cause category, "Spróbuj ponownie" (identical payload, TAC-002-03) and "Wróć do formularza" (data intact); map 400 `fieldErrors` onto form fields. Manual boot check with real key: full happy path once (return + complaint).
- **Context:** ADR-000 §6 + §9.2 data flow; PRD AC-09, AC-26, §4.7; ApiError contract; CTX-PL.
- **Commit:** `Frontend: end-to-end wiring form→analyze→chat with error/retry states`

#### Q2 — Manual smoke test (real stack, real LLM)
- **Agent:** qa-engineer | **Depends on:** F7 merged (**M4**)
- **Task:** Phase-1-QA per agent definition: start app with real `.env`, drive the full flow via Playwright MCP (return happy path, complaint happy path, validation errors, new-case reset), screenshot each step, compare against PRD §9 wireframes + CTX-DESIGN (purple actions, Manrope, banner variants). Produce a defect list (file, expected vs actual, PRD/ADR reference). **No new automated tests in this task.**
- **Context:** PRD §9 (pasted), §4 flows; CTX-DESIGN; how to run the app; explicit instruction: report defects, do not fix.
- **Commit:** `QA: manual smoke test report` (report file under `app/e2e/reports/` or task report only — orchestrator decides based on findings)

**Defect loop:** orchestrator converts each defect into a micro-task card routed to fe-developer or be-developer (new small worktree branches `poc/p4-fix-*`), each with TDD reproduction test where applicable. Repeat Q2 spot-checks until smoke passes.

---

### Phase 5 — Automated E2E + final verification (qa-engineer)

Branch `poc/p5-qa`.

#### Q3 — E2E suite (real LLM, full)
- **Agent:** qa-engineer | **Depends on:** Q2 green
- **Task:** TDD-style: codify verified behavior into Playwright specs — (1) complaint happy path: fixture photo + valid form → chat opens → first bubble has `data-decision` + non-empty justification + next-steps section; (2) return happy path without reason; (3) follow-up message → new streamed bubble, input disabled while streaming; (4) new-case reset with confirm/cancel; (5) validation UX (empty submit → field errors, first invalid focused; >10 MB and `.gif` rejected client-side). Assert flow/UI invariants only — never exact LLM wording (categories: assert attribute exists, not which one, except where fixture design makes it stable).
- **Context:** ADR-002 §8 E2E table + TAC-002-01/02/05/06; ADR-000 §10 scenarios 9–10; fixtures from Q1; run instructions with real key.
- **Commit:** `QA: Playwright E2E suite (happy paths, follow-up, reset, validation)`

#### Q4 — Final verification & release report
- **Agent:** qa-engineer | **Depends on:** Q3
- **Task:** Full gate on merged `moja-praca`: `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`, app boots, TAC checklist sweep (ADR-000 TAC-01..09, ADR-001 TAC-001-01..07, ADR-002 TAC-002-01..07) — mark each pass/fail with evidence. Report to orchestrator; failures → defect loop.
- **Commit:** `QA: final verification report against TAC checklists`

**M5 sync:** merge, worktrees removed. PoC done. Orchestrator presents final summary; user decides about push.

---

## 3. Dependency Matrix

| Task | Agent | Depends on | Blocks | Runs in parallel with |
|---|---|---|---|---|
| S0.1 | fe | — | everything | — |
| S0.2 | fe | S0.1 | F3–F7, Q1 | — |
| S0.3 | fe | S0.2 | all tests, all deps users | — |
| S0.4 | fe | S0.3 | visual work F3+ | — |
| B1 | be | M0 | B5, B7, B8, F3 | F1 |
| B2 | be | M0 (after B1) | F4, Q3 asserts | F1 |
| F1 | fe | M0 | F5, F6, F7 | B1, B2 |
| B3 | be | M1 | B7 | F3, F4, Q1 |
| B4 | be | M1 | B5, B8 | F3, F4, Q1 |
| B5 | be | B1, B4 | B7, B8 | F3, F4, Q1 |
| B6 | be | M1 | B7, B8 | F3, F4, Q1 |
| F3 | fe | M1 (B1 merged) | F7 | B3–B6, Q1 |
| F4 | fe | M1 (B2 merged) | F5 | B3–B6, Q1 |
| Q1 | qa | M1 | Q3 | B3–B6, F3, F4 |
| B7 | be | M2 | F7, Q2 | F5, F6 |
| B8 | be | B7 | F7, Q2 | F5, F6 |
| F5 | fe | M2 | F6, F7 | B7, B8 |
| F6 | fe | F5 | F7 | B7, B8 |
| F7 | fe | M3 | Q2 | — (solo) |
| Q2 | qa | M4 (F7) | Q3, defect loop | — (solo, real app) |
| Q3 | qa | Q2 green | Q4 | — |
| Q4 | qa | Q3 | done | — |

**Sync points:** M0 after S0.4 · M1 after {B1,B2,F1} · M2 after {B3–B6,F3,F4,Q1} · M3 after {B7,B8,F5,F6} · M4 after F7 · M5 after Q4.

Within one agent's worktree, its tasks run **sequentially** (B1→B2; B3→B4→B5→B6; F3→F4; F5→F6) — parallelism exists **between** agents, never inside one worktree.

## 4. Parallel Schedule (wall-clock view)

```
Phase 0:  fe: S0.1 → S0.2 → S0.3 → S0.4                         [M0]
Phase 1:  be: B1 → B2        ∥  fe: F1                           [M1]
Phase 2:  be: B3→B4→B5→B6    ∥  fe: F3 → F4    ∥  qa: Q1         [M2]
Phase 3:  be: B7 → B8        ∥  fe: F5 → F6                      [M3]
Phase 4:  fe: F7                                                 [M4]
          qa: Q2 → (defect micro-tasks → fe/be) → Q2 re-check
Phase 5:  qa: Q3 → Q4                                            [M5]
```

## 5. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `sharp` native install on Windows VM | Installed once in S0.3 (prebuilt binaries); if install fails, orchestrator opens a spike task before Phase 2 |
| `create-next-app` non-empty dir | S0.1 explicitly moves `app/README.md` aside first (ADR-000 D-2 consequence) |
| useChat bootstrap double-fire (StrictMode) | Dedicated guard + component test (TAC-002-04) in F5 |
| Model omits `[DECYZJA:]` marker | Parser degrades gracefully (B2); E2E asserts banner on mocked-stable prompts; if real-model omission recurs → D-101 review trigger |
| E2E nondeterminism / token cost (real LLM) | Assertions on flow/UI invariants only; E2E runs are explicit (Q2/Q3/Q4), never in a watch loop |
| Parallel worktrees fight over ports | Fixed port assignment per worktree (§1.2) |
| package.json merge conflicts | All deps front-loaded in S0.3; dependency freeze after M0 |
| Policies path from `app/` worktree | B4 resolves repo-root relative with configurable constant + unit test |
