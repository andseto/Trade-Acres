import type { Account, AccountStatus, CropId, Season } from "./types";

// ───────────────────────────── crop catalogue ─────────────────────────────

export interface Crop {
  id: CropId;
  name: string;
  blurb: string;
}

export const CROPS: Crop[] = [
  { id: "wheat", name: "Wheat", blurb: "Steady and dependable. The staple of every good farm." },
  { id: "corn", name: "Corn", blurb: "Grows tall. Made for the big funded accounts." },
  { id: "carrot", name: "Carrot", blurb: "Does its best work out of sight. Patience pays." },
  { id: "tomato", name: "Tomato", blurb: "Needs regular care, rewards you every season." },
  { id: "pumpkin", name: "Pumpkin", blurb: "Slow to start, huge when it lands. A swing trader's crop." },
  { id: "strawberry", name: "Strawberry", blurb: "Small, sweet, frequent. Perfect for scalpers." },
  { id: "sunflower", name: "Sunflower", blurb: "Always faces the light. Good for a fresh eval." },
  { id: "blueberry", name: "Blueberry", blurb: "Bushy and resilient. Survives a rough week." },
];

export const CROP_BY_ID: Record<CropId, Crop> = Object.fromEntries(CROPS.map((c) => [c.id, c])) as Record<CropId, Crop>;

export function getCrop(id: string): Crop {
  return CROP_BY_ID[id as CropId] ?? CROP_BY_ID.wheat;
}

export const SEASONS: { id: Season; name: string }[] = [
  { id: "spring", name: "Spring" },
  { id: "summer", name: "Summer" },
  { id: "fall", name: "Fall" },
  { id: "winter", name: "Winter" },
];

export function isSeason(v: string): v is Season {
  return SEASONS.some((s) => s.id === v);
}

// ───────────────────────────── moisture ─────────────────────────────
// Journaling waters a plot. The longer since the last entry, the drier the soil and the sadder the crop.
// Plots never die from thirst — only a blown account kills a crop.

export type Moisture = "soaked" | "moist" | "dry" | "parched" | "withering";

export const MOISTURE_THRESHOLDS_HOURS: { level: Moisture; maxHours: number }[] = [
  { level: "soaked", maxHours: 6 },
  { level: "moist", maxHours: 24 },
  { level: "dry", maxHours: 48 },
  { level: "parched", maxHours: 96 },
  { level: "withering", maxHours: Infinity },
];

export function hoursSince(iso: string, now: Date = new Date()): number {
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 36e5);
}

export function getMoisture(lastWateredAt: string, now: Date = new Date()): Moisture {
  const h = hoursSince(lastWateredAt, now);
  return MOISTURE_THRESHOLDS_HOURS.find((t) => h < t.maxHours)!.level;
}

/** 100 = just watered, 0 = withering (96h+). Handy for water bars. */
export function getHydration(lastWateredAt: string, now: Date = new Date()): number {
  const h = hoursSince(lastWateredAt, now);
  return Math.round(Math.max(0, Math.min(100, 100 - (h / 96) * 100)));
}

export const MOISTURE_LABEL: Record<Moisture, string> = {
  soaked: "Freshly watered",
  moist: "Moist",
  dry: "Dry",
  parched: "Parched",
  withering: "Withering",
};

/** Moisture levels that should nudge the trader to journal. */
export const THIRSTY: Moisture[] = ["dry", "parched", "withering"];

// ───────────────────────────── growth ─────────────────────────────
// Crops grow with every journal entry (water_count).

export type GrowthStage = "seed" | "sprout" | "young" | "mature" | "ripe";

export const GROWTH_STAGES: { stage: GrowthStage; minWaterings: number; label: string }[] = [
  { stage: "seed", minWaterings: 0, label: "Seeded" },
  { stage: "sprout", minWaterings: 1, label: "Sprouting" },
  { stage: "young", minWaterings: 4, label: "Growing" },
  { stage: "mature", minWaterings: 10, label: "Mature" },
  { stage: "ripe", minWaterings: 20, label: "Ripe" },
];

export function getGrowthStage(waterCount: number): GrowthStage {
  let stage: GrowthStage = "seed";
  for (const g of GROWTH_STAGES) if (waterCount >= g.minWaterings) stage = g.stage;
  return stage;
}

/** Waterings left until the next stage, or null when ripe. */
export function wateringsToNextStage(waterCount: number): number | null {
  const next = GROWTH_STAGES.find((g) => g.minWaterings > waterCount);
  return next ? next.minWaterings - waterCount : null;
}

// ───────────────────────────── visual state ─────────────────────────────
// What the farm should draw for a plot.

export type PlotState = Moisture | "dead" | "harvested" | "fallow";

export function getPlotState(account: Pick<Account, "status" | "last_watered_at">, now?: Date): PlotState {
  const s: AccountStatus = account.status;
  if (s === "blown") return "dead";
  if (s === "retired") return "fallow";
  if (s === "passed") return "harvested";
  return getMoisture(account.last_watered_at, now);
}

export const PLOT_STATE_LABEL: Record<PlotState, string> = {
  ...MOISTURE_LABEL,
  dead: "Crop died (account blown)",
  harvested: "Harvested (eval passed)",
  fallow: "Fallow (retired)",
};
