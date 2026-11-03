"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Season } from "@/lib/types";
import { computeLayout, type Layout } from "./engine/layout";
import { FarmRenderer, type ScenePlot, WATER_DURATION, WATER_STEP } from "./engine/render";

export interface WaterRequest {
  /** bumps to re-trigger */
  id: number;
  indices: number[];
  pre: Map<number, ScenePlot>;
}

const FRAME_MS = 1000 / 30;

function layoutFor(bw: number, bh: number, n: number, mode: "full" | "mini"): Layout | null {
  if (bw < 50) return null;
  if (mode === "full") return computeLayout(bw, n);
  // hero banner: biggest integer scale whose whole scene fits the height
  for (let s = 5; s >= 2; s--) {
    const l = computeLayout(bw, n, { scale: s, compact: true });
    if (l.H * s <= bh) return computeLayout(bw, n, { scale: s, compact: true, minH: Math.ceil(bh / s) });
  }
  return computeLayout(bw, n, { scale: 2, compact: true });
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * The canvas farm. Lays itself out from its container width (full) or width + height (mini), picks
 * an integer scale, and renders at art resolution so the browser upscales with hard pixel edges.
 */
export function FarmScene({
  plots,
  season,
  mode = "full",
  water,
  onWaterDone,
  overlay,
  className,
  style,
  hour,
}: {
  plots: ScenePlot[];
  season: Season;
  mode?: "full" | "mini";
  water?: WaterRequest | null;
  onWaterDone?: () => void;
  overlay?: (layout: Layout) => ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** pin the time of day (otherwise the viewer's local clock) */
  hour?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FarmRenderer | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const reduced = usePrefersReducedMotion();
  const plotsKey = plots.map((p) => `${p.crop}.${p.stage}.${p.state}`).join("|");
  const n = plots.length;

  // measure
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.floor(e.contentRect.width);
      const h = Math.floor(e.contentRect.height);
      setBox((b) => (b && b.w === w && (mode === "full" || b.h === h) ? b : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const bw = box?.w ?? 0;
  const bh = box?.h ?? 0;
  const layout = useMemo(() => layoutFor(bw, bh, n, mode), [bw, bh, n, mode]);

  // (re)build the renderer when layout, crops or season change; drive the RAF loop
  const plotsRef = useRef(plots);
  useEffect(() => {
    plotsRef.current = plots;
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    const r = new FarmRenderer(canvas, layout, plotsRef.current, season);
    rendererRef.current = r;
    r.setTimeOfDay(hour ?? new Date().getHours());

    let raf = 0;
    let last = 0;
    let visible = !document.hidden;
    let onScreen = true;
    const loop = (now: number) => {
      raf = 0;
      if (now - last >= FRAME_MS) {
        last = now;
        r.render(now);
      }
      if (visible && onScreen && (!reduced || r.watering)) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && visible && onScreen) raf = requestAnimationFrame(loop);
    };
    r.render(reduced ? 0 : performance.now());
    kick();

    const onVis = () => {
      visible = !document.hidden;
      if (visible) kick();
    };
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) kick();
    });
    io.observe(canvas);
    const clock = window.setInterval(() => {
      r.setTimeOfDay(hour ?? new Date().getHours());
      if (reduced) r.render(0);
    }, 60_000);
    (r as FarmRenderer & { kick?: () => void }).kick = kick;
    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      window.clearInterval(clock);
      rendererRef.current = null;
    };
    // plotsKey stands in for plots (stable identity across renders)
  }, [layout, season, plotsKey, reduced, hour]);

  // watering animation
  const doneRef = useRef(onWaterDone);
  useEffect(() => {
    doneRef.current = onWaterDone;
  });
  useEffect(() => {
    const r = rendererRef.current;
    if (!water || !r) return;
    if (reduced) {
      const id = window.setTimeout(() => doneRef.current?.(), 400);
      return () => window.clearTimeout(id);
    }
    const order = new Map<number, number>();
    water.indices.forEach((idx, k) => order.set(idx, Math.min(k, 12)));
    r.water = { start: performance.now(), order, pre: water.pre };
    (r as FarmRenderer & { kick?: () => void }).kick?.();
    const total = WATER_DURATION + Math.min(water.indices.length - 1, 12) * WATER_STEP + 200;
    const id = window.setTimeout(() => doneRef.current?.(), total);
    return () => window.clearTimeout(id);
    // layout in deps: the renderer is rebuilt on layout change and needs the request again
  }, [water, reduced, layout]);

  return (
    <div ref={wrapRef} className={className} style={{ position: "relative", overflow: mode === "mini" ? "hidden" : "visible", ...style }}>
      {layout && (
        <div
          style={{
            position: "relative",
            width: layout.W * layout.scale,
            height: layout.H * layout.scale,
            margin: "0 auto",
          }}
        >
          <canvas
            ref={canvasRef}
            aria-hidden
            style={{ display: "block", width: layout.W * layout.scale, height: layout.H * layout.scale, imageRendering: "pixelated" }}
          />
          {overlay?.(layout)}
        </div>
      )}
    </div>
  );
}
