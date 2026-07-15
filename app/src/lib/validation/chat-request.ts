// Isomorphic Zod schema for the `/api/chat` request body (ADR-001 §3.2/§4/§5).
// Validates the transport-level shape (messages array + caseContext); the
// exact AI SDK `UIMessage` part union is intentionally validated loosely
// here (id/role/parts array) rather than re-implementing the full part
// schema, since the route handler's real work is on `caseContext`.

import { z } from "zod";
import { CATEGORY_VALUES } from "../types";

const caseFieldsSchemaForChat = z.object({
  requestType: z.enum(["complaint", "return"], "Nieprawidłowy typ zgłoszenia."),
  category: z.enum(CATEGORY_VALUES, "Wybierz kategorię sprzętu z listy."),
  modelName: z.string("Podaj nazwę lub model sprzętu.").min(1).max(200),
  purchaseDate: z.iso.date("Podaj poprawną datę zakupu w formacie RRRR-MM-DD."),
  reason: z.string().optional(),
});

const imageAnalysisSchema = z.object({
  depictsDeclaredEquipment: z.boolean(),
  summary: z.string(),
  damage: z.object({
    present: z.boolean(),
    types: z.array(z.string()),
    probableCause: z.string().nullable(),
  }),
  usageSigns: z.object({
    present: z.boolean(),
    details: z.array(z.string()),
  }),
  resellableAsNew: z.boolean().nullable(),
  raw: z.string(),
});

const caseContextSchema = z.object({
  caseId: z.string("Nieprawidłowy identyfikator zgłoszenia."),
  fields: caseFieldsSchemaForChat,
  analysis: imageAnalysisSchema,
});

/** Loose `UIMessage` shape: enough to route/render, not the full AI SDK part union. */
const uiMessageSchema = z.object({
  id: z.string("Nieprawidłowy identyfikator wiadomości."),
  role: z.enum(["system", "user", "assistant"], "Nieprawidłowa rola wiadomości."),
  metadata: z.unknown().optional(),
  parts: z.array(z.unknown()),
});

export const chatRequestSchema = z.object({
  messages: z.array(uiMessageSchema, "Nieprawidłowa lista wiadomości."),
  caseContext: caseContextSchema,
});

export type ChatRequestInput = z.input<typeof chatRequestSchema>;
export type ChatRequestOutput = z.output<typeof chatRequestSchema>;
