import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { DecisionCategory } from "../../lib/decision/marker";
import { AssistantDecisionMessage } from "./AssistantDecisionMessage";

afterEach(() => {
  cleanup();
});

const categories: DecisionCategory[] = [
  "APPROVED",
  "REJECTED",
  "NEEDS_MORE_INFO",
  "ESCALATE",
];

describe("AssistantDecisionMessage", () => {
  it.each(categories)(
    "renders the %s banner and strips the marker line from the displayed text (TAC-002-02)",
    (category) => {
      const body = "Dzień dobry, oto uzasadnienie decyzji.\nNastępne kroki: brak.";
      const text = `[DECYZJA: ${category}]\n${body}`;

      render(<AssistantDecisionMessage text={text} />);

      const banner = screen.getByTestId("decision-banner");
      expect(banner.getAttribute("data-decision")).toBe(category);

      const rendered = screen.getByTestId("assistant-message-body");
      expect(rendered.textContent).not.toMatch(/\[DECYZJA:/);
      expect(rendered.textContent).toContain("Dzień dobry, oto uzasadnienie decyzji.");
    },
  );

  it("renders no banner and the full original text when there is no marker", () => {
    const text = "To jest zwykła wiadomość bez decyzji.";
    render(<AssistantDecisionMessage text={text} />);

    expect(screen.queryByTestId("decision-banner")).toBeNull();
    expect(screen.getByTestId("assistant-message-body").textContent).toBe(text);
  });
});
