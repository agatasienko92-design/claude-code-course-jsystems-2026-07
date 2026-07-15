// Decision-marker protocol parser (ADR-001 D-101, TAC-001-04/06).
// Extracts a `[DECYZJA: <CATEGORY>]` marker from the FIRST line of a
// streamed assistant message. Shared by frontend (banner rendering) and
// backend/tests. Must never throw on any input, including malformed or
// non-string values.

export const DECISION_CATEGORIES = [
  "APPROVED",
  "REJECTED",
  "NEEDS_MORE_INFO",
  "ESCALATE",
] as const;

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number];

export interface ParsedDecision {
  category: DecisionCategory | null;
  /** Original text with the marker line (and the newline after it) stripped. */
  displayText: string;
}

const MARKER_LINE_PATTERN = new RegExp(
  `^\\[DECYZJA:\\s*(${DECISION_CATEGORIES.join("|")})\\][ \\t]*(?:\\r?\\n|$)`,
);

/**
 * Parses the decision marker from the first line of `text`. Never throws:
 * non-string input is coerced to an empty string, and any other error is
 * swallowed with a safe (`null`, unchanged text) fallback.
 */
export function parseDecisionMarker(text: string): ParsedDecision {
  try {
    const safeText = typeof text === "string" ? text : "";
    const match = MARKER_LINE_PATTERN.exec(safeText);

    if (!match) {
      return { category: null, displayText: safeText };
    }

    const category = match[1] as DecisionCategory;
    const displayText = safeText.slice(match[0].length);
    return { category, displayText };
  } catch {
    return { category: null, displayText: typeof text === "string" ? text : "" };
  }
}

/**
 * Returns the category of the most recent message (scanning from the end)
 * that carries a marker — "latest marker across a message list wins"
 * (ADR-001 D-101). Returns `null` when no message carries a marker.
 * Never throws.
 */
export function latestDecisionCategory(texts: readonly string[]): DecisionCategory | null {
  try {
    if (!Array.isArray(texts)) {
      return null;
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      const { category } = parseDecisionMarker(texts[i]);
      if (category !== null) {
        return category;
      }
    }
    return null;
  } catch {
    return null;
  }
}
