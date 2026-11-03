// Client-only farm renderer. Static layers (lawn, paths, pond bed, fences, buildings, signs) are
// painted once to an offscreen canvas; each frame blits that, then the few animated bits on top.
import type { CropId, Season } from "@/lib/types";
import type { GrowthStage, PlotState } from "@/lib/farm";
import { gridCanvas } from "../art/canvas";
import { hash } from "../art/grid";
import { GRASS, PATH, WATER, BLOSSOM, CANOPY } from "../art/palette";
import { plotGrid } from "../art/plot";
import {
  birdSprite,
  bushSprite,
  butterflySprite,
  CAN_SPOUT,
  canSprite,
  fenceCol,
  fenceRun,
  flowerSprite,
  HOUSE_H,
  HOUSE_WINDOWS,
  houseSprite,
  mailboxSprite,
  POST_H,
  rockSprite,
  scarecrowSprite,
  shedSprite,
  SIGN_W,
  signSprite,
  TREE_H,
  treeSprite,
} from "../art/props";
import type { Layout } from "./layout";

export interface ScenePlot {
  crop: CropId;
  stage: GrowthStage;
  state: PlotState;
}

export interface WaterFx {
  start: number;
  /** plot index → order in the watering queue */
  order: Map<number, number>;
  /** what each watered plot looked like before the water landed */
  pre: Map<number, ScenePlot>;
}

export const WATER_STEP = 260;
export const WATER_DURATION = 2500;

function hexToU32(hex: string): number {
  const n = parseInt(hex.slice(1, 7), 16);
  // little-endian ABGR
  return (0xff << 24) | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff);
}

type TimeOfDay = "morning" | "day" | "evening" | "night";
export function timeOfDay(h: number): TimeOfDay {
  if (h >= 5 && h < 8) return "morning";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}
const TINT: Record<TimeOfDay, string | null> = { morning: "#ffe6cc", day: null, evening: "#ffbe92", night: "#7480c4" };

const PETALS: Record<Season, string[]> = {
  spring: ["#f08ab4", "#fff6dc", "#f2c14e", "#a9bcf2"],
  summer: ["#fff6dc", "#f2c14e", "#dc4530"],
  fall: ["#f0943a", "#d0602c"],
  winter: [],
};

export class FarmRenderer {
  private ctx: CanvasRenderingContext2D;
  private base: HTMLCanvasElement;
  layout: Layout;
  plots: ScenePlot[];
  season: Season;
  tod: TimeOfDay = "day";
  water: WaterFx | null = null;

  constructor(canvas: HTMLCanvasElement, layout: Layout, plots: ScenePlot[], season: Season) {
    this.layout = layout;
    this.plots = plots;
    this.season = season;
    canvas.width = layout.W;
    canvas.height = layout.H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.base = document.createElement("canvas");
    this.buildStatic();
  }

  // ───────────── static layer ─────────────
  buildStatic() {
    const L = this.layout;
    const S = this.season;
    const { W, H } = L;
    this.base.width = W;
    this.base.height = H;
    const ctx = this.base.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const img = ctx.createImageData(W, H);
    const buf = new Uint32Array(img.data.buffer);
    const G = GRASS[S].map(hexToU32);
    const P = PATH[S].map(hexToU32);
    const set = (x: number, y: number, c: number) => {
      if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c;
    };

    // lawn: big soft-edged patches (no dithering) + little V tufts
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const v = Math.sin(x * 0.061 + y * 0.023) + Math.sin(y * 0.083 - x * 0.037 + 1.7) + Math.sin((x + y) * 0.019);
        let k = v > 1.25 ? 3 : v < -1.45 ? 1 : 2;
        const r = hash(x, y, 1);
        if (r < 0.025 && k > 1) k -= 1;
        set(x, y, G[k]);
      }
    for (let i = 0; i < (W * H) / 70; i++) {
      const x = Math.floor(hash(i, 1, 2) * W);
      const y = Math.floor(hash(i, 2, 2) * H);
      if (S === "winter") {
        if (hash(i, 3, 2) < 0.15) {
          // grass poking through snow
          set(x, y, hexToU32("#5e8a5a"));
          set(x + 2, y, hexToU32("#5e8a5a"));
          set(x + 1, y + 1, hexToU32("#3e6a4a"));
        } else set(x, y, G[1]);
        continue;
      }
      set(x, y, G[4]);
      set(x + 2, y, G[3]);
      set(x + 1, y + 1, G[1]);
    }

    // tree shadows (cast down-right, like the light)
    const shadow = (cx: number, cy: number, rx: number, ry: number) => {
      for (let y = -ry; y <= ry; y++)
        for (let x = -rx; x <= rx; x++)
          if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
            const px = cx + x;
            const py = cy + y;
            if (px >= 0 && py >= 0 && px < W && py < H) buf[py * W + px] = S === "winter" ? G[1] : G[0];
          }
    };
    for (const t of L.frontTrees) shadow(t.x + 20, t.y + TREE_H - 3, 12, 3);
    for (const b of L.bushes) shadow(b.x + 10, b.y + 12, 8, 2);

    // dirt paths with ragged edges and pebbles
    for (const p of L.paths)
      for (let y = p.y; y < p.y + p.h; y++)
        for (let x = p.x; x < p.x + p.w; x++) {
          const edge = x === p.x || x === p.x + p.w - 1 || y === p.y || y === p.y + p.h - 1;
          if (edge && hash(x, y, 4) < 0.45) continue;
          const r = hash(x, y, 5);
          set(x, y, r < 0.06 ? P[3] : r < 0.14 ? P[0] : edge ? P[1] : P[2]);
        }

    // pond
    if (L.pond) this.paintPond(set);

    ctx.putImageData(img, 0, 0);

    // flowers / fallen leaves scattered on the lawn
    const petals = PETALS[S];
    if (petals.length)
      for (let i = 0; i < (W * H) / (S === "spring" ? 900 : 1600); i++) {
        const x = Math.floor(hash(i, 7, 8) * W);
        const y = Math.floor(hash(i, 8, 8) * H);
        if (L.paths.some((p) => x > p.x - 3 && x < p.x + p.w && y > p.y - 3 && y < p.y + p.h)) continue;
        const f = flowerSprite(i % 3, petals[i % petals.length]);
        ctx.drawImage(gridCanvas(f), x, y);
      }

    const draw = (g: Parameters<typeof gridCanvas>[0], x: number, y: number) => ctx.drawImage(gridCanvas(g), x, y);

    for (const t of L.backTrees) draw(treeSprite(S, t.v, 0), t.x, t.y);

    // fences: top run (with a gate gap), sides, bottom
    const f = L.field;
    const top = f.y - POST_H + 2;
    const gL = L.gate.x - f.x;
    if (gL > 4) draw(fenceRun(gL, S), f.x, top);
    const gR = f.x + f.w - (L.gate.x + L.gate.w);
    if (gR > 4) draw(fenceRun(gR, S), L.gate.x + L.gate.w, top);
    if (gL <= 4 && gR <= 4) draw(fenceRun(f.w, S), f.x, top);

    draw(houseSprite(S), L.house.x, L.house.y);
    if (L.shed) draw(shedSprite(S), L.shed.x, L.shed.y);
    draw(mailboxSprite(), L.mailbox.x, L.mailbox.y);

    for (const r of L.rocks) draw(rockSprite(r.v, S), r.x, r.y);
    for (const b of L.bushes) draw(bushSprite(S, b.v), b.x, b.y);

    // plot signs
    L.cells.forEach((c, i) => {
      if (i < this.plots.length) draw(signSprite(SIGN_W, S), c.x + 8, c.y + 55);
    });
    if (this.plots.length === 0) {
      // the "plant your first plot" sign stands in the middle of the empty field
      draw(signSprite(56, S), Math.floor(f.x + f.w / 2 - 28), f.y + 30);
    }
    const sc = scarecrowSprite(S);
    draw(sc, L.scarecrow.x, L.scarecrow.y);

    // side columns run from the top rail down to the bottom of the corner posts
    draw(fenceCol(f.h, S), f.x, top);
    draw(fenceCol(f.h, S), f.x + f.w - 3, top);
    draw(fenceRun(f.w, S), f.x, f.y + f.h - POST_H + 2);
  }

  private paintPond(set: (x: number, y: number, c: number) => void) {
    const p = this.layout.pond!;
    const S = this.season;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const rx = p.w / 2;
    const ry = p.h / 2;
    const C = {
      rim: hexToU32(GRASS[S][0]),
      bank: hexToU32(PATH[S][1]),
      bankHi: hexToU32(PATH[S][2]),
      deep: hexToU32(S === "winter" ? WATER.iceLine : WATER.deep),
      mid: hexToU32(S === "winter" ? WATER.ice : WATER.mid),
      light: hexToU32(S === "winter" ? WATER.iceHi : WATER.light),
      hi: hexToU32(WATER.hi),
    };
    for (let y = p.y; y < p.y + p.h; y++)
      for (let x = p.x; x < p.x + p.w; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        // wobble the shoreline a little so it isn't a perfect ellipse
        const d = Math.sqrt(nx * nx + ny * ny) + (hash(Math.floor(Math.atan2(ny, nx) * 6), 1, 31) - 0.5) * 0.08;
        if (d > 1) continue;
        let c: number;
        if (d > 0.9) c = C.rim;
        else if (d > 0.8) c = ny < 0 ? C.bank : C.bankHi;
        else if (ny < -0.45 && d > 0.55) c = C.deep; // bank shadow on the far side
        else if (d < 0.45) c = S === "winter" ? C.light : C.deep;
        else c = d < 0.65 ? C.mid : C.light;
        if (S !== "winter" && d < 0.78 && d > 0.7 && ny > 0.2) c = C.hi;
        set(x, y, c);
      }
    if (S === "winter") {
      // cracks in the ice
      let x = Math.floor(cx - 10);
      let y = Math.floor(cy - 2);
      for (let i = 0; i < 14; i++) {
        set(x, y, C.deep);
        x += 1;
        if (hash(i, 2, 33) < 0.4) y += hash(i, 3, 33) < 0.5 ? -1 : 1;
      }
      return;
    }
    // lily pads + cattails
    const pad = hexToU32("#357a3e");
    const padHi = hexToU32("#72b84a");
    const pads = [
      [cx - rx * 0.45, cy + 2],
      [cx + rx * 0.3, cy - 3],
    ];
    for (const [px, py] of pads)
      for (let y = -2; y <= 1; y++)
        for (let x = -3; x <= 3; x++)
          if (x * x / 9 + (y * y) / 4 <= 1 && !(x === 1 && y === -2) && !(x === 0 && y === -2)) set(Math.floor(px + x), Math.floor(py + y), y === -2 || x === -3 ? padHi : pad);
    if (S === "spring" || S === "summer") {
      const f = Math.floor(cx + rx * 0.3);
      set(f, Math.floor(cy - 4), hexToU32("#f08ab4"));
      set(f + 1, Math.floor(cy - 4), hexToU32("#fff6dc"));
    }
    const stem = hexToU32("#2e6b40");
    const tail = hexToU32("#6a3e22");
    for (const [ox, h] of [
      [p.x + 4, 8],
      [p.x + 7, 10],
      [p.x + 9, 7],
    ]) {
      for (let y = 0; y < h; y++) set(ox, p.y + p.h - 4 - y, y > h - 4 ? tail : stem);
    }
  }

  setTimeOfDay(hour: number) {
    this.tod = timeOfDay(hour);
  }

  // ───────────── per-frame ─────────────
  render(t: number) {
    const { ctx, layout: L, season: S } = this;
    ctx.drawImage(this.base, 0, 0);
    const wave = (x: number) => {
      const ph = ((t / 1000) * 0.5 - x / 260) % 1.4;
      return ((ph + 1.4) % 1.4) < 0.3 ? 1 : 0;
    };

    // pond ripples + glints
    if (L.pond && S !== "winter") {
      const p = L.pond;
      ctx.fillStyle = WATER.hi;
      for (let i = 0; i < 3; i++) {
        const period = 2600;
        const age = (t + i * 870) % period;
        const rx = Math.floor((age / period) * 6) + 1;
        const cx = Math.floor(p.x + p.w * (0.3 + hash(i, Math.floor((t + i * 870) / period), 5) * 0.4));
        const cy = Math.floor(p.y + p.h * 0.5 + (i - 1) * 3);
        if (rx > 5) continue;
        ctx.fillRect(cx - rx, cy, 1, 1);
        ctx.fillRect(cx + rx, cy, 1, 1);
        ctx.fillRect(cx - rx + 1, cy - 1, rx * 2 - 1, 1);
        ctx.fillRect(cx - rx + 1, cy + 1, rx * 2 - 1, 1);
      }
      if (Math.floor(t / 400) % 3 === 0) {
        ctx.fillStyle = WATER.foam;
        ctx.fillRect(p.x + Math.floor(p.w * 0.62), p.y + Math.floor(p.h * 0.4), 2, 1);
      }
    }

    // plots
    const grass = GRASS[S];
    this.plots.forEach((pl, i) => {
      const c = L.cells[i];
      if (!c) return;
      let shown = pl;
      if (this.water?.order.has(i)) {
        const local = t - this.water.start - this.water.order.get(i)! * WATER_STEP;
        if (local < 1300) shown = this.water.pre.get(i) ?? pl;
      }
      const g = plotGrid(shown.crop, shown.stage, shown.state, { border: false, frame: wave(c.x) as 0 | 1, grass });
      ctx.drawImage(gridCanvas(g), c.x, c.y);
    });

    // trees in front
    for (const tr of L.frontTrees) ctx.drawImage(gridCanvas(treeSprite(S, tr.v, wave(tr.x) as 0 | 1)), tr.x, tr.y);

    if (this.water) this.drawWater(t);

    const night = this.tod === "night";

    // critters
    if ((S === "spring" || S === "summer") && !night) {
      const colors = ["#fff6dc", "#f2c14e", "#a9bcf2"];
      for (let i = 0; i < 3; i++) {
        const sp = 0.00006 + i * 0.000015;
        const x = Math.floor(((t * sp * L.W + i * 140) % (L.W + 40)) - 20);
        const y = Math.floor(L.H * (0.25 + 0.25 * i) + Math.sin(t / 700 + i) * 10 + Math.sin(t / 230 + i * 2) * 2);
        ctx.drawImage(gridCanvas(butterflySprite(colors[i], Math.floor(t / 140 + i) % 2 ? 1 : 0)), x, y);
      }
    }
    if (!night) {
      // a pair of birds crosses every ~14s
      const cyc = t % 14000;
      if (cyc < 5000) {
        const k = cyc / 5000;
        for (let i = 0; i < 2; i++) {
          const x = Math.floor(-20 + k * (L.W + 40) - i * 11);
          const y = Math.floor(18 + i * 6 + k * 30 + Math.sin(t / 300 + i) * 2);
          ctx.drawImage(gridCanvas(birdSprite(Math.floor(t / 180 + i) % 2 ? 1 : 0)), x, y);
        }
      }
    }

    // weather particles
    this.particles(t);

    // drifting cloud shadows
    if (!night && S !== "winter") {
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = "#14203a";
      for (let i = 0; i < 2; i++) {
        const span = L.W + 160;
        const x = Math.floor(((t * 0.006 + i * span * 0.55) % span) - 80);
        const y = Math.floor(L.H * (0.2 + i * 0.45));
        ctx.fillRect(x + 10, y, 40, 4);
        ctx.fillRect(x + 4, y + 4, 58, 8);
        ctx.fillRect(x, y + 12, 70, 6);
        ctx.fillRect(x + 8, y + 18, 46, 4);
      }
      ctx.globalAlpha = 1;
    }

    // time-of-day tint
    const tint = TINT[this.tod];
    if (tint) {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, L.W, L.H);
      ctx.globalCompositeOperation = "source-over";
    }
    if (night || this.tod === "evening") {
      // lit windows + a warm square of light under each
      for (const w of HOUSE_WINDOWS) {
        const x = L.house.x + w.x;
        const y = L.house.y + w.y;
        ctx.fillStyle = "#ffd36a";
        ctx.fillRect(x, y, w.w, w.h);
        ctx.fillStyle = "#fff2b8";
        ctx.fillRect(x, y, 2, 1);
        if (night) {
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = "#ffd36a";
          ctx.fillRect(x - 2, L.house.y + HOUSE_H - 1, w.w + 4, 4);
          ctx.globalAlpha = 1;
        }
      }
      if (night && S === "summer") {
        ctx.fillStyle = "#e8f87a";
        for (let i = 0; i < 8; i++) {
          if (Math.floor(t / 300 + i * 3) % 4 === 0) continue;
          const x = Math.floor(hash(i, 1, 99) * L.W + Math.sin(t / 900 + i) * 8);
          const y = Math.floor(hash(i, 2, 99) * L.H + Math.cos(t / 1100 + i) * 6);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private particles(t: number) {
    const { ctx, layout: L, season: S } = this;
    if (S === "winter") {
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 40; i++) {
        const sp = 0.012 + hash(i, 1, 71) * 0.01;
        const y = Math.floor((hash(i, 2, 71) * L.H + t * sp) % L.H);
        const x = Math.floor((hash(i, 3, 71) * L.W + Math.sin(t / 900 + i) * 4 + t * 0.003) % L.W);
        ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
      }
    } else if (S === "fall" || S === "spring") {
      const cols = S === "fall" ? [CANOPY.fall[2], CANOPY.fall[3], CANOPY.fall[1]] : [BLOSSOM[1], BLOSSOM[2]];
      for (let i = 0; i < 10; i++) {
        const sp = 0.008 + hash(i, 1, 72) * 0.006;
        const y = Math.floor((hash(i, 2, 72) * L.H + t * sp) % L.H);
        const x = Math.floor((hash(i, 3, 72) * L.W + Math.sin(t / 600 + i) * 6 + t * 0.006) % L.W);
        ctx.fillStyle = cols[i % cols.length];
        const flip = Math.floor(t / 250 + i) % 2;
        ctx.fillRect(x, y, flip ? 2 : 1, 1);
        if (!flip) ctx.fillRect(x + 1, y + 1, 1, 1);
      }
    }
  }

  private drawWater(t: number) {
    const { ctx, layout: L } = this;
    const w = this.water!;
    let done = true;
    for (const [i, order] of w.order) {
      const c = L.cells[i];
      if (!c) continue;
      const local = t - w.start - order * WATER_STEP;
      if (local < WATER_DURATION) done = false;
      if (local < 0 || local > WATER_DURATION) continue;
      // can flies in, tilts and pours, flies off
      const enter = Math.min(1, local / 450);
      const leave = local > 2000 ? (local - 2000) / 400 : 0;
      const cx = c.x + 8;
      const cy = c.y + 6 - Math.round((1 - enter) * 18) - Math.round(leave * 22);
      const pouring = local > 500 && local < 2000;
      const tilt = pouring ? 2 : local > 400 && local < 2100 ? 1 : 0;
      if (local < 2400) ctx.drawImage(gridCanvas(canSprite(tilt as 0 | 1 | 2)), cx, cy);
      if (pouring) {
        const sx = cx + CAN_SPOUT[2].x;
        const sy = cy + CAN_SPOUT[2].y + 1;
        for (let k = 0; k < 24; k++) {
          const spawn = 520 + k * 55;
          const age = local - spawn;
          if (age < 0 || age > 420 || spawn > 1950) continue;
          const dx = Math.floor(hash(k, 1, 81) * 7) - 1 + Math.floor(age * 0.006);
          const dy = Math.floor(age * 0.075);
          const x = sx + dx;
          const y = sy + dy;
          if (y > c.y + 44) {
            // splash
            ctx.fillStyle = WATER.foam;
            ctx.fillRect(x - 1, c.y + 44, 1, 1);
            ctx.fillRect(x + 1, c.y + 44, 1, 1);
            continue;
          }
          ctx.fillStyle = WATER.light;
          ctx.fillRect(x, y, 1, 2);
          ctx.fillStyle = WATER.foam;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // growth sparkles once the water lands
      if (local > 1300 && local < 2400) {
        const k = local - 1300;
        const spots = [
          [c.x + 10, c.y + 16],
          [c.x + 44, c.y + 22],
          [c.x + 26, c.y + 10],
          [c.x + 36, c.y + 40],
          [c.x + 14, c.y + 36],
        ];
        spots.forEach(([x, y], j) => {
          const phase = (k + j * 140) % 520;
          if (phase > 360) return;
          const big = phase > 120 && phase < 240;
          ctx.fillStyle = "#fff4c0";
          ctx.fillRect(x, y - Math.floor(k / 120), 1, 1);
          if (big) {
            ctx.fillStyle = "#f6c94a";
            ctx.fillRect(x - 1, y - Math.floor(k / 120), 1, 1);
            ctx.fillRect(x + 1, y - Math.floor(k / 120), 1, 1);
            ctx.fillRect(x, y - 1 - Math.floor(k / 120), 1, 1);
            ctx.fillRect(x, y + 1 - Math.floor(k / 120), 1, 1);
          }
        });
      }
    }
    if (done) this.water = null;
  }

  get watering(): boolean {
    return this.water !== null;
  }
}

