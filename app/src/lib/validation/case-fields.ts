// Isomorphic Zod schema for CaseFields (ADR-001 §3.2/§4, PRD AC-01..05).
// No Node-only APIs here (ADR-002 D-204) — safe to import from client and
// server code alike. All validation messages are Polish (CTX-PL).

import { z } from "zod";
import { CATEGORY_VALUES } from "../types";

export const MODEL_NAME_MIN_LENGTH = 1;
export const MODEL_NAME_MAX_LENGTH = 200;
export const REASON_MIN_LENGTH = 10;

/** Today's date as an ISO `YYYY-MM-DD` string (UTC), used for the "not in the future" rule. */
function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const caseFieldsObjectSchema = z.object({
  requestType: z.enum(["complaint", "return"], "Nieprawidłowy typ zgłoszenia."),
  category: z.enum(CATEGORY_VALUES, "Wybierz kategorię sprzętu z listy."),
  modelName: z
    .string("Podaj nazwę lub model sprzętu.")
    .min(MODEL_NAME_MIN_LENGTH, "Podaj nazwę lub model sprzętu.")
    .max(
      MODEL_NAME_MAX_LENGTH,
      `Nazwa/model może mieć maksymalnie ${MODEL_NAME_MAX_LENGTH} znaków.`,
    ),
  purchaseDate: z
    .iso.date("Podaj poprawną datę zakupu w formacie RRRR-MM-DD.")
    .refine((value) => value <= todayIsoDate(), {
      message: "Data zakupu nie może być datą przyszłą.",
    }),
  reason: z.string().optional(),
});

/**
 * CaseFields schema. `reason` is required (min {@link REASON_MIN_LENGTH} chars,
 * after trimming) when `requestType === "complaint"`; optional for `"return"`.
 */
export const caseFieldsSchema = caseFieldsObjectSchema.superRefine((data, ctx) => {
  if (data.requestType === "complaint") {
    const reason = data.reason?.trim() ?? "";
    if (reason.length < REASON_MIN_LENGTH) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: `Podaj powód reklamacji (co najmniej ${REASON_MIN_LENGTH} znaków).`,
      });
    }
  }
});

export type CaseFieldsInput = z.input<typeof caseFieldsSchema>;
export type CaseFieldsOutput = z.output<typeof caseFieldsSchema>;
