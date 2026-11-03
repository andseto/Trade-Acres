// A plot: 48×40 tilled soil (3/4 view, furrows running across) planted with 2 rows × 3 crops,
// inside a 56×56 box (8px of headroom on top for tall crops, a 4px grass border around the soil).
import type { CropId } from "@/lib/types";
import type { GrowthStage, PlotState } from "@/lib/farm";
import { blit, type Grid, hash, makeGrid, parse, put } from "./grid";
import { cropGrid, PRODUCE } from "./crops";
import { GRASS } from "./palette";

export const PLOT_BOX = 56;
export const SOIL_X = 4;
export const SOIL_Y = 12;
export const SOIL_W = 48;
export const SOIL_H = 40;

interface SoilPal {
  edge: string;
  furrow: string;
  shade: string;
  base: string;
  ridge: string;
  speck: string;
  sheen?: string;
  crack?: string;
  cracks?: number;
}

const SOILS: Record<"soaked" | "moist" | "dry" | "parched" | "withering" | "dead", SoilPal> = {
  soaked: { edge: "#1e100a", furrow: "#28160e", shade: "#341e12", base: "#432819", ridge: "#573622", speck: "#694430", sheen: "#7d8aa6" },
  moist: { edge: "#2a170c", furrow: "#3c2414", shade: "#4c2f1a", base: "#5f3c22", ridge: "#79502e", speck: "#8c6038" },
  dry: { edge: "#4a301c", furrow: "#7a5432", shade: "#8a6240", base: "#9c7249", ridge: "#b48a5a", speck: "#cba36e" },
  parched: { edge: "#56391f", furrow: "#8c6844", shade: "#9e7a52", base: "#b08a5c", ridge: "#c6a272", speck: "#dabc8a", crack: "#5e3d22", cracks: 5 },
  withering: { edge: "#4e3a28", furrow: "#86705a", shade: "#968068", base: "#a69078", ridge: "#baa68c", speck: "#cdbca0", crack: "#4e3a2a", cracks: 9 },
  dead: { edge: "#1e1a18", furrow: "#36302c", shade: "#423a34", base: "#4e4540", ridge: "#5e544c", speck: "#6e645a", crack: "#2e2622", cracks: 6 },
};

function soilFor(state: PlotState): SoilPal {
  if (state === "harvested" || state === "fallow") return SOILS.moist;
  return SOILS[state];
}

/** Ridge pattern, period 9 — plants sit on rows where index === 4. */
function rowTone(p: SoilPal, y: number): string {
  const i = (((y - 2) % 9) + 9) % 9;
  if (i === 0) return p.ridge;
  if (i <= 4) return p.base;
  if (i === 5 || i === 8) return p.shade;
  return p.furrow;
}

function paintSoil(g: Grid, p: SoilPal, seed: number) {
  const X = SOIL_X;
  const Y = SOIL_Y;
  for (let y = 0; y < SOIL_H; y++)
    for (let x = 0; x < SOIL_W; x++) {
      // rounded corners
      if ((x === 0 || x === SOIL_W - 1) && (y === 0 || y === SOIL_H - 1)) continue;
      let c = rowTone(p, y);
      const r = hash(x, y, seed);
      const i = (((y - 2) % 9) + 9) % 9;
      if (i >= 1 && i <= 4 && r < 0.07) c = p.speck;
      else if (i === 0 && r < 0.12) c = p.speck;
      else if ((i === 6 || i === 7) && r < 0.06) c = p.edge;
      // clumps: little 2-px light pebbles sitting on ridges
      if (i === 1 && hash(x >> 1, y, seed + 7) < 0.05) c = p.ridge;
      if (y === 0 || x === 0) c = p.edge;
      else if (y === 1) c = p.furrow;
      else if (x === SOIL_W - 1) c = p.shade;
      // front lip: the cut face of the tilled earth
      if (y >= SOIL_H - 2) c = y === SOIL_H - 1 ? p.edge : p.furrow;
      put(g, X + x, Y + y, c);
    }
  // wet sheen: standing water glints in the furrows
  if (p.sheen)
    for (let y = 2; y < SOIL_H - 2; y++) {
      const i = (((y - 2) % 9) + 9) % 9;
      if (i !== 6) continue;
      for (let x = 3; x < SOIL_W - 4; x++)
        if (hash(x, y, seed + 3) < 0.07) {
          put(g, X + x, Y + y, p.sheen);
          put(g, X + x + 1, Y + y, p.sheen);
        }
    }
  // cracks: short jagged random walks
  if (p.crack && p.cracks)
    for (let k = 0; k < p.cracks; k++) {
      let x = 3 + Math.floor(hash(k, 1, seed + 11) * (SOIL_W - 8));
      let y = 3 + Math.floor(hash(k, 2, seed + 11) * (SOIL_H - 8));
      const len = 4 + Math.floor(hash(k, 3, seed + 11) * 5);
      const dir = hash(k, 4, seed + 11) < 0.5 ? -1 : 1;
      for (let s = 0; s < len; s++) {
        put(g, X + x, Y + y, p.crack);
        const r = hash(k, s, seed + 13);
        if (r < 0.5) x += dir;
        else if (r < 0.85) y += 1;
        else {
          x += dir;
          y -= 1;
        }
        if (x < 2 || x > SOIL_W - 3 || y < 2 || y > SOIL_H - 3) break;
      }
    }
}

const TUFT = ["s.l", ".s."]; // tiny v of grass blades

function paintBorder(g: Grid) {
  for (let y = 8; y < PLOT_BOX; y++)
    for (let x = 0; x < PLOT_BOX; x++) {
      if ((x === 0 || x === PLOT_BOX - 1) && (y === 8 || y === PLOT_BOX - 1)) continue;
      let c = GRASS.summer[2];
      if (y === PLOT_BOX - 1) c = GRASS.summer[1];
      else if (x === 0 || y === 8) c = GRASS.summer[3];
      else if (hash(x, y, 91) < 0.06) c = GRASS.summer[1];
      else if (hash(x, y, 92) < 0.05) c = GRASS.summer[3];
      put(g, x, y, c);
    }
  const pal = { s: GRASS.summer[1], l: GRASS.summer[4] };
  const tuft = parse(TUFT, pal);
  for (const [x, y] of [
    [5, 9],
    [40, 9],
    [1, 30],
    [52, 20],
    [22, 53],
    [46, 53],
  ])
    blit(g, tuft, x, y);
}

/** Grass blades that overhang the top lip of the soil — sells the "dug into the lawn" look. */
function paintLip(g: Grid, colors: readonly string[]) {
  for (let x = SOIL_X + 2; x < SOIL_X + SOIL_W - 2; x++) {
    const r = hash(x, 0, 51);
    if (r < 0.18) put(g, x, SOIL_Y, colors[3]);
    else if (r < 0.26) {
      put(g, x, SOIL_Y, colors[2]);
      put(g, x, SOIL_Y + 1, colors[1]);
    }
  }
}

const CRATE = [
  "..34..43.4..",
  ".3443443343.",
  "322332332232",
  "nnnnnnnnnnnn",
  "nkccccccccbn",
  "nbbbbbbbbbbn",
  "nkccccccccbn",
  "nbbbbbbbbbbn",
  "nnnnnnnnnnnn",
];

const STAR = [
  "....w....",
  "...wuw...",
  "wwwwuYwww",
  "wuuuYYYyw",
  ".wYYYYyw.",
  "..wYYyw..",
  ".wYYwyyw.",
  ".wyw.wyw.",
  ".ww...ww.",
];

const SPARKLE = [".u.", "uWu", ".u."];

const STRAW = [
  ["Yu", ".y"],
  ["uY.", "..y"],
  [".u", "Yy"],
  ["Yuy"],
  ["u..", ".Yy"],
];

const cache = new Map<string, Grid>();

export interface PlotOpts {
  /** include the grass border (true for standalone previews; the farm scene draws its own lawn) */
  border?: boolean;
  frame?: 0 | 1;
  /** grass ramp for the lip (seasonal in the scene) */
  grass?: readonly string[];
}

export function plotGrid(crop: CropId, stage: GrowthStage = "ripe", state: PlotState = "moist", opts: PlotOpts = {}): Grid {
  const { border = true, frame = 0, grass = GRASS.summer } = opts;
  const key = `${crop}|${stage}|${state}|${border ? 1 : 0}|${frame}|${grass[0]}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const g = makeGrid(PLOT_BOX, PLOT_BOX);
  if (border) paintBorder(g);
  const soil = soilFor(state);
  paintSoil(g, soil, 7);
  paintLip(g, border ? GRASS.summer : grass);

  if (state === "fallow") {
    // straw mulch spread over resting soil
    const pal = { Y: "#e3bf5e", y: "#b08a3a", u: "#f6e3a0" };
    const bits = STRAW.map((s) => parse(s, pal));
    for (let y = SOIL_Y + 3; y < SOIL_Y + SOIL_H - 4; y += 3)
      for (let x = SOIL_X + 2; x < SOIL_X + SOIL_W - 3; x += 3) {
        const r = hash(x, y, 33);
        if (r < 0.5) blit(g, bits[Math.floor(hash(x, y, 34) * bits.length)], x + (r < 0.2 ? 1 : 0), y);
      }
    // a little hay bale in the corner
    const bale = parse(
      ["..uYYYYu..", ".uYyYYyYy.", "uYYYyYYyYw", "YyYYYyYYyw", "yYyYYYyYyw", "wyywyywyyw", ".wwwwwwww."],
      { ...pal, w: "#7a5422" },
    );
    blit(g, bale, SOIL_X + SOIL_W - 14, SOIL_Y + SOIL_H - 11);
  } else {
    const mound: [string, string, string] = [soil.furrow, soil.base, soil.ridge];
    const plantState: PlotState = state === "harvested" ? "moist" : state;
    const rows = state === "harvested" ? [27] : [27, 45];
    for (const base of rows)
      for (let i = 0; i < 3; i++) {
        const st: GrowthStage = state === "harvested" ? "ripe" : state === "dead" && (stage === "seed" || stage === "sprout") ? "young" : stage;
        const sprite = cropGrid(crop, st, plantState, { mound, frame, flip: i === 1 });
        blit(g, sprite, SOIL_X + i * 16, base - sprite.h + 1);
      }
    if (state === "harvested") {
      const [d, m, l, hi] = PRODUCE[crop];
      const crate = parse(CRATE, { "1": d, "2": m, "3": l, "4": hi, n: "#3c2216", b: "#7a4a26", c: "#a8723c", k: "#d09a58" });
      blit(g, crate, SOIL_X + 6, 39);
      blit(g, crate, SOIL_X + 28, 41);
      const star = parse(STAR, { w: "#7a3e1a", u: "#fff4c0", Y: "#f6c94a", y: "#d6922c" });
      blit(g, star, PLOT_BOX - 12, 6 - frame);
      const sp = parse(SPARKLE, { u: "#f6e3a0", W: "#ffffff" });
      if (frame === 0) blit(g, sp, PLOT_BOX - 17, 3);
      else blit(g, sp, PLOT_BOX - 4, 14);
      blit(g, sp, SOIL_X + 1, 33 + frame);
    }
  }
  cache.set(key, g);
  return g;
}
