// Shared backend/frontend contract types (ADR-001 §4). Field names here are
// binding — ADR-002 (frontend) consumes the exact same names. This module
// must stay isomorphic (browser-safe, no Node-only APIs) per ADR-002 D-204.

import type { UIMessage } from "ai";

/** Top-level request type selected on the case form (PRD AC-01). */
export type RequestType = "complaint" | "return";

/**
 * Equipment category list (PRD AC-02). English identifiers are used as the
 * stable data values; Polish display labels are a frontend (ADR-002)
 * concern and are not part of this contract.
 */
export const CATEGORY_VALUES = [
  "smartphone",
  "laptop",
  "tablet",
  "tv_monitor",
  "audio",
  "home_appliance_small",
  "gaming_console",
  "other",
] as const;

export type Category = (typeof CATEGORY_VALUES)[number];

/** Fields collected on the case form (ADR-001 §4). */
export interface CaseFields {
  requestType: RequestType;
  category: Category;
  /** Equipment name/model, 1-200 chars. */
  modelName: string;
  /** ISO date string `YYYY-MM-DD`, must not be in the future. */
  purchaseDate: string;
  /** Required (min 10 chars) when requestType === "complaint", optional otherwise. */
  reason?: string;
}

/** Structured result of the vision-stage analysis (ADR-001 §4, D-102). */
export interface ImageAnalysis {
  depictsDeclaredEquipment: boolean;
  /** Polish-language free text summary. */
  summary: string;
  damage: {
    present: boolean;
    types: string[];
    probableCause: string | null;
  };
  usageSigns: {
    present: boolean;
    details: string[];
  };
  /** null for the complaint scenario (not applicable). */
  resellableAsNew: boolean | null;
  /** Full vision-model text, always present, feeds the decision prompt. */
  raw: string;
}

/** Case context carried through chat requests. No raw image data. */
export interface CaseContext {
  /** Client-generated UUID. */
  caseId: string;
  fields: CaseFields;
  analysis: ImageAnalysis;
}

/** `POST /api/analyze` success response. */
export interface AnalyzeResponse {
  ok: true;
  fields: CaseFields;
  analysis: ImageAnalysis;
}

/** Error codes returned by the backend error contract (ADR-001 §4/§5). */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "UPSTREAM_LLM_ERROR"
  | "CONFIG_ERROR";

/** Shared backend error contract. `message` is always Polish. */
export interface ApiError {
  ok: false;
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}

/** `POST /api/chat` request body. */
export interface ChatRequest {
  messages: UIMessage[];
  caseContext: CaseContext;
}
