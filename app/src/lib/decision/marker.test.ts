import { describe, expect, it } from "vitest";
import { parseDecisionMarker, latestDecisionCategory } from "./marker";
import type { DecisionCategory } from "./marker";

const CATEGORIES: DecisionCategory[] = [
  "APPROVED",
  "REJECTED",
  "NEEDS_MORE_INFO",
  "ESCALATE",
];

describe("parseDecisionMarker", () => {
  it.each(CATEGORIES)("parses the %s marker on the first line", (category) => {
    const text = `[DECYZJA: ${category}]\nDzień dobry, oto decyzja.`;
    const result = parseDecisionMarker(text);
    expect(result.category).toBe(category);
    expect(result.displayText).toBe("Dzień dobry, oto decyzja.");
    expect(result.displayText).not.toContain("DECYZJA");
  });

  it("returns null category and the unchanged text when there is no marker", () => {
    const text = "Dzień dobry, potrzebuję więcej informacji o zakupie.";
    const result = parseDecisionMarker(text);
    expect(result.category).toBeNull();
    expect(result.displayText).toBe(text);
  });

  it("returns null category on a malformed marker (unknown category)", () => {
    const text = "[DECYZJA: MAYBE]\nTreść wiadomości.";
    const result = parseDecisionMarker(text);
    expect(result.category).toBeNull();
    expect(result.displayText).toBe(text);
  });

  it("returns null category on a malformed marker (missing brackets)", () => {
    const text = "DECYZJA: APPROVED\nTreść wiadomości.";
    const result = parseDecisionMarker(text);
    expect(result.category).toBeNull();
    expect(result.displayText).toBe(text);
  });

  it("ignores a marker that is not on the first line", () => {
    const text = "Witaj.\n[DECYZJA: APPROVED]\nDalszy tekst.";
    const result = parseDecisionMarker(text);
    expect(result.category).toBeNull();
    expect(result.displayText).toBe(text);
  });

  it("strips the marker line even when it is the entire message", () => {
    const text = "[DECYZJA: ESCALATE]";
    const result = parseDecisionMarker(text);
    expect(result.category).toBe("ESCALATE");
    expect(result.displayText).toBe("");
  });

  it("never throws on empty string input", () => {
    expect(() => parseDecisionMarker("")).not.toThrow();
    expect(parseDecisionMarker("").category).toBeNull();
  });

  it("never throws on weird/garbage input", () => {
    const weirdInputs = [
      "\n\n\n",
      "[DECYZJA:]",
      "[DECYZJA: ]",
      "🙂🙂🙂",
      "a".repeat(10000),
      "[DECYZJA: APPROVED",
      "[decyzja: approved]",
    ];
    for (const input of weirdInputs) {
      expect(() => parseDecisionMarker(input)).not.toThrow();
    }
  });

  it("never throws on non-string input (defensive)", () => {
    // Intentionally exercising inputs outside the declared type contract.
    expect(() => parseDecisionMarker(null as unknown as string)).not.toThrow();
    expect(() => parseDecisionMarker(undefined as unknown as string)).not.toThrow();
    expect(parseDecisionMarker(null as unknown as string).category).toBeNull();
  });
});

describe("latestDecisionCategory", () => {
  it("returns null for an empty message list", () => {
    expect(latestDecisionCategory([])).toBeNull();
  });

  it("returns the only category when a single message has a marker", () => {
    expect(latestDecisionCategory(["[DECYZJA: APPROVED]\nTekst."])).toBe("APPROVED");
  });

  it("returns the latest marker across multiple messages", () => {
    const messages = [
      "[DECYZJA: NEEDS_MORE_INFO]\nPierwsza wiadomość.",
      "Odpowiedź bez decyzji.",
      "[DECYZJA: APPROVED]\nZrewidowana decyzja.",
    ];
    expect(latestDecisionCategory(messages)).toBe("APPROVED");
  });

  it("falls back to an earlier marker when the latest message has none", () => {
    const messages = [
      "[DECYZJA: REJECTED]\nDecyzja.",
      "Wiadomość uzupełniająca bez nowej decyzji.",
    ];
    expect(latestDecisionCategory(messages)).toBe("REJECTED");
  });

  it("returns null when no message in the list has a marker", () => {
    expect(latestDecisionCategory(["Cześć", "Jak mogę pomóc?"])).toBeNull();
  });

  it("never throws on a list containing weird input", () => {
    expect(() => latestDecisionCategory(["", "\n", "[DECYZJA: X]"])).not.toThrow();
  });
});
