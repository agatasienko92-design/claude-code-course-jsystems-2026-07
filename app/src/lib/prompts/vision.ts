// Vision-stage prompt builders (ADR-001 §3.5, D-102, PRD §11 "Stage 1").
// Both prompts instruct the multimodal model to produce a factual,
// structured, Polish-language description in fixed labeled sections.
// Neither prompt asks for or allows a decision — that is Stage 2's
// responsibility (see lib/prompts/decision.ts).

import type { CaseFields } from "../types";

/** The subset of CaseFields the vision stage needs to check the photo against the declared equipment. */
type DeclaredEquipment = Pick<CaseFields, "category" | "modelName">;

const COMMON_INSTRUCTIONS = `You are the image-analysis stage of a two-stage assistant for electronics complaint/return handling. You receive a single compressed photo and must produce a factual, structured description of what is visible. Do not include any decision, verdict, recommendation, or policy judgement in this response — that is a separate stage's responsibility.

Never claim certainty about the physical cause of any damage; phrase visual assessments as probable ("zdjęcie wskazuje na…", "prawdopodobnie…").

Respond only in Polish (odpowiadaj wyłącznie po polsku), using exactly the section labels below (in capitals), each starting a new line, followed by your findings:`;

function equipmentLine(equipment: DeclaredEquipment): string {
  return `Zadeklarowany sprzęt: kategoria "${equipment.category}", model/nazwa "${equipment.modelName}".`;
}

/**
 * Vision-stage prompt for a **complaint** case (PRD §11 Stage 1): damage
 * presence, damage type, and probable cause class (manufacturing defect /
 * normal wear / mechanical impact / liquid / misuse).
 */
export function buildVisionComplaintPrompt(equipment: DeclaredEquipment): string {
  return `${COMMON_INSTRUCTIONS}

ZGODNOŚĆ SPRZĘTU: czy zdjęcie przedstawia zadeklarowany sprzęt (tak/nie) i krótkie uzasadnienie.
PODSUMOWANIE: krótki opis stanu urządzenia widocznego na zdjęciu.
USZKODZENIA: czy widoczne jest uszkodzenie (tak/nie); jeśli tak — jego rodzaj (np. pęknięty ekran, wgniecenia, wskaźnik zalania, ślady przepalenia) oraz najbardziej prawdopodobna klasa przyczyny (wada fabryczna / normalne zużycie / uszkodzenie mechaniczne / zalanie / niewłaściwe użytkowanie).

${equipmentLine(equipment)}`;
}

/**
 * Vision-stage prompt for a **return** case (PRD §11 Stage 1): signs of
 * use, completeness visible on the photo, and resellability as new.
 */
export function buildVisionReturnPrompt(equipment: DeclaredEquipment): string {
  return `${COMMON_INSTRUCTIONS}

ZGODNOŚĆ SPRZĘTU: czy zdjęcie przedstawia zadeklarowany sprzęt (tak/nie) i krótkie uzasadnienie.
PODSUMOWANIE: krótki opis stanu urządzenia widocznego na zdjęciu.
ŚLADY UŻYTKOWANIA: czy widoczne są ślady użytkowania lub uszkodzenia (rysy, zużycie, brakujące elementy) (tak/nie) oraz ich szczegóły.
MOŻLIWOŚĆ ODSPRZEDAŻY JAKO NOWY: czy produkt wygląda na możliwy do odsprzedania jako nowy (tak/nie) i uzasadnienie.

${equipmentLine(equipment)}`;
}
