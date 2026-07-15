/**
 * View shell state machine types (ADR-002 §3 "View shell — state machine",
 * §4 "Data Structures", §7 state diagram).
 *
 * NOTE (F1 scope): `ApiError` will eventually be provided by the backend's
 * `lib/types.ts` (after M1 merge). Until then this file defines a minimal
 * local `ShellApiError` shape so the frontend stays within its allowed
 * paths for this phase. Reconcile with the shared `ApiError` type once
 * `lib/types.ts` lands.
 */

/** The four view states from ADR-002 §7. */
export type ShellViewState = "form" | "analyzing" | "analysisError" | "chat";

/** Minimal local stand-in for the shared `ApiError` type (see file header). */
export interface ShellApiError {
  code: string;
  message: string;
}

/**
 * Generic container for the data that must survive `analyzing` /
 * `analysisError` / `chat` transitions (form fields + selected file per
 * ADR-002 §3, and eventually the built `CaseContext`). The concrete shape
 * is owned by the case-form/chat phases; the reducer only needs to
 * preserve or clear this container correctly.
 */
export type ShellPayload = unknown;

/** ShellState shape per ADR-002 §4. */
export interface ShellState {
  state: ShellViewState;
  apiError: ShellApiError | null;
  payload: ShellPayload | null;
}

export type ShellAction =
  /** form -> analyzing (valid submit) */
  | { type: "SUBMIT_VALID"; payload: ShellPayload }
  /** form -> form (validation errors reported by CaseForm) */
  | { type: "SUBMIT_INVALID" }
  /** analyzing -> chat (200 analysis) */
  | { type: "ANALYSIS_SUCCESS" }
  /** analyzing -> analysisError (4xx/5xx/network) */
  | { type: "ANALYSIS_ERROR"; error: ShellApiError }
  /** analysisError -> analyzing (retry, same payload) */
  | { type: "RETRY" }
  /** analysisError -> form (back, data intact) */
  | { type: "BACK_TO_FORM" }
  /** chat -> form (new case confirmed, full reset) */
  | { type: "NEW_CASE_CONFIRMED" }
  /** chat -> chat (messages / revisions / message retry) */
  | { type: "CHAT_ACTIVITY" };

export const initialShellState: ShellState = {
  state: "form",
  apiError: null,
  payload: null,
};
