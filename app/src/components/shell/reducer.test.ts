import { describe, expect, it } from "vitest";

import { shellReducer } from "./reducer";
import { initialShellState } from "./types";
import type { ShellAction, ShellApiError, ShellState, ShellViewState } from "./types";

/**
 * Transition table tests for the view shell state machine
 * (ADR-002 §3, §4, §7). Written before `reducer.ts` exists (TDD).
 */

const SAMPLE_PAYLOAD = { typ: "reklamacja", powod: "Uszkodzony produkt" };
const SAMPLE_ERROR: ShellApiError = { code: "UPSTREAM_LLM_ERROR", message: "Usluga niedostepna" };

function state(partial: Partial<ShellState>): ShellState {
  return {
    state: "form",
    apiError: null,
    payload: null,
    ...partial,
  };
}

// One representative action instance per action type, used to drive the
// exhaustive illegal-transition sweep below.
const SAMPLE_ACTIONS: Record<ShellAction["type"], ShellAction> = {
  SUBMIT_VALID: { type: "SUBMIT_VALID", payload: SAMPLE_PAYLOAD },
  SUBMIT_INVALID: { type: "SUBMIT_INVALID" },
  ANALYSIS_SUCCESS: { type: "ANALYSIS_SUCCESS" },
  ANALYSIS_ERROR: { type: "ANALYSIS_ERROR", error: SAMPLE_ERROR },
  RETRY: { type: "RETRY" },
  BACK_TO_FORM: { type: "BACK_TO_FORM" },
  NEW_CASE_CONFIRMED: { type: "NEW_CASE_CONFIRMED" },
  CHAT_ACTIVITY: { type: "CHAT_ACTIVITY" },
};

// The exact edges allowed by ADR-002 §7's state diagram.
const LEGAL_FROM: Record<ShellAction["type"], ShellViewState[]> = {
  SUBMIT_VALID: ["form"],
  SUBMIT_INVALID: ["form"],
  ANALYSIS_SUCCESS: ["analyzing"],
  ANALYSIS_ERROR: ["analyzing"],
  RETRY: ["analysisError"],
  BACK_TO_FORM: ["analysisError"],
  NEW_CASE_CONFIRMED: ["chat"],
  CHAT_ACTIVITY: ["chat"],
};

const ALL_STATES: ShellViewState[] = ["form", "analyzing", "analysisError", "chat"];

describe("shellReducer — legal transitions", () => {
  it("form --(valid submit)--> analyzing, stores payload, clears apiError", () => {
    const prev = state({ state: "form", apiError: null, payload: null });
    const next = shellReducer(prev, { type: "SUBMIT_VALID", payload: SAMPLE_PAYLOAD });

    expect(next).toEqual({ state: "analyzing", apiError: null, payload: SAMPLE_PAYLOAD });
  });

  it("form --(validation errors)--> form (self-loop, no-op)", () => {
    const prev = state({ state: "form", apiError: null, payload: null });
    const next = shellReducer(prev, { type: "SUBMIT_INVALID" });

    expect(next).toBe(prev);
  });

  it("analyzing --(200 analysis)--> chat, clears apiError, keeps payload", () => {
    const prev = state({ state: "analyzing", apiError: null, payload: SAMPLE_PAYLOAD });
    const next = shellReducer(prev, { type: "ANALYSIS_SUCCESS" });

    expect(next).toEqual({ state: "chat", apiError: null, payload: SAMPLE_PAYLOAD });
    expect(next.payload).toBe(SAMPLE_PAYLOAD);
  });

  it("analyzing --(4xx/5xx/network)--> analysisError, sets apiError, keeps payload", () => {
    const prev = state({ state: "analyzing", apiError: null, payload: SAMPLE_PAYLOAD });
    const next = shellReducer(prev, { type: "ANALYSIS_ERROR", error: SAMPLE_ERROR });

    expect(next).toEqual({ state: "analysisError", apiError: SAMPLE_ERROR, payload: SAMPLE_PAYLOAD });
  });

  it("analysisError --(retry)--> analyzing, keeps the SAME payload reference, clears apiError", () => {
    const prev = state({ state: "analysisError", apiError: SAMPLE_ERROR, payload: SAMPLE_PAYLOAD });
    const next = shellReducer(prev, { type: "RETRY" });

    expect(next.state).toBe("analyzing");
    expect(next.apiError).toBeNull();
    expect(next.payload).toBe(SAMPLE_PAYLOAD);
  });

  it("analysisError --(back)--> form, data intact, clears apiError", () => {
    const prev = state({ state: "analysisError", apiError: SAMPLE_ERROR, payload: SAMPLE_PAYLOAD });
    const next = shellReducer(prev, { type: "BACK_TO_FORM" });

    expect(next.state).toBe("form");
    expect(next.apiError).toBeNull();
    expect(next.payload).toBe(SAMPLE_PAYLOAD);
  });

  it("chat --(new case confirmed)--> form, full reset (payload and apiError cleared)", () => {
    const prev = state({ state: "chat", apiError: null, payload: SAMPLE_PAYLOAD });
    const next = shellReducer(prev, { type: "NEW_CASE_CONFIRMED" });

    expect(next).toEqual({ state: "form", apiError: null, payload: null });
  });

  it("chat --(messages/revisions)--> chat (self-loop, no-op)", () => {
    const prev = state({ state: "chat", apiError: null, payload: SAMPLE_PAYLOAD });
    const next = shellReducer(prev, { type: "CHAT_ACTIVITY" });

    expect(next).toBe(prev);
  });
});

describe("shellReducer — illegal transitions are guarded no-ops", () => {
  for (const from of ALL_STATES) {
    for (const actionType of Object.keys(SAMPLE_ACTIONS) as ShellAction["type"][]) {
      if (LEGAL_FROM[actionType].includes(from)) continue;

      it(`ignores ${actionType} while in "${from}" (returns the same state reference)`, () => {
        const prev = state({ state: from, apiError: null, payload: SAMPLE_PAYLOAD });
        const next = shellReducer(prev, SAMPLE_ACTIONS[actionType]);

        expect(next).toBe(prev);
      });
    }
  }
});

describe("shellReducer — initial state", () => {
  it("starts in form with no error and no payload", () => {
    expect(initialShellState).toEqual({ state: "form", apiError: null, payload: null });
  });
});
