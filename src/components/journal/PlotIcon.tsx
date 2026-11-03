import { CropSprite } from "@/components/farm/CropSprite";
import { getGrowthStage, getPlotState } from "@/lib/farm";
import type { PlotAccount } from "./normalize";

/** A plot's crop as a small sprite, grown / wilted to match the account. */
export function PlotIcon({
  plot,
  size = 32,
  animated,
  className,
}: {
  plot: PlotAccount;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <CropSprite
      crop={plot.crop}
      stage={getGrowthStage(plot.water_count ?? 0)}
      state={getPlotState(plot)}
      size={size}
      animated={animated}
      className={className}
    />
  );
}

/** Small pixel "seed packet" used for the "All my plots" option. */
export function AllPlotsIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{ width: size, height: size, display: "inline-grid", gridTemplateColumns: "1fr 1fr" }}
    >
      {(["wheat", "carrot", "tomato", "sunflower"] as const).map((c) => (
        <CropSprite key={c} crop={c} stage="young" size={size / 2} />
      ))}
    </span>
  );
}
