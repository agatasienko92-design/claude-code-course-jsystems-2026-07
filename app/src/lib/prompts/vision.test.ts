// Tests for the vision-stage prompt builders (ADR-001 §3.5, D-102).
// Both prompts must be structured (fixed Polish section labels), demand
// Polish output, and must NOT ask for a decision — that's Stage 2's job.

import { describe, expect, it } from "vitest";
import { buildVisionComplaintPrompt, buildVisionReturnPrompt } from "./vision";

const equipment = { category: "smartphone", modelName: "iPhone 15" } as const;

describe("buildVisionComplaintPrompt", () => {
  const prompt = buildVisionComplaintPrompt(equipment);

  it("asks about damage presence, type, and probable cause class", () => {
    expect(prompt).toContain("USZKODZENIA");
    expect(prompt).toContain("wada fabryczna");
    expect(prompt).toContain("normalne zużycie");
    expect(prompt).toContain("uszkodzenie mechaniczne");
  });

  it("asks whether the photo depicts the declared equipment", () => {
    expect(prompt).toContain("ZGODNOŚĆ SPRZĘTU");
    expect(prompt).toContain("smartphone");
    expect(prompt).toContain("iPhone 15");
  });

  it("explicitly forbids issuing a decision", () => {
    expect(prompt.toLowerCase()).toContain("do not include any decision");
  });

  it("demands Polish output", () => {
    expect(prompt).toContain("odpowiadaj wyłącznie po polsku");
  });

  it("does not ask about return-specific resellability", () => {
    expect(prompt).not.toContain("ODSPRZEDAŻY");
  });
});

describe("buildVisionReturnPrompt", () => {
  const prompt = buildVisionReturnPrompt(equipment);

  it("asks about signs of use, completeness, and resellability as new", () => {
    expect(prompt).toContain("ŚLADY UŻYTKOWANIA");
    expect(prompt).toContain("MOŻLIWOŚĆ ODSPRZEDAŻY JAKO NOWY");
    expect(prompt).toContain("brakujące elementy");
  });

  it("asks whether the photo depicts the declared equipment", () => {
    expect(prompt).toContain("ZGODNOŚĆ SPRZĘTU");
    expect(prompt).toContain("smartphone");
    expect(prompt).toContain("iPhone 15");
  });

  it("explicitly forbids issuing a decision", () => {
    expect(prompt.toLowerCase()).toContain("do not include any decision");
  });

  it("demands Polish output", () => {
    expect(prompt).toContain("odpowiadaj wyłącznie po polsku");
  });

  it("does not ask about complaint-specific cause classes", () => {
    expect(prompt).not.toContain("wada fabryczna");
  });
});
