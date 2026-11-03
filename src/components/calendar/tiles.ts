import type { CSSProperties } from "react";

// Pixel-art ground tiles for the P&L calendar, drawn as tiny 16×16 SVGs and scaled up crisply.
// Green days are grass (lusher = bigger day), red days are dry cracked earth (more cracks = worse day),
// quiet days are plain tilled soil. Levels are stepped, not smooth, so the grid reads like a game map.

export type TileLevel = 1 | 2 | 3 | 4;

const rect = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${fill}'/>`;

const svg = (body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'>${body}</svg>`,
  )}")`;

// ── grass ──
const GRASS: Record<TileLevel, { base: string; dark: string; blade: string; tufts: number; flowers: number }> = {
  1: { base: "#4a5426", dark: "#3d4520", blade: "#66772f", tufts: 2, flowers: 0 },
  2: { base: "#4c6a24", dark: "#3e581d", blade: "#6d9130", tufts: 3, flowers: 0 },
  3: { base: "#548226", dark: "#456c1f", blade: "#80b23b", tufts: 5, flowers: 0 },
  4: { base: "#5f9a2b", dark: "#4d8023", blade: "#9bd65a", tufts: 6, flowers: 2 },
};
const TUFTS: [number, number][] = [
  [2, 3],
  [10, 9],
  [12, 1],
  [5, 11],
  [8, 5],
  [1, 13],
];
const FLOWERS: [number, number, string][] = [
  [14, 6, "#f2c14e"],
  [4, 7, "#f6e7c1"],
];
const SPECKS: [number, number][] = [
  [6, 1],
  [14, 13],
  [0, 8],
  [11, 14],
  [7, 15],
];

function tuft(x: number, y: number, c: string) {
  return rect(x, y + 1, 1, 2, c) + rect(x + 1, y + 2, 1, 1, c) + rect(x + 2, y, 1, 3, c);
}

function grassTile(level: TileLevel) {
  const g = GRASS[level];
  let body = rect(0, 0, 16, 16, g.base);
  for (const [x, y] of SPECKS) body += rect(x, y, 1, 1, g.dark);
  for (const [x, y] of TUFTS.slice(0, g.tufts)) body += tuft(x, y, g.blade);
  for (const [x, y, c] of FLOWERS.slice(0, g.flowers)) body += rect(x, y, 1, 1, c);
  return svg(body);
}

// ── dry earth ──
const DRY: Record<TileLevel, { base: string; light: string; crack: string; cracks: number }> = {
  1: { base: "#5c3d24", light: "#6b4a2c", crack: "#3a2414", cracks: 1 },
  2: { base: "#6c3f22", light: "#7c4c2a", crack: "#3a1f10", cracks: 2 },
  3: { base: "#7a3c20", light: "#8c4a28", crack: "#35180b", cracks: 3 },
  4: { base: "#8a3520", light: "#9e4429", crack: "#2e1208", cracks: 4 },
};
// each crack is a jagged run of pixels
const CRACKS: [number, number][][] = [
  [
    [1, 3],
    [2, 3],
    [3, 4],
    [4, 4],
    [5, 5],
    [6, 5],
  ],
  [
    [10, 9],
    [11, 10],
    [11, 11],
    [12, 12],
    [13, 12],
    [14, 13],
  ],
  [
    [12, 2],
    [12, 3],
    [11, 4],
    [10, 4],
    [10, 5],
  ],
  [
    [2, 11],
    [3, 12],
    [4, 12],
    [5, 13],
    [6, 13],
    [7, 14],
    [8, 14],
  ],
];
const PEBBLES: [number, number][] = [
  [8, 1],
  [14, 6],
  [1, 7],
  [9, 14],
];

function dryTile(level: TileLevel) {
  const d = DRY[level];
  let body = rect(0, 0, 16, 16, d.base);
  for (const [x, y] of PEBBLES) body += rect(x, y, 1, 1, d.light);
  for (const crack of CRACKS.slice(0, d.cracks)) for (const [x, y] of crack) body += rect(x, y, 1, 1, d.crack);
  return svg(body);
}

// ── tilled soil (no trades) ──
function soilTile(dim: boolean) {
  const base = dim ? "#1f160d" : "#2c1f13";
  const furrow = dim ? "#170f08" : "#20160c";
  const ridge = dim ? "#271b10" : "#3a2918";
  return svg(
    rect(0, 0, 16, 16, base) +
      rect(0, 2, 16, 1, ridge) +
      rect(0, 3, 16, 1, furrow) +
      rect(0, 10, 16, 1, ridge) +
      rect(0, 11, 16, 1, furrow) +
      rect(5, 6, 1, 1, ridge) +
      rect(12, 14, 1, 1, ridge),
  );
}

const cache = new Map<string, string>();
const memo = (key: string, make: () => string) => {
  let v = cache.get(key);
  if (!v) {
    v = make();
    cache.set(key, v);
  }
  return v;
};

export const grassBg = (level: TileLevel) => memo(`g${level}`, () => grassTile(level));
export const dryBg = (level: TileLevel) => memo(`d${level}`, () => dryTile(level));
export const soilBg = (dim = false) => memo(`s${dim}`, () => soilTile(dim));

/** Stepped intensity: how big this day was relative to the month's biggest. */
export function tileLevel(absNet: number, maxAbs: number): TileLevel {
  const r = maxAbs > 0 ? absNet / maxAbs : 0;
  if (r > 0.75) return 4;
  if (r > 0.45) return 3;
  if (r > 0.2) return 2;
  return 1;
}

/** CSS for a tile background, scaled 2× with crisp pixels. */
export const tileStyle = (bg: string, px = 32): CSSProperties => ({
  backgroundImage: bg,
  backgroundSize: `${px}px ${px}px`,
  imageRendering: "pixelated",
});
