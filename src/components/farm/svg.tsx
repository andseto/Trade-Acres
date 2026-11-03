import { type Grid, toSvgPaths } from "./art/grid";

// Two-frame idle animation done with stepped opacity so pixels never interpolate.
const SWAY_CSS =
  ".ta-f0{animation:ta-blink 1.8s steps(1,end) infinite}.ta-f1{opacity:0;animation:ta-blink 1.8s steps(1,end) infinite reverse}" +
  "@keyframes ta-blink{0%{opacity:1}50%{opacity:0}}" +
  "@media (prefers-reduced-motion:reduce){.ta-f0{animation:none}.ta-f1{animation:none;opacity:0}}";

const markupCache = new Map<string, string>();

/** Crisp pixel-art SVG from one or two frames of a Grid. Server-safe. */
export function PixelSvg({
  frames,
  cacheKey,
  viewW,
  viewH,
  ox = 0,
  oy = 0,
  width,
  height,
  className,
  title,
}: {
  frames: [Grid] | [Grid, Grid];
  cacheKey: string;
  viewW: number;
  viewH: number;
  ox?: number;
  oy?: number;
  width: number;
  height: number;
  className?: string;
  title?: string;
}) {
  let html = markupCache.get(cacheKey);
  if (!html) {
    if (frames.length === 2)
      html = `<style>${SWAY_CSS}</style><g class="ta-f0">${toSvgPaths(frames[0], ox, oy)}</g><g class="ta-f1">${toSvgPaths(frames[1], ox, oy)}</g>`;
    else html = toSvgPaths(frames[0], ox, oy);
    markupCache.set(cacheKey, html);
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewW} ${viewH}`}
      shapeRendering="crispEdges"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: "block" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
