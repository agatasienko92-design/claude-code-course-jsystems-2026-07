// Composes the decision banner with an assistant message's stripped body
// (ADR-002 §3 "Decision banner", D-203). Intended to be the per-message
// rendering unit a later phase's chat view plugs into AI Elements'
// Message/Response — parses on every render, so it reflects streamed
// content and revisions with no extra state (D-203 rationale).

import { DecisionBanner } from "./DecisionBanner";
import { parseAssistantMessage } from "./parse-assistant-message";

export interface AssistantDecisionMessageProps {
  /** Raw assistant message text, possibly carrying a `[DECYZJA: ...]` marker on its first line. */
  text: string;
}

export function AssistantDecisionMessage({ text }: AssistantDecisionMessageProps) {
  const { category, displayText } = parseAssistantMessage(text);

  return (
    <div data-testid="assistant-decision-message" className="flex flex-col gap-3">
      {category && <DecisionBanner category={category} />}
      <p data-testid="assistant-message-body" className="whitespace-pre-wrap text-sm text-foreground">
        {displayText}
      </p>
    </div>
  );
}
