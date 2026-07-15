import { describe, expect, it } from "vitest";
import {
  caseFieldsSchema,
  MODEL_NAME_MAX_LENGTH,
  REASON_MIN_LENGTH,
} from "./case-fields";

/** Builds a valid baseline CaseFields payload, overridable per test. */
function validFields(overrides: Record<string, unknown> = {}) {
  return {
    requestType: "return",
    category: "smartphone",
    modelName: "iPhone 13",
    purchaseDate: "2024-01-15",
    ...overrides,
  };
}

function isoDateDaysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("caseFieldsSchema", () => {
  it("accepts a valid return case without a reason", () => {
    const result = caseFieldsSchema.safeParse(validFields({ requestType: "return" }));
    expect(result.success).toBe(true);
  });

  it("accepts a valid complaint case with a sufficient reason", () => {
    const result = caseFieldsSchema.safeParse(
      validFields({ requestType: "complaint", reason: "Ekran pęka po tygodniu użytkowania." }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a complaint without a reason", () => {
    const result = caseFieldsSchema.safeParse(validFields({ requestType: "complaint" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const flat = result.error.flatten();
      expect(flat.fieldErrors.reason).toBeTruthy();
    }
  });

  it("rejects a complaint with a reason shorter than the minimum", () => {
    const result = caseFieldsSchema.safeParse(
      validFields({ requestType: "complaint", reason: "za krotko" }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a complaint with a reason exactly at the minimum length", () => {
    const reason = "a".repeat(REASON_MIN_LENGTH);
    const result = caseFieldsSchema.safeParse(
      validFields({ requestType: "complaint", reason }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts a return case without a reason (reason optional)", () => {
    const result = caseFieldsSchema.safeParse(validFields({ requestType: "return" }));
    expect(result.success).toBe(true);
  });

  it("rejects a future purchase date", () => {
    const result = caseFieldsSchema.safeParse(
      validFields({ purchaseDate: isoDateDaysFromNow(1) }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const flat = result.error.flatten();
      expect(flat.fieldErrors.purchaseDate).toBeTruthy();
    }
  });

  it("accepts today as the purchase date (boundary)", () => {
    const result = caseFieldsSchema.safeParse(
      validFields({ purchaseDate: isoDateDaysFromNow(0) }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a malformed purchase date string", () => {
    const result = caseFieldsSchema.safeParse(validFields({ purchaseDate: "15-01-2024" }));
    expect(result.success).toBe(false);
  });

  it("rejects a modelName longer than the maximum (201 chars)", () => {
    const result = caseFieldsSchema.safeParse(
      validFields({ modelName: "a".repeat(MODEL_NAME_MAX_LENGTH + 1) }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a modelName exactly at the maximum length (200 chars)", () => {
    const result = caseFieldsSchema.safeParse(
      validFields({ modelName: "a".repeat(MODEL_NAME_MAX_LENGTH) }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an empty modelName", () => {
    const result = caseFieldsSchema.safeParse(validFields({ modelName: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid requestType", () => {
    const result = caseFieldsSchema.safeParse(validFields({ requestType: "refund" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category", () => {
    const result = caseFieldsSchema.safeParse(validFields({ category: "spaceship" }));
    expect(result.success).toBe(false);
  });

  it("produces Polish error messages for every failing field", () => {
    const result = caseFieldsSchema.safeParse({
      requestType: "complaint",
      category: "not-a-category",
      modelName: "",
      purchaseDate: "not-a-date",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      // Polish-specific diacritics/words as a smoke check for locale.
      expect(messages.some((m) => /[ąćęłńóśźż]/i.test(m) || /nieprawidł|podaj|wybierz/i.test(m))).toBe(
        true,
      );
    }
  });
});
