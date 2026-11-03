// Tiny pixel-art toolkit. Sprites are authored as rows of characters + a palette, turned into a
// Grid (flat array of hex colours, null = transparent), and then either emitted as compact SVG
// paths (one <path> per colour, runs merged per row) or painted to a canvas (see ./canvas.ts).
// Everything here is pure and isomorphic — safe in server components.

export type Px = string | null;

export interface Grid {
  w: number;
  h: number;
  px: Px[];
}

export type Palette = Record<string, string>;

export function makeGrid(w: number, h: number): Grid {
  return { w, h, px: new Array<Px>(w * h).fill(null) };
}

export function clone(g: Grid): Grid {
  return { w: g.w, h: g.h, px: g.px.slice() };
}

export function at(g: Grid, x: number, y: number): Px {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return null;
  return g.px[y * g.w + x];
}

export function put(g: Grid, x: number, y: number, c: Px) {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return;
  g.px[y * g.w + x] = c;
}

export function rect(g: Grid, x: number, y: number, w: number, h: number, c: Px) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c);
}

/**
 * Parse a sprite drawn as strings. '.' and ' ' are transparent; every other char is looked up in
 * the palette. If w/h are larger than the art, the art is centred horizontally and bottom-aligned.
 */
export function parse(rows: string[], pal: Palette, w?: number, h?: number): Grid {
  const aw = Math.max(...rows.map((r) => r.length));
  const ah = rows.length;
  const W = w ?? aw;
  const H = h ?? ah;
  const ox = Math.floor((W - aw) / 2);
  const oy = H - ah;
  const g = makeGrid(W, H);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const c = pal[ch];
      if (c === undefined) throw new Error(`pixel art: no palette entry for "${ch}"`);
      put(g, x + ox, y + oy, c);
    }
  });
  return g;
}

/** Paint src onto dst at (x, y); transparent pixels are skipped. */
export function blit(dst: Grid, src: Grid, x: number, y: number, flip = false) {
  for (let j = 0; j < src.h; j++)
    for (let i = 0; i < src.w; i++) {
      const c = src.px[j * src.w + (flip ? src.w - 1 - i : i)];
      if (c) put(dst, x + i, y + j, c);
    }
}

export function mirror(g: Grid): Grid {
  const out = makeGrid(g.w, g.h);
  blit(out, g, 0, 0, true);
  return out;
}

/** Swap colours (hex → hex). Unlisted colours are kept. */
export function recolor(g: Grid, map: Record<string, string>): Grid {
  return { w: g.w, h: g.h, px: g.px.map((c) => (c && map[c] !== undefined ? map[c] : c)) };
}

export function mapColors(g: Grid, fn: (c: string) => string): Grid {
  return { w: g.w, h: g.h, px: g.px.map((c) => (c ? fn(c) : c)) };
}

/**
 * Wind sway: shift every row above `pivot` sideways. Rows near the top move by `amount`, rows just
 * above the pivot by 1 — a hand-animator's 1px row offset, no rotation, no smoothing.
 */
export function sway(g: Grid, pivot: number, amount = 1): Grid {
  const out = makeGrid(g.w, g.h);
  for (let y = 0; y < g.h; y++) {
    const dx = y >= pivot ? 0 : y < pivot / 2 && amount > 1 ? amount : Math.sign(amount);
    for (let x = 0; x < g.w; x++) {
      const c = g.px[y * g.w + x];
      if (c) put(out, x + dx, y, c);
    }
  }
  return out;
}

/**
 * Droop: pixels sag downward the further they are from the stalk (column cx) and the higher they
 * sit. Makes thirsty leaves hang. Bottom `keep` rows stay put so the plant stays rooted.
 */
export function droop(g: Grid, amount: number, keep = 3): Grid {
  if (amount <= 0) return g;
  const out = makeGrid(g.w, g.h);
  const cx = (g.w - 1) / 2;
  const half = g.w / 2;
  // paint from bottom to top so upper (drooping) pixels land over lower ones
  for (let y = g.h - 1; y >= 0; y--) {
    for (let x = 0; x < g.w; x++) {
      const c = g.px[y * g.w + x];
      if (!c) continue;
      if (y >= g.h - keep) {
        put(out, x, y, c);
        continue;
      }
      const d = Math.abs(x - cx) / half; // 0 at stalk → 1 at edge
      const heightK = 1 - y / g.h; // higher pixels sag more
      const dy = Math.round(amount * (0.35 + d) * (0.5 + heightK));
      const ty = Math.min(g.h - keep - 1, y + dy);
      // leaves also tuck in a touch toward the stalk
      const dx = d > 0.6 && amount >= 2 ? (x < cx ? 1 : -1) : 0;
      put(out, x + dx, ty, c);
    }
  }
  return out;
}

/** Crop the grid to a sub-rectangle (outside → transparent). */
export function sub(g: Grid, x: number, y: number, w: number, h: number): Grid {
  const out = makeGrid(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(out, i, j, at(g, x + i, y + j));
  return out;
}

/** Paint a snow cap: the first `depth` opaque pixels from the top in each column that match `on`. */
export function snowcap(g: Grid, on: (c: string) => boolean, depth = 2, light = "#f4f8ff", shade = "#c4d0ea"): Grid {
  const out = clone(g);
  for (let x = 0; x < g.w; x++) {
    let painted = 0;
    for (let y = 0; y < g.h && painted < depth; y++) {
      const c = at(g, x, y);
      if (!c) {
        if (painted > 0) break;
        continue;
      }
      if (!on(c)) {
        if (painted > 0) break;
        // stop at the first non-matching opaque pixel unless it's just an outline we can cover
        break;
      }
      put(out, x, y, painted === depth - 1 && depth > 1 ? shade : light);
      painted++;
    }
  }
  return out;
}

/** Deterministic hash → [0, 1). Used for hand-placed-looking variation that's stable across renders. */
export function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** SVG inner markup: one <path> per colour; horizontal runs of the same colour merged per row. */
export function toSvgPaths(g: Grid, ox = 0, oy = 0): string {
  const byColor = new Map<string, string[]>();
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const c = g.px[y * g.w + x];
      if (!c) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < g.w && g.px[y * g.w + x + run] === c) run++;
      let arr = byColor.get(c);
      if (!arr) byColor.set(c, (arr = []));
      arr.push(`M${x + ox} ${y + oy}h${run}v1h-${run}z`);
      x += run;
    }
  }
  let out = "";
  for (const [c, d] of byColor) out += `<path fill="${c}" d="${d.join("")}"/>`;
  return out;
}

/** Parse "#rrggbb" → [r,g,b]. */
export function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luma(hex: string): number {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
