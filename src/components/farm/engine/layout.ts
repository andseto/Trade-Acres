// Pure scene layout in art pixels. The canvas is drawn at art resolution and scaled up by an integer.
import { hash } from "../art/grid";
import { BUSH_H, BUSH_W, HOUSE_DOOR_X, HOUSE_H, HOUSE_W, POST_H, SHED_H, SHED_W, TREE_H, TREE_W } from "../art/props";

export const CELL_W = 64;
export const CELL_H = 72;
const FIELD_PAD = 8;
const YARD_H = 70;
/** grass between the buildings' front walls and the fence's top posts (path, mailbox) */
const YARD_GAP = 26;
const BOTTOM_H = 34;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Placed {
  x: number;
  y: number;
  v: number;
}

export interface Layout {
  scale: number;
  W: number;
  H: number;
  cols: number;
  rows: number;
  /** origin of each 56×56 plot box */
  cells: { x: number; y: number }[];
  field: Rect;
  gate: { x: number; w: number };
  house: { x: number; y: number };
  shed: { x: number; y: number } | null;
  pond: Rect | null;
  mailbox: { x: number; y: number };
  scarecrow: { x: number; y: number };
  paths: Rect[];
  backTrees: Placed[];
  frontTrees: Placed[];
  bushes: Placed[];
  rocks: Placed[];
}

export function pickScale(cssW: number): number {
  if (cssW < 560) return 2;
  if (cssW < 1700) return 3;
  return 4;
}

export interface LayoutOpts {
  /** force a scale (MiniFarm picks one to fit its height) */
  scale?: number;
  /** grow the scene to at least this many art px tall */
  minH?: number;
  /** cap columns (MiniFarm keeps its field compact) */
  maxCols?: number;
  /** trim the lawn below the field (hero banners) */
  compact?: boolean;
}

export function computeLayout(cssW: number, n: number, opts: LayoutOpts = {}): Layout {
  const scale = opts.scale ?? pickScale(cssW);
  const W = Math.max(150, Math.floor(cssW / scale));
  const cellsNeeded = n === 0 ? 3 : n + 1; // +1 for the scarecrow's patch
  const fit = Math.max(1, Math.min(opts.maxCols ?? 8, Math.floor((W - 2 * FIELD_PAD - 12) / CELL_W)));
  const rows = Math.ceil(cellsNeeded / fit);
  const cols = n === 0 ? Math.min(fit, 3) : Math.min(fit, Math.ceil(cellsNeeded / rows));

  const fw = cols * CELL_W + FIELD_PAD * 2;
  const fx = Math.floor((W - fw) / 2);
  const fy = YARD_H + YARD_GAP;
  const fh = rows * CELL_H + 16;
  const field = { x: fx, y: fy, w: fw, h: fh };
  const bottomH = opts.compact ? 12 : BOTTOM_H;
  let H = fy + fh + bottomH;
  if (opts.minH && H < opts.minH) H = opts.minH;

  const cells: { x: number; y: number }[] = [];
  for (let i = 0; i < rows * cols; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    cells.push({ x: fx + FIELD_PAD + c * CELL_W + 4, y: fy + 14 + r * CELL_H });
  }

  // yard: house on the left, shed beside it, pond on the right when there's room
  const house = { x: Math.max(4, fx + 2), y: YARD_H - HOUSE_H + 2 };
  let cursor = house.x + HOUSE_W + 6;
  const shed = W - cursor >= SHED_W + 6 ? { x: cursor, y: YARD_H - SHED_H + 1 } : null;
  if (shed) cursor = shed.x + SHED_W + 6;
  const pondW = W >= 320 ? 58 : 44;
  const pond = W - 8 - cursor >= pondW + 16 ? { x: W - pondW - 10, y: 24, w: pondW, h: 28 } : null;

  const doorX = house.x + HOUSE_DOOR_X;
  const gate = { x: doorX - 8, w: 16 };
  // the yard lane runs just below the buildings, clear of the fence
  const laneY = house.y + HOUSE_H + 3;
  const paths: Rect[] = [
    // door → gate
    { x: doorX - 5, y: house.y + HOUSE_H - 2, w: 10, h: fy - (house.y + HOUSE_H) + 6 },
    // a lane running along the top of the field
    { x: fx, y: fy - 6, w: fw, h: 7 },
  ];
  if (shed) paths.push({ x: doorX, y: laneY, w: shed.x + 19 - doorX, h: 5 }, { x: shed.x + 14, y: shed.y + SHED_H - 2, w: 10, h: laneY + 5 - (shed.y + SHED_H - 2) });

  // mailbox stands on the grass beside the door path, in front of the house
  const mailbox = { x: doorX - 20, y: house.y + HOUSE_H + 1 };

  // scarecrow in the first free cell, else just outside the fence
  const scarecrow = n > 0 && n < cells.length ? { x: cells[n].x + 20, y: cells[n].y + 22 } : { x: fx + fw - 8 - 15, y: fy + fh + 2 };
  if (n === 0) {
    scarecrow.x = cells[cols - 1].x + 30;
    scarecrow.y = cells[0].y + 20;
  }

  const solid: Rect[] = [
    { x: house.x - 2, y: 0, w: HOUSE_W + 4, h: YARD_H },
    ...(shed ? [{ x: shed.x - 2, y: 0, w: SHED_W + 4, h: YARD_H }] : []),
    ...(pond ? [{ x: pond.x - 4, y: pond.y - 4, w: pond.w + 8, h: pond.h + 8 }] : []),
    { x: fx - 2, y: fy - POST_H - 2, w: fw + 4, h: fh + POST_H + 2 },
    { x: mailbox.x - 1, y: mailbox.y - 1, w: 11, h: 13 },
    ...paths,
  ];
  const free = (r: Rect) => !solid.some((s) => r.x < s.x + s.w && r.x + r.w > s.x && r.y < s.y + s.h && r.y + r.h > s.y);

  // back row of trees peeking over the top edge, behind the buildings
  const backTrees: Placed[] = [];
  for (let x = -14, i = 0; x < W - 4; x += 15 + Math.floor(hash(i, 1, 77) * 8), i++) {
    backTrees.push({ x, y: -14 - Math.floor(hash(i, 2, 77) * 7), v: Math.floor(hash(i, 3, 77) * 3) });
  }
  // trees beside the field and in the yard gaps
  const frontTrees: Placed[] = [];
  const tryTree = (x: number, y: number, v: number) => {
    const r = { x: x + 6, y: y + 18, w: TREE_W - 12, h: TREE_H - 18 };
    if (r.x < -6 || r.x + r.w > W + 6 || !free(r)) return false;
    frontTrees.push({ x, y, v });
    solid.push(r);
    return true;
  };
  tryTree(cursor + 2, YARD_H - TREE_H - 2, 1);
  for (let y = fy - 10, i = 0; y < H - 20; y += 46, i++) {
    tryTree(fx - TREE_W + 2 - (i % 2) * 4, y + (i % 2) * 8, i);
    tryTree(fx + fw - 2 + (i % 2) * 4, y + 22, i + 1);
    // further out, a loose orchard fills wide screens
    for (let k = 1; k < 12; k++) {
      const off = k * 40 + Math.floor(hash(i, k, 19) * 12);
      if (fx - TREE_W - off < -TREE_W && fx + fw + off > W) break;
      if (hash(i, k, 21) < 0.45) continue;
      tryTree(fx - TREE_W + 2 - off, y + 4 + (k % 2) * 18, i + k);
      tryTree(fx + fw - 2 + off, y + 14 + (k % 2) * 18, i + k + 1);
    }
  }
  for (let x = 4, i = 0; x < W - 20; x += 64 + Math.floor(hash(i, 6, 7) * 40), i++) {
    const tx = x + Math.floor(hash(i, 5, 7) * 10);
    const ty = fy + fh + bottomH - TREE_H + 10 + (i % 2) * 6;
    // never let a canopy cover the bottom fence (short hero layouts have little lawn below it)
    if (tx + TREE_W > fx - 2 && tx < fx + fw + 2 && ty < fy + fh + 6) continue;
    tryTree(tx, ty, i);
  }

  const bushes: Placed[] = [];
  const rocks: Placed[] = [];
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(hash(i, 1, 303) * (W - 18));
    const y = Math.floor(hash(i, 2, 303) * (H - 14));
    const r = { x, y, w: 18, h: 13 };
    if (!free(r)) continue;
    if (i % 3 === 0) {
      rocks.push({ x, y: y + 6, v: i });
      solid.push({ x, y: y + 6, w: 10, h: 6 });
    } else if (bushes.length < 8) {
      bushes.push({ x, y, v: i });
      solid.push(r);
    }
  }
  // bushes tucked against the outside of the bottom fence corners (never on the posts)
  bushes.push({ x: fx - BUSH_W - 3, y: fy + fh - BUSH_H, v: 1 }, { x: fx + fw + 3, y: fy + fh - BUSH_H, v: 2 });

  return { scale, W, H, cols, rows, cells, field, gate, house, shed, pond, mailbox, scarecrow, paths, backTrees, frontTrees, bushes, rocks };
}
