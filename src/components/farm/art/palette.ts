import type { Season } from "@/lib/types";

/** Grass ramps per season, darkest → lightest (cool shadows, warm highlights). */
export const GRASS: Record<Season, readonly [string, string, string, string, string]> = {
  spring: ["#2b5a3a", "#3f8440", "#5fa846", "#86c652", "#c2e27a"],
  summer: ["#24503a", "#357a3e", "#4e9a40", "#72b84a", "#a8d66a"],
  fall: ["#3a4a30", "#56703a", "#768a40", "#9ca04c", "#c8b866"],
  winter: ["#7c8cb4", "#a6b4d6", "#d2dcf0", "#eaf0fa", "#ffffff"],
};

/** Tree canopy ramps per season (null = bare). */
export const CANOPY: Record<Season, readonly [string, string, string, string, string]> = {
  spring: ["#1f4a3a", "#2f7046", "#4e9a4a", "#7cc05a", "#b6e07a"],
  summer: ["#163e34", "#22603e", "#357e40", "#56a046", "#8cc858"],
  fall: ["#5a1e24", "#9a3424", "#d0602c", "#f0943a", "#fac66a"],
  winter: ["#3a2a2a", "#5a4034", "#7a5a44", "#d2dcf0", "#ffffff"],
};

export const BLOSSOM = ["#c45a8a", "#f08ab4", "#ffd0e4"] as const;

export const PATH: Record<Season, readonly [string, string, string, string]> = {
  spring: ["#6a4a2c", "#94683e", "#b48652", "#d2a874"],
  summer: ["#6e4c2c", "#9c6e40", "#bc8e56", "#d8b07a"],
  fall: ["#5e422a", "#8a603c", "#a87c50", "#c89c6c"],
  winter: ["#7a6a68", "#a49088", "#c2b4ac", "#e2dcd8"],
};

export const WOOD = {
  out: "#2a160c",
  dark: "#4a2a16",
  mid: "#7a4a26",
  light: "#a8703a",
  hi: "#d09a58",
};

export const STONE = ["#3a3a4e", "#5e6074", "#8a8c9a", "#b4b4ba", "#dedad2"] as const;

export const WATER = {
  deep: "#2a4a8a",
  mid: "#3a6ab4",
  light: "#5a92d6",
  hi: "#a8d4f4",
  foam: "#e4f4ff",
  ice: "#bcd4ec",
  iceHi: "#eaf6ff",
  iceLine: "#8aa8d0",
};

export const ROOF = { out: "#3a1420", dark: "#6e2430", mid: "#a43a34", light: "#cc5a40", hi: "#ec8a5a" };
export const ROOF_BLUE = { out: "#1c1e3a", dark: "#2e3a66", mid: "#425894", light: "#5e7cb8", hi: "#8eaada" };
