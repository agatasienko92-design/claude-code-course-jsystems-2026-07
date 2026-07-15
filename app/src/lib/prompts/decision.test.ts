// @vitest-environment node
// Tests for the decision-stage system prompt builders (ADR-001 §3.5, D-101,
// PRD §11, TAC-001-05). These builders load the real policy documents via
// lib/policies, so this suite needs the Node fs environment.

import { describe, expect, it } from "vitest";
import type { CaseFields, ImageAnalysis } from "../types";
import { loadPolicy } from "../policies/loader";
import { DECISION_CATEGORIES } from "../decision/marker";
import { buildDecisionComplaintPrompt, buildDecisionReturnPrompt } from "./decision";

const complaintFields: CaseFields = {
  requestType: "complaint",
  category: "smartphone",
  modelName: "iPhone 15",
  purchaseDate: "2026-01-10",
  reason: "Ekran przestał reagować na dotyk po tygodniu użytkowania.",
};

const returnFieldsNoReason: CaseFields = {
  requestType: "return",
  category: "laptop",
  modelName: "Dell XPS 13",
  purchaseDate: "2026-06-01",
};

const analysis: ImageAnalysis = {
  depictsDeclaredEquipment: true,
  summary: "Urządzenie w dobrym stanie ogólnym, widoczne pęknięcie w rogu ekranu.",
  damage: {
    present: true,
    types: ["pęknięty ekran"],
    probableCause: "uszkodzenie mechaniczne",
  },
  usageSigns: { present: false, details: [] },
  resellableAsNew: null,
  raw: "Pełny, nieprzetworzony tekst odpowiedzi modelu wizyjnego dla tego przypadku.",
};

describe("buildDecisionComplaintPrompt", () => {
  it("embeds the complete complaint policy document text verbatim", async () => {
    const policyText = await loadPolicy("complaint");
    const prompt = await buildDecisionComplaintPrompt(complaintFields, analysis);

    expect(prompt).toContain(policyText);
  });

  it("does not embed return-only policy content", async () => {
    const prompt = await buildDecisionComplaintPrompt(complaintFields, analysis);

    expect(prompt).not.toContain("R-14");
    expect(prompt).not.toContain("30 calendar days");
  });

  it("embeds the decision-marker protocol verbatim", async () => {
    const prompt = await buildDecisionComplaintPrompt(complaintFields, analysis);

    expect(prompt).toContain("[DECYZJA: <CATEGORY>]");
    for (const category of DECISION_CATEGORIES) {
      expect(prompt).toContain(category);
    }
  });

  it("embeds the case fields", async () => {
    const prompt = await buildDecisionComplaintPrompt(complaintFields, analysis);

    expect(prompt).toContain("iPhone 15");
    expect(prompt).toContain("smartphone");
    expect(prompt).toContain("2026-01-10");
    expect(prompt).toContain("Ekran przestał reagować na dotyk");
  });

  it("embeds the image analysis, including the raw text", async () => {
    const prompt = await buildDecisionComplaintPrompt(complaintFields, analysis);

    expect(prompt).toContain("pęknięty ekran");
    expect(prompt).toContain("uszkodzenie mechaniczne");
    expect(prompt).toContain(analysis.raw);
  });

  it("embeds the agent behavior spec digest (role, categories, not-allowed list, recommendation framing, Polish output)", async () => {
    const prompt = await buildDecisionComplaintPrompt(complaintFields, analysis);

    expect(prompt).toContain("decision-support assistant");
    expect(prompt).toContain("NEEDS_MORE_INFO");
    expect(prompt).toContain("invent, extend, or soften policy rules");
    expect(prompt).toContain("final decision belongs to the employee");
    expect(prompt).toContain("odpowiadaj wyłącznie po polsku");
  });
});

describe("buildDecisionReturnPrompt", () => {
  it("embeds the complete return policy document text verbatim", async () => {
    const policyText = await loadPolicy("return");
    const prompt = await buildDecisionReturnPrompt(returnFieldsNoReason, analysis);

    expect(prompt).toContain(policyText);
  });

  it("does not embed complaint-only policy content", async () => {
    const prompt = await buildDecisionReturnPrompt(returnFieldsNoReason, analysis);

    expect(prompt).not.toContain("C-16");
    expect(prompt).not.toContain("24 months");
  });

  it("handles an absent reason gracefully (return scenario)", async () => {
    const prompt = await buildDecisionReturnPrompt(returnFieldsNoReason, analysis);

    expect(prompt).toContain("nie podano");
    expect(prompt).toContain("Dell XPS 13");
  });

  it("embeds the decision-marker protocol verbatim", async () => {
    const prompt = await buildDecisionReturnPrompt(returnFieldsNoReason, analysis);

    expect(prompt).toContain("[DECYZJA: <CATEGORY>]");
    for (const category of DECISION_CATEGORIES) {
      expect(prompt).toContain(category);
    }
  });
});
