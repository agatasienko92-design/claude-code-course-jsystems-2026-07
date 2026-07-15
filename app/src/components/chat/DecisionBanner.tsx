// Decision banner (ADR-002 §3 "Decision banner", PRD §9.2, TAC-002-01/02).
// Four visually distinct variants (success/danger/warning/neutral) for the
// four decision categories, Play geometry (12px card radius), each carrying
// `data-decision="<CATEGORY>"` for E2E hooks.
//
// Like CaseForm, this avoids the shadcn/ui primitives (`Card`, `Badge`) —
// they import the `@/lib/utils` alias that vitest.config.ts (out of scope
// here) does not resolve, which would break every component test in this
// directory. Plain elements + Tailwind utilities (including the default
// Tailwind color palette for the semantic status colors, since the Play
// brand tokens in globals.css only define brand purple/pink/link, not
// success/danger/warning/neutral) stand in instead.

import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { DecisionCategory } from "../../lib/decision/marker";
import {
  DECISION_DESCRIPTIONS_PL,
  DECISION_LABELS_PL,
  DECISION_VARIANTS,
  type DecisionVariant,
} from "./decision-labels";

export interface DecisionBannerProps {
  category: DecisionCategory;
}

const VARIANT_CONTAINER_CLASS: Record<DecisionVariant, string> = {
  success:
    "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100",
  danger:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100",
  warning:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  neutral:
    "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100",
};

const VARIANT_BADGE_CLASS: Record<DecisionVariant, string> = {
  success: "bg-green-600 text-white",
  danger: "bg-red-600 text-white",
  warning: "bg-amber-500 text-white",
  neutral: "bg-slate-600 text-white",
};

const VARIANT_ICON: Record<DecisionVariant, LucideIcon> = {
  success: CheckCircle2,
  danger: XCircle,
  warning: HelpCircle,
  neutral: AlertTriangle,
};

export function DecisionBanner({ category }: DecisionBannerProps) {
  const variant = DECISION_VARIANTS[category];
  const label = DECISION_LABELS_PL[category];
  const description = DECISION_DESCRIPTIONS_PL[category];
  const Icon = VARIANT_ICON[variant];

  return (
    <div
      data-testid="decision-banner"
      data-decision={category}
      data-variant={variant}
      className={`flex items-start gap-3 rounded-xl border p-4 ${VARIANT_CONTAINER_CLASS[variant]}`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ${VARIANT_BADGE_CLASS[variant]}`}
        >
          {label}
        </span>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  );
}
