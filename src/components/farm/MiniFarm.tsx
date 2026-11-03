"use client";

import type { CropId, Season } from "@/lib/types";
import type { GrowthStage, PlotState } from "@/lib/farm";
import { FarmScene } from "./FarmScene";
import { SIGN_W } from "./art/props";

export interface MiniFarmPlot {
  crop: CropId;
  stage?: GrowthStage;
  state?: PlotState;
  name?: string;
}

export interface MiniFarmProps {
  plots: MiniFarmPlot[];
  season?: Season;
  /** css height, e.g. 320 or "40vh" */
  height?: number | string;
  className?: string;
}

/** Self-contained decorative farm scene (no data fetching) — used on the landing page hero. */
export function MiniFarm({ plots, season = "spring", height = 320, className }: MiniFarmProps) {
  const scenePlots = plots.map((p) => ({ crop: p.crop, stage: p.stage ?? "ripe", state: p.state ?? "moist" }));
  return (
    <FarmScene
      mode="mini"
      plots={scenePlots}
      season={season}
      className={className}
      style={{ height }}
      overlay={(l) =>
        plots.map((p, i) =>
          p.name && l.cells[i] ? (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute truncate text-center font-display leading-none text-[#3a2010]"
              style={{
                left: (l.cells[i].x + 10) * l.scale,
                top: (l.cells[i].y + 57) * l.scale,
                width: (SIGN_W - 4) * l.scale,
                fontSize: Math.round(4.5 * l.scale),
                lineHeight: `${5 * l.scale}px`,
              }}
            >
              {p.name}
            </span>
          ) : null,
        )
      }
    />
  );
}
