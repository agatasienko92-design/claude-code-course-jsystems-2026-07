// Decision-stage system prompt builders (ADR-001 §3.5, D-101, PRD §11
// "Stage 2"). Each builder produces the full system prompt for the
// reasoning-LLM stage by combining: the agent behavior spec digest, the
// decision-marker protocol, the complete applicable policy document text
// (loaded via lib/policies at request time — ADR-001 D-104), the case
// fields, and the stage-1 image analysis.

import type { CaseFields, ImageAnalysis } from "../types";
import { loadPolicy, type PolicyScenario } from "../policies/loader";
import { AGENT_BEHAVIOR_SPEC_DIGEST, buildMarkerProtocolInstruction } from "./behavior-spec";

function formatCaseFields(fields: CaseFields): string {
  const reason = fields.reason?.trim();
  const reasonLine = reason && reason.length > 0 ? `- Powód zgłoszenia: ${reason}` : "- Powód zgłoszenia: nie podano";

  return `- Typ zgłoszenia: ${fields.requestType}
- Kategoria sprzętu: ${fields.category}
- Model/nazwa: ${fields.modelName}
- Data zakupu: ${fields.purchaseDate}
${reasonLine}`;
}

function formatImageAnalysis(analysis: ImageAnalysis): string {
  const resellableLine =
    analysis.resellableAsNew === null
      ? "- Możliwość odsprzedaży jako nowy: nie dotyczy"
      : `- Możliwość odsprzedaży jako nowy: ${analysis.resellableAsNew ? "tak" : "nie"}`;

  return `- Zdjęcie przedstawia zadeklarowany sprzęt: ${analysis.depictsDeclaredEquipment ? "tak" : "nie"}
- Podsumowanie: ${analysis.summary}
- Uszkodzenie obecne: ${analysis.damage.present ? "tak" : "nie"}
- Rodzaje uszkodzeń: ${analysis.damage.types.length > 0 ? analysis.damage.types.join(", ") : "brak"}
- Prawdopodobna przyczyna: ${analysis.damage.probableCause ?? "nieustalona"}
- Ślady użytkowania obecne: ${analysis.usageSigns.present ? "tak" : "nie"}
- Szczegóły śladów użytkowania: ${analysis.usageSigns.details.length > 0 ? analysis.usageSigns.details.join(", ") : "brak"}
${resellableLine}
- Pełny opis modelu wizyjnego: ${analysis.raw}`;
}

async function buildDecisionPrompt(
  scenario: PolicyScenario,
  fields: CaseFields,
  analysis: ImageAnalysis,
): Promise<string> {
  const policyText = await loadPolicy(scenario);

  return `${AGENT_BEHAVIOR_SPEC_DIGEST}

${buildMarkerProtocolInstruction()}

## Obowiązująca polityka (scenariusz: ${scenario})

${policyText}

## Dane zgłoszenia

${formatCaseFields(fields)}

## Wynik analizy zdjęcia (etap 1)

${formatImageAnalysis(analysis)}`;
}

/** Decision-stage system prompt for a **complaint** case (ADR-001 §3.5). */
export function buildDecisionComplaintPrompt(fields: CaseFields, analysis: ImageAnalysis): Promise<string> {
  return buildDecisionPrompt("complaint", fields, analysis);
}

/** Decision-stage system prompt for a **return** case (ADR-001 §3.5). */
export function buildDecisionReturnPrompt(fields: CaseFields, analysis: ImageAnalysis): Promise<string> {
  return buildDecisionPrompt("return", fields, analysis);
}
