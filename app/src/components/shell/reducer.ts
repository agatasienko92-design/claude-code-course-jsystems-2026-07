import type { ShellAction, ShellState, ShellViewState } from "./types";

/**
 * Pure state-machine reducer for the view shell (ADR-002 §3, §7).
 *
 * Every edge in the state diagram is implemented as one action legal from
 * exactly one source state. Any action dispatched from a state it isn't
 * legal in is ignored: the reducer returns the exact same `state` object
 * reference (a React `useReducer` bail-out no-op), never a shallow copy.
 */
export function shellReducer(current: ShellState, action: ShellAction): ShellState {
  switch (action.type) {
    case "SUBMIT_VALID":
      if (current.state !== "form") return current;
      return { state: "analyzing", apiError: null, payload: action.payload };

    case "SUBMIT_INVALID":
      // form -> form: validation errors are rendered by CaseForm itself;
      // the shell state doesn't change.
      if (current.state !== "form") return current;
      return current;

    case "ANALYSIS_SUCCESS":
      if (current.state !== "analyzing") return current;
      return { ...current, state: "chat", apiError: null };

    case "ANALYSIS_ERROR":
      if (current.state !== "analyzing") return current;
      return { ...current, state: "analysisError", apiError: action.error };

    case "RETRY":
      // analysisError -> analyzing: payload is preserved (same reference)
      // so the identical request can be re-sent (TAC-002-03).
      if (current.state !== "analysisError") return current;
      return { ...current, state: "analyzing", apiError: null };

    case "BACK_TO_FORM":
      // analysisError -> form: data intact, only the error is cleared.
      if (current.state !== "analysisError") return current;
      return { ...current, state: "form", apiError: null };

    case "NEW_CASE_CONFIRMED":
      // chat -> form: full reset, nothing survives.
      if (current.state !== "chat") return current;
      return { state: "form", apiError: null, payload: null };

    case "CHAT_ACTIVITY":
      // chat -> chat: messages/revisions/message-retry are owned by
      // useChat itself; the shell state doesn't change.
      if (current.state !== "chat") return current;
      return current;

    default: {
      // Exhaustiveness guard: if a new ShellAction variant is added without
      // a case above, this is a compile-time error.
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/** Convenience type export for consumers that only need the view-state union. */
export type { ShellViewState };
