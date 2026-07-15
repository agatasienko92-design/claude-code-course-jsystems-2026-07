import { describe, expect, it } from "vitest";

import { CATEGORY_VALUES } from "../../lib/types";
import { CATEGORY_LABELS_PL, categoryOptions } from "./category-labels";

describe("category-labels", () => {
  it("provides a Polish label for every category enum value (PRD AC-02)", () => {
    for (const value of CATEGORY_VALUES) {
      expect(CATEGORY_LABELS_PL[value]).toBeTruthy();
      expect(typeof CATEGORY_LABELS_PL[value]).toBe("string");
    }
  });

  it("categoryOptions returns one option per enum value, in declared order", () => {
    const options = categoryOptions();
    expect(options.map((o) => o.value)).toEqual([...CATEGORY_VALUES]);
    expect(options.every((o) => o.label.length > 0)).toBe(true);
  });
});
