"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CropSprite } from "@/components/farm/CropSprite";
import type { GrowthStage } from "@/lib/farm";
import type { CropId } from "@/lib/types";
import {
  CLOUD,
  CLOUD_SMALL,
  FENCE,
  GRASS_EDGE,
  GRASS_FILL,
  hillPiece,
  PixelArt,
  PixelStrip,
  pieceSize,
  pieceToDataUri,
  SOIL_ROWS,
  SUN,
} from "@/components/landing/PixelArt";

// Hard-stopped bands, the way a pixel-art sky is painted.
const SKY =
  "linear-gradient(180deg, #5aa5d6 0 18%, #67afdc 18% 34%, #76b9e1 34% 48%, #86c3e5 48% 60%, #98cde8 60% 70%, #acd7ea 70% 100%)";

const FAR_HILLS = hillPiece({ width: 120, height: 22, base: 11, amps: [5, 3], phase: 0.6, fill: "#7fae6a", rim: "#98c27f" });
const NEAR_HILLS = hillPiece({ width: 96, height: 16, base: 7, amps: [4, 2], phase: 2.1, fill: "#5e9a2a", rim: "#76b23a" });

const ROW: { crop: CropId; stage: GrowthStage }[] = [
  { crop: "wheat", stage: "ripe" },
  { crop: "corn", stage: "mature" },
  { crop: "carrot", stage: "ripe" },
  { crop: "tomato", stage: "ripe" },
  { crop: "sunflower", stage: "ripe" },
  { crop: "strawberry", stage: "mature" },
  { crop: "pumpkin", stage: "ripe" },
  { crop: "blueberry", stage: "ripe" },
  { crop: "corn", stage: "ripe" },
  { crop: "wheat", stage: "mature" },
  { crop: "tomato", stage: "young" },
  { crop: "sunflower", stage: "mature" },
];

function Tiled({ piece, scale, className }: { piece: Parameters<typeof pieceToDataUri>[0]; scale: number; className?: string }) {
  const { width, height } = pieceSize(piece, scale);
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundImage: pieceToDataUri(piece),
        backgroundSize: `${width}px ${height}px`,
        imageRendering: "pixelated",
      }}
    />
  );
}

function Cloud({ big, top, duration, delay }: { big?: boolean; top: string; duration: number; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute left-0"
      style={{ top }}
      initial={{ x: "-20vw" }}
      animate={reduce ? { x: "20vw" } : { x: ["-20vw", "110vw"] }}
      transition={reduce ? { duration: 0 } : { duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <PixelArt piece={big ? CLOUD : CLOUD_SMALL} scale={big ? 5 : 4} />
    </motion.div>
  );
}

/** A sunny little farm behind the auth signboard: banded sky, drifting clouds, hills, a fence and a crop row. */
export function FarmBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: SKY }}>
      <PixelArt piece={SUN} scale={6} className="absolute right-[8%] top-[9%]" />
      <Cloud big top="10%" duration={90} delay={-20} />
      <Cloud top="22%" duration={70} delay={-50} />
      <Cloud big top="34%" duration={110} delay={-85} />
      <Cloud top="6%" duration={80} delay={-5} />

      {/* ground stack, anchored to the bottom */}
      <div className="absolute inset-x-0 bottom-0">
        <PixelStrip piece={FAR_HILLS} scale={4} />
        <div className="-mt-px">
          <PixelStrip piece={NEAR_HILLS} scale={4} className="bg-[#7fae6a]" />
        </div>
        <div className="relative bg-[#5e9a2a]">
          <PixelStrip piece={FENCE} scale={3} className="absolute inset-x-0 -top-8" />
          <Tiled piece={GRASS_FILL} scale={3} className="h-14" />
          {/* tilled row of crops */}
          <div className="relative">
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-around px-2">
              {ROW.map((c, i) => (
                <CropSprite
                  key={i}
                  crop={c.crop}
                  stage={c.stage}
                  size={48}
                  animated
                  className={i >= 6 ? "hidden sm:block" : undefined}
                />
              ))}
            </div>
            <PixelStrip piece={GRASS_EDGE} scale={3} className="bg-[#6e4422]" />
            <Tiled piece={SOIL_ROWS} scale={3} className="h-16 border-t-[3px] border-outline" />
          </div>
        </div>
      </div>
    </div>
  );
}
