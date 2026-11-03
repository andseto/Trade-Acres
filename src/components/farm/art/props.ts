// Scenery sprites for the farm: farmhouse, shed, trees, bushes, rocks, fence, scarecrow, signs,
// mailbox, watering can and critters. Pure (Grid in, Grid out) and cached.
import type { Season } from "@/lib/types";
import { blit, type Grid, hash, makeGrid, parse, put, at, recolor, rect, snowcap, sway } from "./grid";
import { BLOSSOM, CANOPY, ROOF, ROOF_BLUE, STONE, WOOD } from "./palette";

const memo = new Map<string, Grid>();
function cached(key: string, make: () => Grid): Grid {
  let g = memo.get(key);
  if (!g) memo.set(key, (g = make()));
  return g;
}

const SNOW_L = "#f4f8ff";
const SNOW_S = "#c4d0ea";

/** Winter roofs: shingles buried in snow, the shadow lines still showing through in cool blue. */
function snowRoof(g: Grid, R: typeof ROOF): Grid {
  return recolor(g, { [R.hi]: SNOW_L, [R.light]: SNOW_L, [R.mid]: "#e2eaf8", [R.dark]: SNOW_S, [R.out]: "#5a6a9a" });
}

// ───────────── farmhouse ─────────────
export const HOUSE_W = 52;
export const HOUSE_H = 56;
/** glass panes (relative to the house sprite) — lit up at night */
export const HOUSE_WINDOWS = [
  { x: 9, y: 35, w: 6, h: 5 },
  { x: 37, y: 35, w: 6, h: 5 },
];
export const HOUSE_DOOR_X = 26;

const WINDOW = [
  "ccccccccc", //
  "cKKkKKKKc",
  "cKkKKcKKc",
  "cKKKKcKKc",
  "cccccccbc",
  "cKKKKcKKc",
  "cKKKKcKjc",
  "bbbbbbbbb",
];
// flower box under the window
const FLOWERBOX = [".pRp.Pp.p", "lLlplLlPl", "bccccccbb", ".nnnnnnn."];

const DOOR = [
  "nnnnnnnnnn",
  "nbccccccbn",
  "nbcbbbbcbn",
  "nbcbccbcbn",
  "nbcbccbcbn",
  "nbcbbbbcbn",
  "nbccccccbn",
  "nbcbbbbcbn",
  "nbcbccbYbn",
  "nbcbccbcbn",
  "nbcbccbcbn",
  "nbcbbbbcbn",
  "nbccccccbn",
  "nnnnnnnnnn",
];

function roofArea(g: Grid, x0: number, y0: number, w: number, h: number, R: typeof ROOF, inset = 4) {
  for (let y = 0; y < h; y++) {
    const ins = Math.max(0, inset - Math.floor(y / 3));
    const l = x0 + ins;
    const r = x0 + w - 1 - ins;
    for (let x = l; x <= r; x++) {
      let c: string;
      if (y === 0) c = x === l || x === r ? R.out : R.dark;
      else if (y === h - 1) c = R.out;
      else if (x === l) c = R.out;
      else if (x === r) c = R.out;
      else {
        const band = Math.floor((y - 1) / 3);
        const row = (y - 1) % 3;
        const seam = (x - l + (band % 2) * 2) % 4 === 0;
        if (row === 2) c = R.dark;
        else if (seam) c = row === 0 ? R.mid : R.dark;
        else c = row === 0 ? R.light : R.mid;
        if (y === 1) c = R.hi;
        // left side catches more light, right side falls into shade
        if (x > r - 3 && row !== 2) c = c === R.light ? R.mid : c === R.mid ? R.dark : c;
        if (x < l + 3 && row === 1 && !seam) c = R.light;
      }
      put(g, x, y0 + y, c);
    }
  }
}

function planks(g: Grid, x0: number, y0: number, w: number, h: number, horiz: boolean) {
  const W = WOOD;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const k = horiz ? y % 4 : x % 5;
      let c = k === 0 ? W.dark : k === 1 ? W.light : W.mid;
      if (horiz && k !== 0 && hash(x >> 2, y >> 2, 5) < 0.12 && (x + y) % 7 === 0) c = W.dark;
      if (!horiz && k !== 0 && hash(x, y >> 1, 6) < 0.05) c = W.dark;
      if (x === 0) c = W.out;
      if (x === w - 1) c = W.out;
      if (x === w - 2 && c !== W.dark) c = W.dark;
      put(g, x0 + x, y0 + y, c);
    }
}

export function houseSprite(season: Season): Grid {
  return cached(`house|${season}`, () => {
    const g = makeGrid(HOUSE_W, HOUSE_H);
    // chimney (behind roof)
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 7; x++) {
        const c = x === 0 || x === 6 || y === 0 ? STONE[0] : (y + (x >> 1)) % 3 === 0 ? STONE[1] : y < 3 ? STONE[3] : STONE[2];
        put(g, 36 + x, y, c);
      }
    rect(g, 37, 1, 5, 1, STONE[4]);
    // roof
    roofArea(g, 0, 6, HOUSE_W, 22, ROOF, 5);
    // walls
    const wallY = 27;
    planks(g, 3, wallY, HOUSE_W - 6, 24, true);
    // shadow under the eaves
    for (let x = 4; x < HOUSE_W - 4; x++) {
      put(g, x, wallY, WOOD.out);
      put(g, x, wallY + 1, WOOD.dark);
    }
    // stone foundation
    for (let x = 2; x < HOUSE_W - 2; x++)
      for (let y = 0; y < 4; y++) {
        const brick = (x + (y % 2) * 3) % 6 === 0;
        put(g, x, wallY + 24 + y, y === 3 ? STONE[0] : brick ? STONE[1] : y === 0 ? STONE[3] : STONE[2]);
      }
    const pal = {
      c: WOOD.light,
      b: WOOD.dark,
      n: WOOD.out,
      K: "#3a5880",
      k: "#8ab4e0",
      j: "#2a3c5c",
      Y: "#f2c14e",
      p: "#f08ab4",
      P: "#fff0f4",
      R: "#d8432e",
      l: "#357a3e",
      L: "#72b84a",
    };
    blit(g, parse(WINDOW, pal), 8, 33);
    blit(g, parse(WINDOW, pal), 36, 33);
    blit(g, parse(FLOWERBOX, pal), 8, 41);
    blit(g, parse(FLOWERBOX, pal), 36, 41);
    blit(g, parse(DOOR, pal), HOUSE_DOOR_X - 5, wallY + 13);
    // little lamp by the door
    put(g, HOUSE_DOOR_X + 7, wallY + 15, WOOD.out);
    put(g, HOUSE_DOOR_X + 7, wallY + 16, "#f2c14e");
    // doorstep
    rect(g, HOUSE_DOOR_X - 6, wallY + 27, 12, 2, STONE[3]);
    rect(g, HOUSE_DOOR_X - 6, wallY + 28, 12, 1, STONE[1]);
    // wooden sign "ACRES" plaque above door
    rect(g, HOUSE_DOOR_X - 5, wallY + 6, 10, 5, WOOD.out);
    rect(g, HOUSE_DOOR_X - 4, wallY + 7, 8, 3, WOOD.hi);
    for (let i = 0; i < 3; i++) put(g, HOUSE_DOOR_X - 3 + i * 3, wallY + 8, WOOD.dark);
    if (season === "winter") {
      const s = snowRoof(g, ROOF);
      // icicles along the eave
      for (let x = 6; x < HOUSE_W - 6; x += 3) if (hash(x, 1, 3) < 0.6) put(s, x, 27, "#dbe8f8");
      return s;
    }
    return g;
  });
}

// ───────────── shed / small barn ─────────────
export const SHED_W = 38;
export const SHED_H = 40;
export function shedSprite(season: Season): Grid {
  return cached(`shed|${season}`, () => {
    const g = makeGrid(SHED_W, SHED_H);
    roofArea(g, 0, 0, SHED_W, 15, ROOF_BLUE, 3);
    const wy = 14;
    const red = { out: "#3a1414", dark: "#6e2422", mid: "#a8382c", light: "#cc5440" };
    for (let y = 0; y < 22; y++)
      for (let x = 2; x < SHED_W - 2; x++) {
        const k = (x - 2) % 4;
        let c = k === 0 ? red.dark : k === 1 ? red.light : red.mid;
        if (x === 2 || x === SHED_W - 3) c = red.out;
        if (y === 0) c = red.out;
        if (y === 1) c = red.dark;
        if (y === 21) c = red.out;
        put(g, x, wy + y, c);
      }
    // big barn door with white X brace
    const dx = 11;
    const dw = 16;
    const dy = wy + 6;
    for (let y = 0; y < 15; y++)
      for (let x = 0; x < dw; x++) {
        let c = (x % 4 === 0 ? red.dark : red.mid) as string;
        const edge = x === 0 || x === dw - 1 || y === 0;
        const diag = Math.abs(x - Math.round((y * (dw - 1)) / 14)) <= 0 || Math.abs(dw - 1 - x - Math.round((y * (dw - 1)) / 14)) <= 0;
        if (edge || diag) c = "#f2e6cc";
        if (x === dw / 2 && y > 0) c = red.out;
        put(g, dx + x, dy + y, c);
      }
    // hayloft window
    rect(g, 16, wy + 2, 6, 3, "#f2e6cc");
    rect(g, 17, wy + 3, 4, 1, "#3a2414");
    if (season === "winter") return snowRoof(g, ROOF_BLUE);
    return g;
  });
}

// ───────────── trees & bushes: lumpy canopies shaded per lump ─────────────
type Lump = [number, number, number]; // cx, cy, r

function canopy(g: Grid, lumps: Lump[], ramp: readonly string[], seed: number, sparse = false) {
  // which lump owns each pixel (the lowest one wins → front lumps overlap back ones)
  const owner = new Int16Array(g.w * g.h).fill(-1);
  lumps.forEach(([cx, cy, r], i) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= g.w || y >= g.h) continue;
        const d = (x - cx) ** 2 + (y - cy) ** 2;
        if (d <= r * r + r * 0.6) {
          const o = owner[y * g.w + x];
          if (o < 0 || lumps[o][1] <= cy) owner[y * g.w + x] = i;
        }
      }
  });
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const o = owner[y * g.w + x];
      if (o < 0) continue;
      if (sparse && hash(x, y, seed) < 0.18) continue;
      const [cx, cy, r] = lumps[o];
      const nx = (x - cx) / r;
      const ny = (y - cy) / r;
      const light = -(nx * 0.7 + ny * 0.9); // toward upper-left
      let k = light > 0.75 ? 4 : light > 0.25 ? 3 : light > -0.35 ? 2 : 1;
      // lump rim inside the canopy: a dark crease where it meets a different lump below
      const below = y + 1 < g.h ? owner[(y + 1) * g.w + x] : -1;
      if (below >= 0 && below !== o && lumps[below][1] > cy) k = Math.min(k, 1);
      if (hash(x, y, seed + 1) < 0.07 && k > 1) k -= 1; // leafy breakup, in clusters of 1px
      if (hash(x >> 1, y >> 1, seed + 2) < 0.05 && k < 4) k += 1;
      put(g, x, y, ramp[k]);
    }
  // selective outline: darkest tone only where the canopy meets air on the bottom/right
  const out = ramp[0];
  const src = g.px.slice();
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const c = src[y * g.w + x];
      if (!c || owner[y * g.w + x] < 0) continue;
      const air = (dx: number, dy: number) => {
        const xx = x + dx;
        const yy = y + dy;
        return xx < 0 || yy < 0 || xx >= g.w || yy >= g.h || owner[yy * g.w + xx] < 0;
      };
      if (air(0, 1) || air(1, 0) || (air(-1, 0) && y > lumps[0][1])) put(g, x, y, out);
    }
}

function trunk(g: Grid, cx: number, top: number, bottom: number, w = 4) {
  const T = { out: "#2a160e", dark: "#4a2a1a", mid: "#6e4228", light: "#946038" };
  for (let y = top; y <= bottom; y++) {
    const flare = y >= bottom - 1 ? 1 : 0;
    for (let x = cx - Math.floor(w / 2) - flare; x < cx + Math.ceil(w / 2) + flare; x++) {
      const rel = x - (cx - Math.floor(w / 2) - flare);
      const span = w + flare * 2;
      let c = rel === 0 ? T.light : rel >= span - 1 ? T.out : rel >= span - 2 ? T.dark : T.mid;
      if (hash(x, y, 9) < 0.12 && c === T.mid) c = T.dark;
      put(g, x, y, c);
    }
  }
}

/** Snow-laden pine: stacked triangular tiers, lit from the left, snow lying on each tier. */
function pine(g: Grid, variant: number) {
  const R = ["#10282a", "#1a4038", "#255a42", "#33704a"];
  // [top, bottom, half-width at top, half-width at bottom]
  const tiers = [
    [1, 10, 0.5, 6],
    [8, 18, 3, 9],
    [15, 26, 4, 12],
    [23, 34, 5, 15],
  ];
  const cx = 18;
  const tierOf = (x: number, y: number) => {
    for (let i = 0; i < tiers.length; i++) {
      const [t, b, h0, h1] = tiers[i];
      if (y < t || y > b) continue;
      const hw = h0 + ((y - t) / (b - t)) * (h1 - h0);
      if (Math.abs(x + 0.5 - cx) <= hw) return i;
    }
    return -1;
  };
  for (let y = 0; y < 36; y++)
    for (let x = 0; x < TREE_W; x++) {
      const ti = tierOf(x, y);
      if (ti < 0) continue;
      const rel = (x + 0.5 - cx) / 14;
      let c = rel < -0.3 ? R[3] : rel < 0.1 ? R[2] : rel < 0.45 ? R[1] : R[0];
      if (hash(x, y, variant + 90) < 0.1) c = R[Math.max(0, R.indexOf(c) - 1)];
      const above = tierOf(x, y - 1);
      const above2 = tierOf(x, y - 2);
      if (above !== ti) c = rel < 0.4 ? SNOW_L : SNOW_S;
      else if (above2 !== ti && rel < 0.15) c = SNOW_S;
      else if (tierOf(x, y + 1) !== ti) c = R[0];
      put(g, x, y, c);
    }
}

export const TREE_W = 36;
export const TREE_H = 46;
/** A tree; variant picks one of a few hand-tuned lump layouts. frame 1 = wind-swayed canopy. */
export function treeSprite(season: Season, variant: number, frame: 0 | 1): Grid {
  return cached(`tree|${season}|${variant}|${frame}`, () => {
    const g = makeGrid(TREE_W, TREE_H);
    const layouts: Lump[][] = [
      [
        [18, 11, 9],
        [10, 17, 8],
        [26, 17, 8],
        [17, 22, 9],
        [12, 25, 6],
        [24, 25, 6],
      ],
      [
        [17, 9, 8],
        [24, 14, 8],
        [10, 16, 8],
        [18, 21, 10],
        [27, 24, 6],
        [9, 25, 6],
      ],
      [
        [18, 8, 7],
        [12, 14, 7],
        [24, 14, 7],
        [18, 19, 9],
        [11, 24, 6],
        [25, 24, 6],
        [18, 27, 6],
      ],
    ];
    const lumps = layouts[variant % layouts.length];
    trunk(g, 18, 26, TREE_H - 3, 5);
    if (season === "winter" && variant % 3 !== 0) {
      const c = makeGrid(TREE_W, TREE_H);
      pine(c, variant);
      blit(g, frame ? sway(c, 24) : c, 0, 0);
      return g;
    }
    if (season === "winter") {
      // bare branches with snow on top
      const B = "#4a2a1a";
      const branches: [number, number, number, number][] = [
        [18, 27, 10, 12],
        [18, 25, 27, 10],
        [18, 22, 18, 6],
        [14, 18, 8, 16],
        [22, 16, 29, 18],
      ];
      for (const [x0, y0, x1, y1] of branches) {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let i = 0; i <= n; i++) {
          const x = Math.round(x0 + ((x1 - x0) * i) / n);
          const y = Math.round(y0 + ((y1 - y0) * i) / n);
          put(g, x, y, B);
          if (i < n * 0.5) put(g, x + 1, y, "#6e4228");
        }
      }
      const s = snowcap(g, (c) => c === B || c === "#6e4228", 1, SNOW_L, SNOW_S);
      return frame ? sway(s, 22) : s;
    }
    const c = makeGrid(TREE_W, TREE_H);
    canopy(c, lumps, CANOPY[season], variant * 17 + 3);
    if (season === "spring") {
      // blossom clusters
      for (let i = 0; i < 26; i++) {
        const x = 5 + Math.floor(hash(i, variant, 41) * 26);
        const y = 4 + Math.floor(hash(i, variant, 42) * 24);
        if (!at(c, x, y) || !at(c, x + 1, y)) continue;
        put(c, x, y, BLOSSOM[1]);
        put(c, x + 1, y, BLOSSOM[2]);
        put(c, x, y + 1, BLOSSOM[0]);
      }
    }
    if (season === "summer" && variant === 1) {
      // an apple tree
      for (let i = 0; i < 9; i++) {
        const x = 6 + Math.floor(hash(i, 3, 51) * 24);
        const y = 8 + Math.floor(hash(i, 4, 51) * 20);
        if (!at(c, x, y) || !at(c, x + 1, y + 1)) continue;
        put(c, x, y, "#f79a6c");
        put(c, x + 1, y, "#dc4530");
        put(c, x, y + 1, "#dc4530");
        put(c, x + 1, y + 1, "#9a2638");
      }
    }
    blit(g, frame ? sway(c, 22) : c, 0, 0);
    return g;
  });
}

export const BUSH_W = 18;
export const BUSH_H = 13;
export function bushSprite(season: Season, variant: number): Grid {
  return cached(`bush|${season}|${variant}`, () => {
    const g = makeGrid(BUSH_W, BUSH_H);
    const ramp = season === "winter" ? (["#3a4a44", "#56685c", "#7a8c7a", "#e4ecf8", "#ffffff"] as const) : CANOPY[season === "fall" && variant % 2 ? "fall" : season === "fall" ? "summer" : season];
    canopy(
      g,
      [
        [6, 7, 5],
        [12, 7, 5],
        [9, 5, 5],
      ],
      ramp,
      variant * 7 + 1,
    );
    if (season === "summer" || season === "spring") {
      const berry = variant % 2 ? ["#dc4530", "#f79a6c"] : ["#fff6dc", "#f2c14e"];
      for (let i = 0; i < 5; i++) {
        const x = 3 + Math.floor(hash(i, variant, 61) * 12);
        const y = 3 + Math.floor(hash(i, variant, 62) * 6);
        if (at(g, x, y)) put(g, x, y, berry[i % 2]);
      }
    }
    if (season === "winter") return snowcap(g, () => true, 2, SNOW_L, SNOW_S);
    return g;
  });
}

const ROCKS = [
  ["..abba..", ".abbbcc.", "abbbbccd", "bbccccdd", ".ddddde."],
  ["..ab..", ".abbc.", "abbccd", ".dddd."],
  ["...aab....", ".aabbbcc..", "abbbbbccd.", "bbbcccccdd", ".dddddddd."],
];
export function rockSprite(variant: number, season: Season): Grid {
  return cached(`rock|${variant}|${season}`, () => {
    const g = parse(ROCKS[variant % ROCKS.length], { a: STONE[4], b: STONE[3], c: STONE[2], d: STONE[1], e: STONE[0] });
    return season === "winter" ? snowcap(g, () => true, 1, SNOW_L, SNOW_S) : g;
  });
}

// ───────────── fence ─────────────
export const POST_H = 12;
/** Horizontal fence run: posts every 8px, two rails. */
export function fenceRun(w: number, season: Season): Grid {
  return cached(`fenceH|${w}|${season}`, () => {
    const g = makeGrid(w, POST_H + 1);
    const W = WOOD;
    for (const ry of [3, 7]) {
      for (let x = 0; x < w; x++) {
        put(g, x, ry, W.hi);
        put(g, x, ry + 1, W.mid);
        put(g, x, ry + 2, W.out);
      }
    }
    for (let x = 0; x < w; x += 8) post(g, Math.min(x, w - 3), 0);
    post(g, w - 3, 0); // every run ends on a post, so corners and gate sides always close up
    return season === "winter" ? snowcap(g, (c) => c === W.hi || c === W.light || c === "#e8c890", 1, SNOW_L, SNOW_S) : g;
  });
}
function post(g: Grid, x: number, y: number) {
  const W = WOOD;
  for (let j = 0; j < POST_H; j++) {
    put(g, x, y + j, j === 0 ? W.out : W.light);
    put(g, x + 1, y + j, j === 0 ? W.out : j === 1 ? "#e8c890" : W.mid);
    put(g, x + 2, y + j, W.out);
  }
  put(g, x, y + 1, "#e8c890");
}
/** Vertical fence run (side of the field): posts every 7px joined by a rail seen end-on. */
export function fenceCol(h: number, season: Season): Grid {
  return cached(`fenceV|${h}|${season}`, () => {
    const g = makeGrid(3, h + POST_H);
    for (let y = 0; y < h + POST_H - 1; y++) {
      put(g, 0, y, WOOD.light);
      put(g, 1, y, WOOD.mid);
      put(g, 2, y, WOOD.out);
    }
    for (let y = 0; y < h - 4; y += 9) post(g, 0, y);
    post(g, 0, h); // end on a post that lines up with the bottom run's corner post
    return season === "winter" ? snowcap(g, (c) => c === "#e8c890" || c === WOOD.light, 1, SNOW_L, SNOW_S) : g;
  });
}

// ───────────── signs ─────────────
export const SIGN_W = 40;
export const SIGN_H = 13;
export function signSprite(w = SIGN_W, season: Season = "summer"): Grid {
  return cached(`sign|${w}|${season}`, () => {
    const g = makeGrid(w, SIGN_H);
    const W = WOOD;
    // posts
    for (const px of [5, w - 7]) {
      rect(g, px, 6, 2, SIGN_H - 6, W.dark);
      put(g, px, SIGN_H - 1, W.out);
      put(g, px + 1, SIGN_H - 1, W.out);
    }
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < w; x++) {
        if ((x === 0 || x === w - 1) && (y === 0 || y === 8)) continue;
        let c: string = W.light;
        if (y === 0 || x === 0 || x === w - 1 || y === 8) c = W.out;
        else if (y === 1) c = W.hi;
        else if (y === 7) c = W.mid;
        else if (y === 4 && hash(x >> 2, 4, 21) < 0.5) c = "#b47a42";
        put(g, x, y, c);
      }
    // nail heads
    put(g, 2, 2, W.dark);
    put(g, w - 3, 2, W.dark);
    return season === "winter" ? snowcap(g, (c) => c === W.out || c === W.hi, 1, SNOW_L, SNOW_S) : g;
  });
}

// ───────────── scarecrow, mailbox ─────────────
const SCARECROW = [
  ".......nn......",
  ".....nnbbnn....",
  "....nbbcbbbn...",
  "....nbbbbbbn...",
  "..nnnbbbbbnnnn.",
  ".nccccccccccccn",
  "..nnnnnnnnnnnn.",
  ".....sSsSss....",
  ".....sxSsxs....",
  ".....SssssS....",
  "......SsrS.....",
  "..uu.rRRRRr.uu.",
  ".uYyrRRpRRRryYu",
  "..y.rRRRRRRr.y.",
  "....rRqRRqRr...",
  "....rRRRRRRr...",
  ".....nbbbbn....",
  ".....BvBBvB....",
  ".....vB..Bv....",
  "......y..y.....",
  ".......nn......",
  ".......nb......",
  ".......nb......",
  ".......nb......",
  "......nnbn.....",
];
export function scarecrowSprite(season: Season): Grid {
  return cached(`scarecrow|${season}`, () => {
    const g = parse(SCARECROW, {
      n: WOOD.out,
      b: "#7a5a2a",
      c: "#a8823e",
      s: "#e2c68e",
      S: "#b8985e",
      x: "#2a1a10",
      r: "#5e1a1e",
      R: "#b8402e",
      p: "#e07050",
      q: "#8a2a26",
      u: "#f6e3a0",
      Y: "#e3bf5e",
      y: "#b08a3a",
      B: "#4a62a8",
      v: "#2e3a6e",
    });
    return season === "winter" ? snowcap(g, (c) => c === WOOD.out || c === "#7a5a2a" || c === "#a8823e", 1, SNOW_L, SNOW_S) : g;
  });
}

const MAILBOX = ["..nnnnn..", ".nRRRRRnY", "nRpRRRRnY", "nRRRRRRnn", "nqqqqqqn.", ".nnnnnn..", "...nb....", "...nb....", "...nb....", "...nb....", "..nnbn..."];
export function mailboxSprite(): Grid {
  return cached("mailbox", () => parse(MAILBOX, { n: "#2a160c", R: "#4a72c4", p: "#9cb8ec", q: "#2e4686", b: WOOD.mid, Y: "#f2c14e" }));
}

// ───────────── watering can (side view) ─────────────
const CAN = [
  "....nnnnn.......",
  "...n.....n......",
  "...n.....n......",
  "..sSSSSSSSs.....",
  ".sSWWSSSSSSs..ss",
  ".sSWSSSSSSSs.sWs",
  ".sSSSSSSSSSsssS.",
  ".sSSSSSSSSSSSs..",
  ".svvvvvvvvvs....",
  ".svvvvvvvvvs....",
  "..sssssssss.....",
];
const CAN_POUR = [
  "...nnn..........",
  "..n...nn........",
  ".n......n.......",
  ".n..sss..n......",
  "..sSSSSSs.......",
  ".sSWWSSSSs......",
  ".sSWSSSSSSs.....",
  "sSSSSSSSSSSs....",
  "svSSSSSSSSSs....",
  ".svvSSSSSSSSs...",
  "..svvvSSSSSSs...",
  "...ssvvvvSSSss..",
  "......sssvvsSs..",
  "..........ssSWs.",
  "............sSs.",
  ".............s..",
];
/** where water leaves the spout, per tilt */
export const CAN_SPOUT = [
  { x: 15, y: 5 },
  { x: 15, y: 5 },
  { x: 13, y: 15 },
];
export function canSprite(tilt: 0 | 1 | 2): Grid {
  return cached(`can|${tilt}`, () => {
    const pal = { n: "#3a3a4e", s: "#2e3a52", S: "#6e8cb0", W: "#cfe2f4", v: "#4a6088" };
    return parse(tilt === 2 ? CAN_POUR : CAN, pal);
  });
}

// ───────────── critters ─────────────
export function butterflySprite(color: string, frame: 0 | 1): Grid {
  return cached(`bfly|${color}|${frame}`, () =>
    parse(frame ? [".a.a.", "..b..", "....."] : ["aa.aa", "aabaa", ".a.a."], { a: color, b: "#2a1a10" }),
  );
}
export function birdSprite(frame: 0 | 1): Grid {
  return cached(`bird|${frame}`, () => parse(frame ? [".......", "bbb.bbb", "...b..."] : ["bb...bb", "..b.b..", "...b..."], { b: "#2a2632" }));
}

export const FLOWER_SHAPES = [[".p.", "pYp", ".p."], ["p.p", ".Y.", "p.p"], ["pp", "pY"]];
export function flowerSprite(shape: number, petal: string): Grid {
  return cached(`fl|${shape}|${petal}`, () => parse(FLOWER_SHAPES[shape % FLOWER_SHAPES.length], { p: petal, Y: "#f2c14e" }));
}

/** Grid → small helper: blit at x,y onto another grid with clipping. Re-exported for the scene. */
export { blit };
