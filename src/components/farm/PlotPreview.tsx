import type { CropId } from "@/lib/types";
import { getCrop, PLOT_STATE_LABEL, type GrowthStage, type PlotState } from "@/lib/farm";
import { PLOT_BOX, plotGrid } from "./art/plot";
import { PixelSvg } from "./svg";

export interface PlotPreviewProps {
  crop: CropId;
  stage?: GrowthStage;
  state?: PlotState;
  /** rendered width in CSS px (the plot is square, plus a little grass border) */
  size?: number;
  animated?: boolean;
  className?: string;
}

/** One plot of tilled soil with its crop, as pixel art — for account cards, the adopt wizard and detail pages. */
export function PlotPreview({ crop, stage = "ripe", state = "moist", size = 128, animated = false, className }: PlotPreviewProps) {
  const anim = animated && state !== "dead" && state !== "fallow";
  const g0 = plotGrid(crop, stage, state);
  const frames: [typeof g0] | [typeof g0, typeof g0] = anim ? [g0, plotGrid(crop, stage, state, { frame: 1 })] : [g0];
  return (
    <PixelSvg
      frames={frames}
      cacheKey={`plot|${crop}|${stage}|${state}|${anim ? 1 : 0}`}
      viewW={PLOT_BOX}
      viewH={PLOT_BOX}
      width={size}
      height={size}
      className={className}
      title={`${getCrop(crop).name} plot — ${PLOT_STATE_LABEL[state]}`}
    />
  );
}
