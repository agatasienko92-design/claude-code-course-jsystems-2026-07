import { describe, expect, it } from "vitest";

import { DECISION_CATEGORIES } from "../../lib/decision/marker";
import { DECISION_LABELS_PL, DECISION_VARIANTS } from "./decision-labels";

describe("decision-labels", () => {
  it("provides a Polish label for every decision category (PRD AC-20/22, §11)", () => {
    for (const category of DECISION_CATEGORIES) {
      expect(DECISION_LABELS_PL[category]).toBeTruthy();
      expect(typeof DECISION_LABELS_PL[category]).toBe("string");
    }
  });

  it("assigns a distinct visual variant to every decision category (TAC-002-01)", () => {
    const variants = DECISION_CATEGORIES.map((category) => DECISION_VARIANTS[category]);
    expect(new Set(variants).size).toBe(DECISION_CATEGORIES.length);
  });
});
