// Polish labels + visual variant mapping for the four decision categories
// (PRD §6 AC-20/22, §11; ADR-002 §3 "Decision banner", TAC-002-01). The
// English category identifiers come from the shared lib/decision marker
// protocol; this module is the frontend-only mapping onto UI text/state.

import type { DecisionCategory } from "../../lib/decision/marker";

export const DECISION_LABELS_PL: Record<DecisionCategory, string> = {
  APPROVED: "Zaakceptowano",
  REJECTED: "Odrzucono",
  NEEDS_MORE_INFO: "Potrzebne dodatkowe informacje",
  ESCALATE: "Eskalacja",
};

export const DECISION_DESCRIPTIONS_PL: Record<DecisionCategory, string> = {
  APPROVED: "Zgłoszenie spełnia warunki polityki.",
  REJECTED: "Zgłoszenie nie spełnia warunków polityki.",
  NEEDS_MORE_INFO: "Potrzebujemy dodatkowych informacji, aby podjąć decyzję.",
  ESCALATE: "Sprawa wymaga przekazania do przełożonego.",
};

/** Semantic status variant per category — drives the banner's colors (Play tokens keep geometry, not color, brand-specific). */
export type DecisionVariant = "success" | "danger" | "warning" | "neutral";

export const DECISION_VARIANTS: Record<DecisionCategory, DecisionVariant> = {
  APPROVED: "success",
  REJECTED: "danger",
  NEEDS_MORE_INFO: "warning",
  ESCALATE: "neutral",
};
