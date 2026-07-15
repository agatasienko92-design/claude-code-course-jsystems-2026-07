import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { DecisionCategory } from "../../lib/decision/marker";
import { DecisionBanner } from "./DecisionBanner";

afterEach(() => {
  cleanup();
});

const expectations: Array<{
  category: DecisionCategory;
  variant: string;
  labelPattern: RegExp;
}> = [
  { category: "APPROVED", variant: "success", labelPattern: /zaakceptowano/i },
  { category: "REJECTED", variant: "danger", labelPattern: /odrzucono/i },
  { category: "NEEDS_MORE_INFO", variant: "warning", labelPattern: /dodatkowych informacji/i },
  { category: "ESCALATE", variant: "neutral", labelPattern: /eskalacj/i },
];

describe("DecisionBanner", () => {
  it.each(expectations)(
    "renders the $category variant with data-decision and a Polish label (TAC-002-01)",
    ({ category, variant, labelPattern }) => {
      render(<DecisionBanner category={category} />);

      const banner = screen.getByTestId("decision-banner");
      expect(banner.getAttribute("data-decision")).toBe(category);
      expect(banner.getAttribute("data-variant")).toBe(variant);
      expect(banner.textContent).toMatch(labelPattern);
    },
  );

  it("renders four categories with four distinct data-variant values", () => {
    const seen = new Set<string | null>();
    for (const { category } of expectations) {
      const { unmount } = render(<DecisionBanner category={category} />);
      seen.add(screen.getByTestId("decision-banner").getAttribute("data-variant"));
      unmount();
    }
    expect(seen.size).toBe(4);
  });
});
