import { describe, expect, it } from "vitest";
import { chatRequestSchema } from "./chat-request";

function validCaseContext() {
  return {
    caseId: "550e8400-e29b-41d4-a716-446655440000",
    fields: {
      requestType: "return",
      category: "laptop",
      modelName: "Dell XPS 13",
      purchaseDate: "2024-01-15",
    },
    analysis: {
      depictsDeclaredEquipment: true,
      summary: "Sprzęt widoczny na zdjęciu odpowiada zgłoszeniu.",
      damage: { present: false, types: [], probableCause: null },
      usageSigns: { present: false, details: [] },
      resellableAsNew: true,
      raw: "pełny tekst analizy modelu wizyjnego",
    },
  };
}

function userMessage(text = "Cześć") {
  return {
    id: "msg-1",
    role: "user" as const,
    parts: [{ type: "text", text }],
  };
}

describe("chatRequestSchema", () => {
  it("accepts an empty messages array with a valid caseContext (first decision call)", () => {
    const result = chatRequestSchema.safeParse({ messages: [], caseContext: validCaseContext() });
    expect(result.success).toBe(true);
  });

  it("accepts a follow-up call with message history", () => {
    const result = chatRequestSchema.safeParse({
      messages: [userMessage("Cześć"), userMessage("Mam pytanie")],
      caseContext: validCaseContext(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing caseContext", () => {
    const result = chatRequestSchema.safeParse({ messages: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a message with an invalid role", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ id: "1", role: "bot", parts: [] }],
      caseContext: validCaseContext(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a message missing an id", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "user", parts: [] }],
      caseContext: validCaseContext(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a caseContext with invalid nested fields (e.g. bad category)", () => {
    const ctx = validCaseContext();
    ctx.fields.category = "not-a-category";
    const result = chatRequestSchema.safeParse({ messages: [], caseContext: ctx });
    expect(result.success).toBe(false);
  });

  it("rejects messages that is not an array", () => {
    const result = chatRequestSchema.safeParse({
      messages: "not-an-array",
      caseContext: validCaseContext(),
    });
    expect(result.success).toBe(false);
  });
});
