// Tiny hand-drawn pixel art for the marketing + auth pages.
// Each piece is a grid of characters; every character maps to a palette colour ("." = transparent).
// Rendered as SVG rects with crisp edges, so it stays sharp at any integer scale.

import type { CSSProperties } from "react";

export type Palette = Record<string, string>;
export interface PixelPiece {
  art: string[];
  palette: Palette;
}

/** Merge horizontal runs of the same colour into single rects. */
function toRects(art: string[], palette: Palette) {
  const rects: { x: number; y: number; w: number; c: string }[] = [];
  art.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const c = palette[ch];
      if (!c) {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w++;
      rects.push({ x, y, w, c });
      x += w;
    }
  });
  return rects;
}

function dims(art: string[]) {
  return { w: Math.max(...art.map((r) => r.length)), h: art.length };
}

export function PixelArt({
  piece,
  scale = 3,
  className,
  style,
  title,
}: {
  piece: PixelPiece;
  /** CSS px per art pixel */
  scale?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const { w, h } = dims(piece.art);
  return (
    <svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {toRects(piece.art, piece.palette).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  );
}

/** A piece as a CSS background url — for tiling strips (fences, grass, hills). */
export function pieceToDataUri(piece: PixelPiece): string {
  const { w, h } = dims(piece.art);
  const body = toRects(piece.art, piece.palette)
    .map((r) => `<rect x='${r.x}' y='${r.y}' width='${r.w}' height='1' fill='${r.c}'/>`)
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'>${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function pieceSize(piece: PixelPiece, scale: number) {
  const { w, h } = dims(piece.art);
  return { width: w * scale, height: h * scale };
}

/** A horizontally repeating strip made from one tile. */
export function PixelStrip({
  piece,
  scale = 3,
  className,
  style,
}: {
  piece: PixelPiece;
  scale?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { width, height } = pieceSize(piece, scale);
  return (
    <div
      aria-hidden
      className={className}
      style={{
        height,
        backgroundImage: pieceToDataUri(piece),
        backgroundRepeat: "repeat-x",
        backgroundSize: `${width}px ${height}px`,
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}

// ───────────────────────────── palette ─────────────────────────────

const O = "#140c06"; // outline

// ───────────────────────────── icons ─────────────────────────────

export const WATERING_CAN: PixelPiece = {
  art: [
    "........oooo....",
    ".......o....o...",
    "oo.....o....o...",
    "olo..oooooooooo.",
    ".obo.oLLLLLLLLo.",
    "..obooBBBBBBBBo.",
    "...obbBBBBBBBBo.",
    "....obBBBBBBBBo.",
    ".....oBBBBBBBBo.",
    ".....oDDDDDDDDo.",
    "......oooooooo..",
  ],
  palette: { o: O, l: "#c9e6f2", b: "#6f9fc0", L: "#a8cfe0", B: "#6f9fc0", D: "#4a6f8c", w: "#7ec8e3" },
};

export const JOURNAL: PixelPiece = {
  art: [
    "..oooooooooo",
    ".oRRRRRRRRRo",
    ".oRrrrrrrrRo",
    ".oRrCCCCCrRo",
    ".oRrrrrrrrRo",
    ".oRrCCCCrrRo",
    ".oRrrrrrrrRo",
    ".oRRRRRRRRRo",
    ".oPPPPPPPPPo",
    ".oRRRRRRGRRo",
    "..ooooooGooo",
    "........G...",
  ],
  palette: { o: O, R: "#8e3a26", r: "#b4533a", C: "#f6e7c1", P: "#f3e3bb", G: "#8cc84b" },
};

export const CALENDAR: PixelPiece = {
  art: [
    "...o....o...",
    ".oooooooooo.",
    ".oRRRRRRRRo.",
    ".oRRRRRRRRo.",
    ".oooooooooo.",
    ".oPgPlPgPPo.",
    ".oPPPPPPPPo.",
    ".oPlPgPgPgo.",
    ".oPPPPPPPPo.",
    ".oPgPPPlPPo.",
    ".oooooooooo.",
  ],
  palette: { o: O, R: "#c2593f", P: "#f3e3bb", g: "#5e9a2a", l: "#e8604c" },
};

export const CHART: PixelPiece = {
  art: [
    "..........oooo",
    "..........oGGo",
    ".....oooo.oGGo",
    ".....oGGo.oGGo",
    ".....oGGo.oGGo",
    "oooo.oGGo.oGGo",
    "oLLo.oGGo.oGGo",
    "oLLo.oGGo.oGGo",
    "oooooooooooooo",
  ],
  palette: { o: O, G: "#8cc84b", L: "#e8604c" },
};

export const SIGNPOST: PixelPiece = {
  art: [
    ".....oo.....",
    "oooooooooo..",
    "oWWWWWWWWWo.",
    "oWLLLLLLLLWo",
    "oWWWWWWWWWo.",
    "oooooooooo..",
    ".....oDo....",
    ".oooooooooo.",
    "oWWWWWWWWWo.",
    "oWLLLLLLWo..",
    ".oooooooooo.",
    ".....oDo....",
    ".....oDo....",
  ],
  palette: { o: O, W: "#c9925a", L: "#8b5a2b", D: "#6e4422" },
};

export const SKULL: PixelPiece = {
  art: [
    "..oooooo..",
    ".oWWWWWWo.",
    "oWWWWWWWWo",
    "oWooWWooWo",
    "oWooWWooWo",
    "oWWWooWWWo",
    ".oWWWWWWo.",
    "..oWoWoWo.",
    "...ooooo..",
  ],
  palette: { o: O, W: "#efe3c8" },
};

export const DROP: PixelPiece = {
  art: ["..o..", ".oBo.", "oBWBo", "oBBBo", ".ooo."],
  palette: { o: O, B: "#5fa8d3", W: "#c9e6f2" },
};

export const STAR: PixelPiece = {
  art: [
    "....o....",
    "...oYo...",
    "oooYYYooo",
    "oYYYWYYYo",
    ".oYYYYYo.",
    "..oYYYo..",
    ".oYYoYYo.",
    ".oYo.oYo.",
    ".oo...oo.",
  ],
  palette: { o: O, Y: "#f2c14e", W: "#fff3c4" },
};

export const CLOUD: PixelPiece = {
  art: [
    ".......WWWW.........",
    ".....WWWWWWWW.......",
    "..WWWWWWWWWWWWWWW...",
    ".WWWWWWWWWWWWWWWWWW.",
    "WWWWWWWWWWWWWWWWWWWW",
    ".SSSSSSSSSSSSSSSSSS.",
  ],
  palette: { W: "#fdf6e3", S: "#d6e4ee" },
};

export const CLOUD_SMALL: PixelPiece = {
  art: ["...WWWW....", ".WWWWWWWW..", "WWWWWWWWWWW", ".SSSSSSSSS."],
  palette: { W: "#fdf6e3", S: "#d6e4ee" },
};

export const SUN: PixelPiece = {
  art: [
    "....YYYY....",
    "..YYYYYYYY..",
    ".YYWWYYYYYY.",
    ".YWWYYYYYYY.",
    "YYWYYYYYYYYY",
    "YYYYYYYYYYYY",
    "YYYYYYYYYYOY",
    "YYYYYYYYYYOY",
    ".YYYYYYYYOO.",
    ".YYYYYYYOOO.",
    "..YOOOOOOO..",
    "....OOOO....",
  ],
  palette: { Y: "#f8d56b", W: "#fff6cf", O: "#efb243" },
};

// ───────────────────────────── tiles ─────────────────────────────

/** Split-rail fence, tiles horizontally. */
export const FENCE: PixelPiece = {
  art: [
    "..oo............",
    ".oWLo...........",
    ".oWLo...........",
    ".oWLo...........",
    "ooWLoooooooooooo",
    "WoWLoWWWWWWWWWWW",
    "LoWLoLLLLLLLLLLL",
    "ooWLoooooooooooo",
    ".oWLo...........",
    "ooWLoooooooooooo",
    "WoWLoWWWWWWWWWWW",
    "LoWLoLLLLLLLLLLL",
    "ooWLoooooooooooo",
    ".oWLo...........",
    ".oDDo...........",
  ],
  palette: { o: O, W: "#d9a066", L: "#a46a37", D: "#6e4422" },
};

/** Grass top edge with little tufts, sits on top of a grass block. */
export const GRASS_EDGE: PixelPiece = {
  art: [
    "...........g............g.......",
    "..g.......gG.....g.....gGg......",
    ".gGg..g..gGGg...gGg...gGGGg..g..",
    "gGGGggGggGGGGgggGGGgggGGGGGggGgg",
    "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
    "GGGGGGGLGGGGGGGGGGGGGGGLGGGGGGGG",
  ],
  palette: { g: "#8cc84b", G: "#5e9a2a", L: "#8cc84b" },
};

/** Grass fill with a sparse dither, tiles both ways. */
export const GRASS_FILL: PixelPiece = {
  art: [
    "GGGGGGGGGGGGGGGG",
    "GGGLGGGGGGGGGGGG",
    "GGGGGGGGGGGDGGGG",
    "GGGGGGGGGGGGGGGG",
    "GGGGGGGLGGGGGGGG",
    "GDGGGGGGGGGGGGLG",
    "GGGGGGGGGGGGGGGG",
    "GGGGGGGGGGDGGGGG",
  ],
  palette: { G: "#5e9a2a", L: "#76b23a", D: "#4f8a26" },
};

/** Tilled soil rows, tiles both ways. */
export const SOIL_ROWS: PixelPiece = {
  art: [
    "DDDDDDDDDDDDDDDD",
    "SSSSLSSSSSSSSSSS",
    "SSSSSSSSSSSLSSSS",
    "MMMMMMMMMMMMMMMM",
    "SSSSSSSSSLSSSSSS",
    "SSLSSSSSSSSSSSSS",
  ],
  palette: { D: "#3a2616", S: "#6e4422", L: "#8b5a2b", M: "#563820" },
};

/**
 * Rolling-hill silhouette tile, generated from a periodic function so it tiles seamlessly.
 * `width` native px; heights measured from the bottom.
 */
export function hillPiece({
  width = 96,
  height = 20,
  base = 9,
  amps = [5, 3],
  phase = 0,
  fill,
  rim,
}: {
  width?: number;
  height?: number;
  base?: number;
  amps?: [number, number];
  phase?: number;
  fill: string;
  rim: string;
}): PixelPiece {
  const cols: number[] = [];
  for (let x = 0; x < width; x++) {
    const t = (x / width) * Math.PI * 2;
    cols.push(Math.round(base + amps[0] * Math.sin(t * 2 + phase) + amps[1] * Math.sin(t * 3 + phase * 1.7 + 1)));
  }
  const art: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
      const top = height - cols[x];
      row += y < top ? "." : y === top ? "r" : "f";
    }
    art.push(row);
  }
  return { art, palette: { f: fill, r: rim } };
}
