import type { AccountType, CropId } from "@/lib/types";

export type PlotField =
  | "name"
  | "firm"
  | "account_type"
  | "account_size"
  | "profit_target"
  | "max_drawdown"
  | "notes"
  | "crop"
  | "plot_name";

export interface PlotFormState {
  errors?: Partial<Record<PlotField, string>>;
  message?: string;
}

/** Client-side values for the shared plot form pieces (all strings for inputs). */
export interface PlotFormValues {
  name: string;
  firm: string;
  account_type: AccountType;
  account_size: string;
  profit_target: string;
  max_drawdown: string;
  notes: string;
  crop: CropId;
  plot_name: string;
}

export const PLOT_FIELDS: PlotField[] = [
  "name",
  "firm",
  "account_type",
  "account_size",
  "profit_target",
  "max_drawdown",
  "notes",
  "crop",
  "plot_name",
];

/** "50,000" / "$50k" / "50000" -> 50000; "" -> null; garbage -> NaN */
export function parseMoney(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!m) return NaN;
  const mult = m[2] === "k" ? 1_000 : m[2] === "m" ? 1_000_000 : 1;
  return Math.round(Number(m[1]) * mult * 100) / 100;
}
