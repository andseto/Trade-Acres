// The Trade Acres mark: a 12×12 pixel sprout growing from a soil block. Pure SVG rects, crisp at any integer scale.
const PX: [number, number, number, number, string][] = [
  // leaves
  [3, 1, 2, 1, "#5e9a2a"], [2, 2, 3, 1, "#8cc84b"], [2, 3, 3, 1, "#5e9a2a"],
  [7, 0, 2, 1, "#8cc84b"], [6, 1, 4, 1, "#b6e27c"], [7, 2, 3, 1, "#8cc84b"], [7, 3, 2, 1, "#5e9a2a"],
  // stem
  [5, 3, 1, 1, "#5e9a2a"], [6, 3, 1, 4, "#4f8a26"], [5, 4, 1, 1, "#4f8a26"],
  // soil block
  [1, 7, 10, 1, "#8b5a2b"], [0, 8, 12, 1, "#6e4422"], [0, 9, 12, 2, "#563820"], [0, 11, 12, 1, "#3a2616"],
  [2, 9, 1, 1, "#3a2616"], [7, 10, 1, 1, "#3a2616"], [9, 9, 1, 1, "#8b5a2b"],
];

export function PixelLogo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges" className={className} aria-hidden>
      {PX.map(([x, y, w, h, c], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={c} />
      ))}
    </svg>
  );
}
