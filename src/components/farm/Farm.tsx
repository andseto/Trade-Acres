"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { BookOpen, Droplets, Sprout, X } from "lucide-react";
import type { AccountStatus, AccountType, CropId, Season } from "@/lib/types";
import {
  getCrop,
  getGrowthStage,
  GROWTH_STAGES,
  PLOT_STATE_LABEL,
  wateringsToNextStage,
  type GrowthStage,
  type PlotState,
} from "@/lib/farm";
import { timeAgo } from "@/lib/format";
import { FarmScene, type WaterRequest } from "./FarmScene";
import type { Layout } from "./engine/layout";
import type { ScenePlot } from "./engine/render";
import { SIGN_W } from "./art/props";
import { HydrationBar } from "./HydrationBar";

export interface FarmPlotData {
  id: string;
  plot_name: string;
  crop: CropId;
  name: string;
  firm: string | null;
  account_type: AccountType;
  status: AccountStatus;
  last_watered_at: string;
  water_count: number;
  stage: GrowthStage;
  state: PlotState;
  hydration: number;
}

const TYPE_LABEL: Record<AccountType, string> = { eval: "Evaluation", funded: "Funded", personal: "Personal" };
const STATUS_LABEL: Record<AccountStatus, string> = { active: "Active", passed: "Passed", blown: "Blown", retired: "Retired" };
const STAGE_LABEL = Object.fromEntries(GROWTH_STAGES.map((g) => [g.stage, g.label])) as Record<GrowthStage, string>;

function canWater(p: FarmPlotData) {
  return p.state !== "dead" && p.state !== "fallow";
}

export function Farm({ plots, season, watered }: { plots: FarmPlotData[]; season: Season; watered: string | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  // hover tooltip: which plot is hovered (state, changes rarely) + its position (moved imperatively)
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipIdx, setTipIdx] = useState<number | null>(null);

  const scenePlots: ScenePlot[] = plots.map((p) => ({ crop: p.crop, stage: p.stage, state: p.state }));

  // ?watered=<id>|<id,id,…>|all → watering-can animation once, then tidy the URL
  const wateredIds = watered && watered !== "all" ? watered.split(",") : [];
  const [water] = useState<WaterRequest | null>(() => {
    if (!watered) return null;
    const indices = plots
      .map((p, i) => ((watered === "all" ? canWater(p) && p.state !== "harvested" : wateredIds.includes(p.id) && canWater(p)) ? i : -1))
      .filter((i) => i >= 0);
    if (!indices.length) return null;
    const pre = new Map<number, ScenePlot>();
    for (const i of indices) {
      const p = plots[i];
      pre.set(i, {
        crop: p.crop,
        stage: getGrowthStage(Math.max(0, p.water_count - 1)),
        state: p.state === "harvested" ? "harvested" : "dry",
      });
    }
    return { id: 1, indices, pre };
  });

  useEffect(() => {
    if (!watered) return;
    const targets = plots.filter((p) => wateredIds.includes(p.id));
    const msg =
      targets.length === 1
        ? `${targets[0].plot_name} was watered`
        : targets.length > 1 || watered === "all"
          ? "Your plots were watered"
          : null;
    if (!water) router.replace("/farm", { scroll: false });
    if (!msg) return;
    const show = window.setTimeout(() => setToast(msg), 0);
    const hide = window.setTimeout(() => setToast(null), 4200);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
    // run once per watering param
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watered]);

  const onWaterDone = useCallback(() => router.replace("/farm", { scroll: false }), [router]);

  // close popover on Esc / click-away
  useEffect(() => {
    if (selected === null) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (popRef.current?.contains(t) || t.closest("[data-plot-btn]")) return;
      setSelected(null);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", down);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", down);
    };
  }, [selected]);

  const overlay = (l: Layout) => {
    const s = l.scale;
    const tipPlot = tipIdx !== null && tipIdx !== selected ? plots[tipIdx] : undefined;
    // keep the tooltip just above the pointer, inside the scene
    const moveTip = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
      const c = l.cells[i];
      const el = tipRef.current;
      if (!c || !el) return;
      const r = e.currentTarget.getBoundingClientRect();
      const x = Math.max(90, Math.min(l.W * s - 90, c.x * s + (e.clientX - r.left)));
      const y = Math.max(46, (c.y + 8) * s + (e.clientY - r.top));
      el.style.transform = `translate(${x}px, ${y - 16}px) translate(-50%, -100%)`;
    };
    if (plots.length === 0) {
      const f = l.field;
      return (
        <>
          <span
            className="pointer-events-none absolute text-center font-display leading-none text-[#3a2010]"
            style={{ left: (f.x + f.w / 2 - 26) * s, top: (f.y + 31.5) * s, width: 52 * s, fontSize: Math.round(4.5 * s) }}
          >
            Empty field
          </span>
          <div className="absolute flex justify-center" style={{ left: f.x * s, width: f.w * s, top: (f.y + 48) * s }}>
            <Link href="/accounts/new" className="btn-primary">
              <Sprout className="h-4 w-4" /> Plant your first plot
            </Link>
          </div>
        </>
      );
    }
    return (
      <>
        {plots.map((p, i) => {
          const c = l.cells[i];
          if (!c) return null;
          const sel = selected === i;
          return (
            <div key={p.id}>
              <button
                type="button"
                data-plot-btn
                aria-label={`${p.plot_name}: ${getCrop(p.crop).name}, ${PLOT_STATE_LABEL[p.state]}`}
                aria-expanded={sel}
                onClick={() => setSelected(sel ? null : i)}
                onPointerEnter={(e) => {
                  if (e.pointerType !== "mouse") return;
                  setTipIdx(i);
                  moveTip(e, i);
                }}
                onPointerMove={(e) => e.pointerType === "mouse" && moveTip(e, i)}
                onPointerLeave={() => setTipIdx((cur) => (cur === i ? null : cur))}
                className="group absolute cursor-pointer outline-none"
                style={{ left: c.x * s, top: (c.y + 8) * s, width: 56 * s, height: 60 * s }}
              >
                {/* pixel corner brackets */}
                {(["left-0 top-0 border-l-[3px] border-t-[3px]", "right-0 top-0 border-r-[3px] border-t-[3px]", "left-0 bottom-0 border-b-[3px] border-l-[3px]", "right-0 bottom-0 border-b-[3px] border-r-[3px]"] as const).map(
                  (cls) => (
                    <span
                      key={cls}
                      className={clsx(
                        "absolute h-3 w-3 border-gold transition-opacity duration-75",
                        cls,
                        sel ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                      )}
                    />
                  ),
                )}
              </button>
              <span
                aria-hidden
                className={clsx(
                  "pointer-events-none absolute truncate text-center font-display leading-none",
                  sel ? "text-[#5a1a08]" : "text-[#3a2010]",
                )}
                style={{
                  left: (c.x + 10) * s,
                  top: (c.y + 57) * s,
                  width: (SIGN_W - 4) * s,
                  fontSize: Math.round(4.5 * s),
                  lineHeight: `${5 * s}px`,
                }}
              >
                {p.plot_name}
              </span>
            </div>
          );
        })}
        <div
          ref={tipRef}
          role="tooltip"
          className="pointer-events-none absolute left-0 top-0 z-30 max-w-[260px] border-[3px] border-outline bg-cream px-2.5 py-1.5 text-[#2a160c] shadow-[0_3px_0_0_rgba(0,0,0,0.4)]"
          style={{ display: tipPlot ? "block" : "none", willChange: "transform" }}
        >
          {tipPlot && (
            <>
              <p className="whitespace-normal break-words font-display text-[15px] leading-tight">{tipPlot.plot_name}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-tight text-[#6b4426]">
                {getCrop(tipPlot.crop).name} · {STAGE_LABEL[tipPlot.stage]} · {PLOT_STATE_LABEL[tipPlot.state]}
              </p>
            </>
          )}
        </div>
        {selected !== null && plots[selected] && l.cells[selected] && (
          <PlotPopover ref={popRef} plot={plots[selected]} layout={l} index={selected} onClose={() => setSelected(null)} />
        )}
      </>
    );
  };

  return (
    <div className="relative">
      <div className="border-[3px] border-outline bg-[#2b4a2a] shadow-[inset_0_0_0_2px_#6b4426,0_4px_0_0_rgba(0,0,0,0.35)]" style={{ borderRadius: 4 }}>
        <FarmScene plots={scenePlots} season={season} water={water} onWaterDone={onWaterDone} overlay={overlay} />
      </div>
      {toast && (
        <div role="status" className="panel pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 px-4 py-3 font-display text-base">
          <Droplets className="h-5 w-5 text-[#8ab4e0]" />
          {toast}
        </div>
      )}
    </div>
  );
}

function PlotPopover({
  plot: p,
  layout: l,
  index,
  onClose,
  ref,
}: {
  plot: FarmPlotData;
  layout: Layout;
  index: number;
  onClose: () => void;
  ref: React.Ref<HTMLDivElement>;
}) {
  const s = l.scale;
  const c = l.cells[index];
  const width = Math.min(300, l.W * s - 16);
  const cx = (c.x + 28) * s;
  const left = Math.max(8, Math.min(l.W * s - width - 8, cx - width / 2));
  const below = (c.y + 70) * s;
  const estH = 330;
  const placeAbove = below + estH > l.H * s + 40 && (c.y + 8) * s > estH;
  const toNext = wateringsToNextStage(p.water_count);
  const crop = getCrop(p.crop);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={p.plot_name}
      className="panel absolute z-20 p-4 text-left"
      style={{ left, width, ...(placeAbove ? { bottom: l.H * s - (c.y + 8) * s } : { top: below }) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-xl leading-tight">{p.plot_name}</p>
          <p className="truncate text-xs text-muted">
            {crop.name} · {p.name}
            {p.firm ? ` · ${p.firm}` : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} className="-mr-1 -mt-1 p-1 text-muted hover:text-cream" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="chip">{TYPE_LABEL[p.account_type]}</span>
        <span className={clsx("chip", p.status === "blown" ? "text-loss" : p.status === "passed" ? "text-gold" : "")}>{STATUS_LABEL[p.status]}</span>
        <span className="chip">{PLOT_STATE_LABEL[p.state]}</span>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Growth</dt>
          <dd className="font-semibold">{STAGE_LABEL[p.stage]}</dd>
        </div>
        <p className="text-xs text-muted">
          {toNext === null ? "Fully grown — keep it watered." : `${toNext} more journal entr${toNext === 1 ? "y" : "ies"} to the next stage`}
        </p>
        <div className="pt-1">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted">Water</span>
            <span>{p.hydration}%</span>
          </div>
          <HydrationBar value={p.hydration} />
        </div>
        <div className="flex justify-between gap-2 text-xs">
          <span className="text-muted">Last watered {timeAgo(p.last_watered_at)}</span>
          <span className="text-muted">
            {p.water_count} watering{p.water_count === 1 ? "" : "s"}
          </span>
        </div>
      </dl>
      <div className="mt-4 grid gap-2">
        {canWater(p) && (
          <Link href={`/journal/new?account=${p.id}`} className="btn-primary text-sm">
            <Droplets className="h-4 w-4" /> Water it — log a trade
          </Link>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/journal/entries/new?account=${p.id}`} className="btn-ghost whitespace-nowrap px-2 text-[13px]">
            <BookOpen className="h-4 w-4 shrink-0" /> Journal entry
          </Link>
          <Link href={`/accounts/${p.id}`} className="btn-ghost whitespace-nowrap px-2 text-[13px]">
            View plot
          </Link>
        </div>
      </div>
    </div>
  );
}
