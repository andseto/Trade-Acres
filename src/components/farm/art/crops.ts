// Hand-drawn crop sprites. 16px wide, bottom-anchored (the last row is the soil mound the plant sits
// in). Light comes from the upper left: highlights lean warm/yellow, shadows lean cool/blue-green.
import type { CropId } from "@/lib/types";
import type { GrowthStage, PlotState } from "@/lib/farm";
import { droop, type Grid, luma, mapColors, mirror, parse, recolor, sway } from "./grid";
import { mix } from "./color";

/** Master crop palette — every crop shares these ramps so the field reads as one set. */
export const CP = {
  // leaf ramp (cool dark → warm light)
  G: "#1e3d33",
  g: "#2e6b40",
  l: "#4e9a3c",
  L: "#8cc84b",
  h: "#cfe57a",
  // soil mound
  D: "#3b2415",
  d: "#5e3a20",
  m: "#8a5a30",
  // seed
  s: "#e8d49a",
  S: "#a8884e",
  // gold ramp (wheat, corn kernels, sunflower petals)
  w: "#8a4f22",
  y: "#cf902e",
  Y: "#efc24e",
  u: "#fbeaa2",
  // orange ramp (carrot, pumpkin)
  r: "#6a2418",
  o: "#b8501e",
  O: "#e8802a",
  a: "#f9bd5c",
  // red ramp (tomato, strawberry)
  Q: "#4a1430",
  q: "#9a2638",
  R: "#dc4530",
  p: "#f79a6c",
  // whites (blossoms)
  W: "#fff6dc",
  e: "#c8bcb4",
  // blue ramp (blueberry)
  x: "#1d1b4a",
  v: "#38428e",
  B: "#5a72cf",
  V: "#a9bcf2",
  // wood / sunflower disc
  n: "#3c2216",
  b: "#6a3e22",
  c: "#a06c3a",
  k: "#c8743c",
} as const;

const MOUND = [".....dddddDD...."];

const SEED = [
  ".......us.......",
  "......mSsm......",
  "....mmmddmmm....",
  "...mdddddddddD..",
  "....DDDDDDDDD...",
];

const DICOT_SPROUT = [
  "....hLl..lLh....",
  "...hLLlg.lLLg...",
  "....glllglgg....",
  ".......gl.......",
  ".......Gl.......",
  "......mGgm......",
  ...MOUND,
];

type StageArt = Record<Exclude<GrowthStage, "seed">, string[]>;

const ART: Record<CropId, StageArt> = {
  wheat: {
    sprout: [
      "........h.......",
      ".....h..L..h....",
      "......L.L.L.....",
      "......LlLlg.....",
      ".......gl.......",
      "......mGgm......",
      ...MOUND,
    ],
    young: [
      "........h.......",
      "....h...L...h...",
      "....L..hL..L....",
      ".....L.Ll.L.....",
      ".h...LlLl.L..h..",
      "..L..lLlg.l.L...",
      "...L.lLlglG.L...",
      "...lLglLglgl....",
      "....llgLgllG....",
      ".....lgLggG.....",
      "......mGgGm.....",
      ...MOUND,
    ],
    mature: [
      ".......hL.......",
      "...hL..LL..hL...",
      "...LL..Ll..Ll...",
      "...Ll..lg..lg...",
      "...lg...l...l...",
      "....l...L..l....",
      ".h..l..lL..l..h.",
      "..L.L..lL..l.L..",
      "..LlL.lLl.lL.l..",
      "...LlLlLglLgl...",
      "...lLlLlglgl....",
      "....lLglLglG....",
      "....lgLlLgl.....",
      ".....glLggG.....",
      "......mGgGm.....",
      ...MOUND,
    ],
    ripe: [
      "..u.....u....u..",
      "..Yu...uY...uY..",
      ".uYY...YYy..YYw.",
      ".YyY..uYyw..Yyw.",
      ".yYw..YyYw.uYyw.",
      "..yw..yYw..Yyw..",
      "..Yw...yw..yw...",
      "...Y...Y...Y....",
      "...y..uY..Yy....",
      "....YyYy.Yy.....",
      "....yYyYyYw.....",
      ".....YyYyyw.....",
      ".....yYwyw......",
      "......yYyw......",
      "......mwywm.....",
      ...MOUND,
    ],
  },
  corn: {
    sprout: [
      ".........h......",
      "........hL......",
      "...hL...Ll......",
      "....LL..lg......",
      ".....Llglg......",
      "......mGgm......",
      ...MOUND,
    ],
    young: [
      ".......h........",
      ".......L........",
      ".......Ll.......",
      "..hL...lL...Lh..",
      "...LL..lL..LL...",
      "....Ll.gL.lL....",
      ".....LlgLlL.....",
      ".hLL..lgLl..Lh..",
      "...LLllgLlLLg...",
      "......lgLl......",
      "......glLg......",
      "......mGlGm.....",
      ...MOUND,
    ],
    mature: [
      ".......Y........",
      "......YyY.......",
      ".....y.Y.y......",
      ".......y........",
      ".......lg.......",
      "...hL..lg.......",
      "....LL.lg.......",
      ".....LLlg..Lh...",
      "......Llg.LL....",
      ".......lgLL.....",
      ".......lgl......",
      "..hLL..lg.......",
      "....LLLlg.......",
      ".......lgLk.....",
      ".......lgLl.....",
      ".......lgl..hL..",
      "...hL..lg.LL....",
      "....LL.lgLL.....",
      ".....LLlgg......",
      "......Llg.......",
      ".......lg.......",
      ".......lG.......",
      "......mGgm......",
      ...MOUND,
    ],
    ripe: [
      ".......u........",
      "......uYu.......",
      ".....Y.Y.Y......",
      "....y..Y..y.....",
      ".......y........",
      ".......lg.......",
      "...hL..lg.......",
      "....LL.lg..hL...",
      ".....LLlg.LL....",
      "......Llg.L.....",
      ".......lgLk.....",
      ".......lLuY.....",
      ".......lLYy.....",
      ".......lLyw.....",
      "..hLL..lgLg.....",
      "....LLLlg.......",
      ".......lg..hL...",
      "....kL.lg.LL....",
      "....uYLlgLL.....",
      "....YyLlg.......",
      "....ywLlg.......",
      ".....gglg.......",
      "...hL..lg.......",
      "....LLLlg.......",
      ".......lg.......",
      ".......lG.......",
      "......mGgm......",
      ...MOUND,
    ],
  },
  carrot: {
    sprout: [
      "....h..h..h.....",
      "....L.hL.Lh.....",
      ".....LlL.L......",
      "......lLl.......",
      ".......g........",
      "......mGgm......",
      ...MOUND,
    ],
    young: [
      "....h..h...h....",
      "...hL.hL..hL....",
      "...L.LlL.LL.....",
      "....LlLlLl.h....",
      ".h...lLglLL.....",
      "..LL..lgl.......",
      "....LLlgl.......",
      "......mGgm......",
      ...MOUND,
    ],
    mature: [
      "...h...h..h.....",
      "..hL..hL.hL..h..",
      "..L.L.LlLL..hL..",
      "...LlL.lL..LL...",
      ".h..LlLlglLl....",
      "..LL.lLglLl.h...",
      "....LllglgLL....",
      "..LLl.lgglg.....",
      "......lggl......",
      "......gGGg......",
      "......mOOm......",
      ".....dorrdD.....",
    ],
    ripe: [
      "....h....h......",
      "..h.L..h.L..h...",
      "..L.LhL.L.hL.L..",
      "...LlLl.LlL.L...",
      ".h..lLlLlgLl..h.",
      "..L..lLlglL..L..",
      "...LL.lLglg.LL..",
      "....LLlgglgLl...",
      "......lgglg.....",
      "......gGGgG.....",
      ".....aOOOOo.....",
      ".....OOaOoor....",
      ".....doOoordD...",
      "....dddddddDD...",
    ],
  },
  tomato: {
    sprout: DICOT_SPROUT,
    young: [
      "......hL........",
      "...hL.LLl.hL....",
      "..hLLlLlgLLLg...",
      "..LllgLlgllgG...",
      "...gGgllgGgG....",
      ".hL..glgl..hL...",
      "..LlgglgllgLg...",
      "...gG.lgG.Gg....",
      "......mGgm......",
      ...MOUND,
    ],
    mature: [
      "...........c....",
      "....hL.....b....",
      "...hLLl.hL.b....",
      "..hLLlLlLLlbL...",
      "..LlYlgLlgLbLl..",
      ".hLuYgLlgYgbgl..",
      "..lgLhLgGuYbG...",
      ".hLlLLlLlgGbL...",
      "..lgLhlgllLbYl..",
      "...gllgGlhLbuY..",
      "..hLGgLlgLlbgG..",
      "...lgGlglgGbG...",
      "....gG.lg..b....",
      "......mGgm.bm...",
      ".....dddddDDD...",
    ],
    ripe: [
      "...........c....",
      "....hL.....b....",
      "...hLLl.hL.b....",
      "..hLLlLlLLlbL...",
      "..LlpRgLlgLbLl..",
      ".hLRRqLlgpRbgl..",
      "..lgqQLgGRqbG...",
      ".hLlLLlLlqQbL...",
      "..lgLhlgllLbpR..",
      "...gllpRlhLbqQ..",
      "..hLGRRqgLlbgG..",
      "...lgGqQlgGbG...",
      "....gG.lg..b....",
      "......mGgm.bm...",
      ".....dddddDDD...",
    ],
  },
  pumpkin: {
    sprout: DICOT_SPROUT,
    young: [
      "...hLL....hLL...",
      "..hLLlL..hLLlL..",
      "..LllgG..LllgG..",
      "...gGg.ll.gGg...",
      "......lg.l......",
      ".hLl..gl..Ll....",
      ".lgGllmGgmlgG...",
      ...MOUND,
    ],
    mature: [
      "...hLL....hLL...",
      "..hLLlL..hLLlL..",
      "..LllgG..LllgG..",
      "..lgGgYY.gGgG...",
      "....lYuYl.l.....",
      ".hLL..lYgl..hL..",
      "hLLlL.glgl.hLlL.",
      "LllgG.LhLLl.lgG.",
      ".gGg.lLLllg.Gg..",
      ".....glllgg.....",
      "....dgGGGgdD....",
      "....dddddddDD...",
    ],
    ripe: [
      "..hLL......hLL..",
      ".hLLlL....hLLlL.",
      ".LllgG.nb.LllgG.",
      "..gGg..bn..gGg..",
      "...rOaOOrOOOr...",
      "..rOaOOrOaOOor..",
      ".roaaOOoOaOOOor.",
      ".rOaOOOoOOOOoor.",
      ".roOOOoOOOOooor.",
      ".roOOOoOOOooor..",
      "..rooOoOOooorr..",
      "...rroooooorr...",
      "....DrrrrrrD....",
    ],
  },
  strawberry: {
    sprout: [
      "......hL........",
      "...hL.LLl.hL....",
      "...LLg.lg.LLg...",
      "....gl.g.lg.....",
      "......glg.......",
      "......mGgm......",
      ...MOUND,
    ],
    young: [
      "....hL..hL......",
      "...hLLl.LLl.hL..",
      "..hLLlgLLlgLLLl.",
      "..LlgGlgGglLlgG.",
      "...gG.lgl.gGgG..",
      ".hLl..glg..hLl..",
      ".lgGg.mGgm.lgGg.",
      ...MOUND,
    ],
    mature: [
      "...hL..eWe...hL.",
      "..hLLl.WYW..hLLl",
      "..LlgL.eWehLLlgG",
      ".hLLlgLlLLlLgG..",
      ".LlgGlgLlgGlg...",
      "..gGeWelgl.gG...",
      ".hLlWYWlg.hLl...",
      ".LlgLeWeg.LlgG..",
      "..gGg.mGgm.gGg..",
      ...MOUND,
    ],
    ripe: [
      "...hL........hL.",
      "..hLLl..hL..hLLl",
      "..LlgL.hLLl.LlgG",
      ".hLLlgLlLlgLLgG.",
      ".LlglgLlgGllg...",
      ".lpRqgGlgLlpRq..",
      "..RuRglpRqlRuR..",
      "..qRq.gRuR.qRq..",
      "...Q..mqRq.gQ...",
      ".....dddQdDD....",
    ],
  },
  sunflower: {
    sprout: [
      "...hLL....LLh...",
      "..hLLlLg.lLLLh..",
      "...glllglllgg...",
      ".......gl.......",
      ".......Gl.......",
      "......mGgm......",
      ...MOUND,
    ],
    young: [
      ".......hL.......",
      "......hLLl......",
      ".......lg.......",
      "..hLL..lg..LLh..",
      ".hLLlL.lg.LlLLh.",
      "..gllgglggglgg..",
      "...gG..lg..Gg...",
      ".......lg.......",
      "..hLL..lg.......",
      ".hLLlLglg..LLh..",
      "..gllgglgglLLLh.",
      "...gG..lg.gGgg..",
      "......mGgm......",
      ...MOUND,
    ],
    mature: [
      "......lLl.......",
      ".....lLYLl......",
      ".....gLYLg......",
      "......glg.......",
      ".......lg.......",
      "..hLL..lg..LLh..",
      ".hLLlL.lg.LlLLh.",
      "..gllgglggglgg..",
      "...gG..lg..Gg...",
      ".......lg.......",
      ".......lg.......",
      "..hLL..lg.......",
      ".hLLlLglg..LLh..",
      "..gllgglgglLLLh.",
      "...gG..lg.gGgg..",
      ".......lg.......",
      ".......lg..hLL..",
      "..hLL..lglLlLLh.",
      ".hLlLLglgggllg..",
      "..ggGglg..gG....",
      ".......lg.......",
      ".......lG.......",
      "......mGgm......",
      ...MOUND,
    ],
    ripe: [
      ".....uY..Yu.....",
      "...uYuYYuYYuy...",
      "..uYYybnnbyYYy..",
      ".uYYbncbbnbyYYw.",
      "..YybcbnbnbnyY..",
      ".uYybnbnbnbnyYw.",
      "..YybnbnbnnnyYw.",
      ".uYYynnnnnnyYw..",
      "..yYYyynnyYYyw..",
      "...wyYyYYyYyw...",
      "......wlgw......",
      ".......lg.......",
      ".......lg..hLL..",
      "..hLL..lglLlLLh.",
      ".hLlLLglgggllg..",
      "..ggGglg..gG....",
      ".......lg.......",
      "..hLL..lg.......",
      ".hLLlLglg..LLh..",
      "..gllgglgglLLLh.",
      "...gG..lg.gGgg..",
      ".......lg..hLL..",
      "..hLL..lglLlLLh.",
      ".hLlLLglgggllg..",
      ".......lg.......",
      ".......lG.......",
      "......mGgm......",
      ...MOUND,
    ],
  },
  blueberry: {
    sprout: [
      "......hL........",
      "...hLl.Lh.......",
      "....gl.lLLh.....",
      "......lbg.......",
      ".......b........",
      "......mbnm......",
      ...MOUND,
    ],
    young: [
      "......hLL.......",
      "....hLLlLLh.....",
      "...hLLlgLlLLl...",
      "..hLlgLLlgLlLg..",
      "..LlgLlgGlLlgG..",
      "..lgGlgLlgGlgG..",
      "...gGglgGgglG...",
      "....gGGbgGGg....",
      "......mbnm......",
      ...MOUND,
    ],
    mature: [
      ".....hLLLh......",
      "...hLLlLLLLh....",
      "..hLLlgLlLlLLl..",
      ".hLlgLLeVlgLlLg.",
      ".LlgLlgVelLlgLg.",
      ".lgGLlgGlLlgVeG.",
      ".hLlgeVlgLlgeVg.",
      ".LlgGVelgGlLlgG.",
      "..gGlgGlLgGlgG..",
      "...gGgGgGgGgG...",
      ".....gGbbGg.....",
      "......mbnm......",
      ...MOUND,
    ],
    ripe: [
      ".....hLLLh......",
      "...hLLlLLLLh....",
      "..hLLlgLlLlLLl..",
      ".hLlgLLVBlgLlLg.",
      ".LlgLlgBvlLlgLg.",
      ".lVBLlgGlLlgVBG.",
      ".hBvgVBlgLlgBvg.",
      ".LlgGBvlgVBlgGG.",
      "..gGlgGlLBvlgG..",
      "...gGgGgGgGgG...",
      ".....gGbbGg.....",
      "......mbnm......",
      ...MOUND,
    ],
  },
};

/** Seed colours per crop, so even a fresh mound hints at what's planted. */
const SEED_COLORS: Record<CropId, [string, string]> = {
  wheat: [CP.u, CP.y],
  corn: [CP.Y, CP.y],
  carrot: ["#e9c79a", "#a8784e"],
  tomato: ["#f3e0b8", "#c4a070"],
  pumpkin: [CP.W, CP.e],
  strawberry: [CP.p, CP.q],
  sunflower: ["#e8e4dc", "#3c3a40"],
  blueberry: [CP.V, CP.v],
};

/** Produce ramps (dark, mid, light, highlight) — used for harvest crates. */
export const PRODUCE: Record<CropId, [string, string, string, string]> = {
  wheat: [CP.w, CP.y, CP.Y, CP.u],
  corn: [CP.w, CP.y, CP.Y, CP.u],
  carrot: [CP.r, CP.o, CP.O, CP.a],
  tomato: [CP.Q, CP.q, CP.R, CP.p],
  pumpkin: [CP.r, CP.o, CP.O, CP.a],
  strawberry: [CP.Q, CP.q, CP.R, CP.p],
  sunflower: [CP.w, CP.y, CP.Y, CP.u],
  blueberry: [CP.x, CP.v, CP.B, CP.V],
};

const LEAVES = [CP.G, CP.g, CP.l, CP.L, CP.h];
const SOIL: string[] = [CP.D, CP.d, CP.m];

// thirst ramps — leaves pale and yellow, then brown
const THIRST_MAPS: Partial<Record<PlotState, { leaves: string[]; droop: number; produceToward?: string; produceK?: number }>> = {
  dry: { leaves: ["#2c4632", "#4b7040", "#77a046", "#a9c45a", "#d9e48a"], droop: 1 },
  parched: { leaves: ["#3b4433", "#666b3a", "#949a46", "#c2bb64", "#e6d896"], droop: 2, produceToward: "#9a7a4a", produceK: 0.2 },
  withering: { leaves: ["#3a2c22", "#62482c", "#8c6c3a", "#b4924e", "#d6b878"], droop: 3, produceToward: "#5a3a26", produceK: 0.45 },
};

const DEAD_RAMP = ["#3a2a1c", "#6a5034", "#9a7a50", "#c4a474", "#e2cc9a"];

export const MAX_CROP_H = 28;

export function cropArt(crop: CropId, stage: GrowthStage): string[] {
  return stage === "seed" ? SEED : ART[crop][stage];
}

const cache = new Map<string, Grid>();

export interface CropGridOpts {
  /** colours to use for the little soil mound (dark, mid, light) so it matches the plot soil */
  mound?: [string, string, string];
  /** 0 = rest, 1 = wind-swayed frame */
  frame?: 0 | 1;
  flip?: boolean;
}

/** A crop sprite as a Grid, condition variants applied. Cached. */
export function cropGrid(crop: CropId, stage: GrowthStage = "ripe", state: PlotState = "moist", opts: CropGridOpts = {}): Grid {
  const { mound, frame = 0, flip = false } = opts;
  const key = `${crop}|${stage}|${state}|${mound?.join() ?? ""}|${frame}|${flip ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rows = cropArt(crop, stage);
  const pal: Record<string, string> = { ...CP };
  if (stage === "seed") {
    pal.s = SEED_COLORS[crop][0];
    pal.u = mix(SEED_COLORS[crop][0], "#ffffff", 0.45);
    pal.S = SEED_COLORS[crop][1];
  }
  let g = parse(rows, pal, 16, rows.length);

  if (state === "dead") {
    g = mapColors(g, (c) => {
      if (SOIL.includes(c)) return c;
      const l = luma(c);
      return DEAD_RAMP[Math.min(4, Math.floor(l * 5.2) + 1)];
    });
    g = droop(g, stage === "seed" ? 0 : 2);
  } else if (THIRST_MAPS[state]) {
    const t = THIRST_MAPS[state]!;
    const map: Record<string, string> = {};
    LEAVES.forEach((c, i) => (map[c] = t.leaves[i]));
    g = recolor(g, map);
    if (t.produceToward)
      g = mapColors(g, (c) => (SOIL.includes(c) || t.leaves.includes(c) ? c : mix(c, t.produceToward!, t.produceK!)));
    if (stage !== "seed") g = droop(g, Math.min(t.droop, stage === "sprout" ? 1 : t.droop));
  }

  if (mound) g = recolor(g, { [CP.D]: mound[0], [CP.d]: mound[1], [CP.m]: mound[2] });
  if (frame === 1 && stage !== "seed" && state !== "dead") g = sway(g, Math.max(2, g.h - 5), g.h > 20 ? 2 : 1);
  if (flip) g = mirror(g);
  cache.set(key, g);
  return g;
}
