import { describe, expect, it, vi } from "vitest";

import * as markerModule from "../../lib/decision/marker";
import { parseAssistantMessage } from "./parse-assistant-message";

/**
 * The helper must delegate to the shared lib/decision parser (ADR-002 D-203)
 * rather than reimplementing marker parsing.
 */
describe("parseAssistantMessage", () => {
  it("delegates to lib/decision's parseDecisionMarker", () => {
    const spy = vi.spyOn(markerModule, "parseDecisionMarker");

    parseAssistantMessage("[DECYZJA: APPROVED]\nDzień dobry, decyzja: zatwierdzono.");

    expect(spy).toHaveBeenCalledWith(
      "[DECYZJA: APPROVED]\nDzień dobry, decyzja: zatwierdzono.",
    );
    spy.mockRestore();
  });

  it("returns the parsed category and the marker-stripped display text", () => {
    const result = parseAssistantMessage("[DECYZJA: REJECTED]\nTreść uzasadnienia.");
    expect(result.category).toBe("REJECTED");
    expect(result.displayText).toBe("Treść uzasadnienia.");
  });

  it("returns a null category and the full original text when no marker is present", () => {
    const result = parseAssistantMessage("Zwykła odpowiedź bez decyzji.");
    expect(result.category).toBeNull();
    expect(result.displayText).toBe("Zwykła odpowiedź bez decyzji.");
  });
});
