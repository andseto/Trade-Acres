import type { CropId } from "@/lib/types";
import { getCrop, type GrowthStage, type PlotState } from "@/lib/farm";
import { cropGrid } from "./art/crops";
import { PixelSvg } from "./svg";

export interface CropSpriteProps {
  crop: CropId;
  stage?: GrowthStage;
  state?: PlotState;
  /** rendered size in CSS px (square). Use multiples of the sprite's native size for crisp pixels. */
  size?: number;
  /** idle sway when true */
  animated?: boolean;
  className?: string;
}

/** A single crop plant as pixel art (no soil) — for pickers, badges and cards. */
export function CropSprite({ crop, stage = "ripe", state = "moist", size = 48, animated = false, className }: CropSpriteProps) {
  const s: PlotState = state === "harvested" || state === "fallow" ? "moist" : state;
  const st: GrowthStage = state === "fallow" ? "seed" : stage;
  const g0 = cropGrid(crop, st, s);
  const side = Math.max(16, g0.h);
  const anim = animated && st !== "seed" && s !== "dead";
  const frames: [typeof g0] | [typeof g0, typeof g0] = anim ? [g0, cropGrid(crop, st, s, { frame: 1 })] : [g0];
  return (
    <PixelSvg
      frames={frames}
      cacheKey={`crop|${crop}|${st}|${s}|${anim ? 1 : 0}`}
      viewW={side}
      viewH={side}
      ox={Math.floor((side - 16) / 2)}
      oy={side - g0.h}
      width={size}
      height={size}
      className={className}
      title={`${getCrop(crop).name}`}
    />
  );
}
