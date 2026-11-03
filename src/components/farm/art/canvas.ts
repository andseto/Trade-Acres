// Client-only: Grid → offscreen canvas, cached per Grid object.
import type { Grid } from "./grid";

const cache = new WeakMap<Grid, HTMLCanvasElement>();

export function gridCanvas(g: Grid): HTMLCanvasElement {
  let c = cache.get(g);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = g.w;
  c.height = g.h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(g.w, g.h);
  const d = img.data;
  for (let i = 0; i < g.px.length; i++) {
    const p = g.px[i];
    if (!p) continue;
    const n = parseInt(p.slice(1, 7), 16);
    d[i * 4] = (n >> 16) & 255;
    d[i * 4 + 1] = (n >> 8) & 255;
    d[i * 4 + 2] = n & 255;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  cache.set(g, c);
  return c;
}
