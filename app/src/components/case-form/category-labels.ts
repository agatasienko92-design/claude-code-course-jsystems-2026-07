// Polish display labels for the equipment category enum (PRD §6 AC-02).
// The English identifiers in `lib/types` are the stable data values sent to
// the backend; this module is the single place that maps them to the labels
// shown in the UI (a frontend concern, per the comment on CATEGORY_VALUES).

import { CATEGORY_VALUES, type Category } from "../../lib/types";

export const CATEGORY_LABELS_PL: Record<Category, string> = {
  smartphone: "Smartfon",
  laptop: "Laptop",
  tablet: "Tablet",
  tv_monitor: "Telewizor / Monitor",
  audio: "Audio (słuchawki/głośniki)",
  home_appliance_small: "Sprzęt AGD (mały)",
  gaming_console: "Konsola do gier",
  other: "Inne",
};

export interface CategoryOption {
  value: Category;
  label: string;
}

/** Category `<option>` list in the declared enum order (PRD AC-02). */
export function categoryOptions(): CategoryOption[] {
  return CATEGORY_VALUES.map((value) => ({ value, label: CATEGORY_LABELS_PL[value] }));
}
