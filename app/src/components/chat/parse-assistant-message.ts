// Thin wrapper around the shared lib/decision marker parser (ADR-002 D-203).
// Kept as its own module so chat rendering code has one place to go from a
// raw assistant message string to {category, displayText} for the banner
// and the stripped message body — no marker-parsing logic is duplicated here.

import { parseDecisionMarker, type DecisionCategory } from "../../lib/decision/marker";

export interface ParsedAssistantMessage {
  category: DecisionCategory | null;
  /** Original text with the `[DECYZJA: ...]` marker line stripped (TAC-002-02). */
  displayText: string;
}

export function parseAssistantMessage(text: string): ParsedAssistantMessage {
  return parseDecisionMarker(text);
}
