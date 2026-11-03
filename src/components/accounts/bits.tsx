import clsx from "clsx";
import type { AccountStatus, AccountType } from "@/lib/types";
import {
  getHydration,
  getMoisture,
  GROWTH_STAGES,
  getGrowthStage,
  MOISTURE_LABEL,
  wateringsToNextStage,
  type Moisture,
} from "@/lib/farm";
import { STATUS_META, TYPE_META } from "./constants";
import { drawdownTone } from "./stats";
import { formatMoney, formatPnl } from "@/lib/format";

export function StatusBadge({ status, className }: { status: AccountStatus; className?: string }) {
  const m = STATUS_META[status] ?? STATUS_META.active;
  return (
    <span className={clsx("chip", m.className, className)}>
      <span aria-hidden>{m.emoji}</span>
      {m.label}
    </span>
  );
}

export function TypeBadge({ type, className }: { type: AccountType; className?: string }) {
  const m = TYPE_META[type] ?? TYPE_META.eval;
  return <span className={clsx("chip", m.className, className)}>{m.label}</span>;
}

/** Tiled pixel grass, used behind plot previews. */
export const GRASS_BG: React.CSSProperties = {
  backgroundColor: "#4f8a26",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' shape-rendering='crispEdges'%3E%3Crect width='16' height='16' fill='%234f8a26'/%3E%3Crect x='2' y='3' width='1' height='2' fill='%2367a532'/%3E%3Crect x='9' y='1' width='1' height='2' fill='%2367a532'/%3E%3Crect x='12' y='9' width='1' height='2' fill='%2367a532'/%3E%3Crect x='5' y='11' width='1' height='2' fill='%2367a532'/%3E%3Crect x='6' y='6' width='1' height='1' fill='%23457a20'/%3E%3Crect x='14' y='4' width='1' height='1' fill='%23457a20'/%3E%3Crect x='1' y='14' width='1' height='1' fill='%23457a20'/%3E%3Crect x='10' y='14' width='1' height='1' fill='%23457a20'/%3E%3C/svg%3E\")",
  backgroundSize: "48px 48px",
  imageRendering: "pixelated",
};

/** A chunky segmented pixel meter. `pct` is 0..100. */
export function PixelMeter({
  pct,
  fill,
  compact,
  blink,
  label,
}: {
  pct: number;
  fill: string;
  compact?: boolean;
  blink?: boolean;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div
      className={clsx("relative overflow-hidden rounded-sm border-2 border-outline bg-[#22170d]", compact ? "h-3" : "h-4")}
      style={{ boxShadow: "inset 0 2px 0 0 rgba(0,0,0,0.45)" }}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
    >
      <div
        className={clsx("h-full transition-[width] duration-700 ease-[steps(8)]", blink && "animate-pulse")}
        style={{
          width: `${v}%`,
          backgroundColor: fill,
          boxShadow: "inset 0 2px 0 0 rgba(255,255,255,0.35), inset 0 -2px 0 0 rgba(0,0,0,0.25)",
        }}
      />
      {/* segment notches */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 10px, rgba(20,12,6,0.55) 10px 12px)" }}
      />
    </div>
  );
}

function MeterHeader({ left, right, compact }: { left: React.ReactNode; right: React.ReactNode; compact?: boolean }) {
  return (
    <div className={clsx("flex items-center justify-between gap-2 font-semibold", compact ? "mb-1 text-xs" : "mb-1.5 text-sm")}>
      <span className="font-display uppercase tracking-wider text-muted">{left}</span>
      <span className="truncate">{right}</span>
    </div>
  );
}

const MOISTURE_COLOR: Record<Moisture, string> = {
  soaked: "#5fb3e8",
  moist: "#6fa8c9",
  dry: "#d8b25a",
  parched: "#d9853e",
  withering: "#e8604c",
};

const MOISTURE_ICON: Record<Moisture, string> = {
  soaked: "💧",
  moist: "💧",
  dry: "🌾",
  parched: "🥵",
  withering: "🥀",
};

export function HydrationBar({ lastWateredAt, compact, now }: { lastWateredAt: string; compact?: boolean; now?: Date }) {
  const level = getMoisture(lastWateredAt, now);
  const pct = getHydration(lastWateredAt, now);
  const tone = level === "withering" || level === "parched" ? "text-loss" : level === "dry" ? "text-gold" : "text-[#9fd3f2]";
  return (
    <div>
      <MeterHeader
        compact={compact}
        left="Moisture"
        right={
          <span className={tone}>
            <span aria-hidden>{MOISTURE_ICON[level]}</span> {MOISTURE_LABEL[level]}
          </span>
        }
      />
      <PixelMeter pct={Math.max(pct, 3)} fill={MOISTURE_COLOR[level]} compact={compact} blink={level === "withering"} label="Hydration" />
    </div>
  );
}

/** Five stage pips + "n more entries to <next stage>". */
export function GrowthMeter({ waterCount, compact }: { waterCount: number; compact?: boolean }) {
  const stage = getGrowthStage(waterCount);
  const idx = GROWTH_STAGES.findIndex((g) => g.stage === stage);
  const left = wateringsToNextStage(waterCount);
  const next = GROWTH_STAGES[idx + 1];
  return (
    <div>
      <MeterHeader
        compact={compact}
        left="Growth"
        right={<span className="text-cream">{GROWTH_STAGES[idx].label}</span>}
      />
      <div className="flex gap-1" aria-hidden>
        {GROWTH_STAGES.map((g, i) => (
          <span
            key={g.stage}
            className={clsx("flex-1 rounded-sm border-2 border-outline", compact ? "h-3" : "h-4")}
            style={{
              backgroundColor: i <= idx ? (i === GROWTH_STAGES.length - 1 ? "#f2c14e" : "#8cc84b") : "#22170d",
              boxShadow: i <= idx ? "inset 0 2px 0 0 rgba(255,255,255,0.35)" : "inset 0 2px 0 0 rgba(0,0,0,0.45)",
            }}
          />
        ))}
      </div>
      <p className={clsx("text-muted", compact ? "mt-1 text-[11px]" : "mt-1.5 text-xs")}>
        {left === null || !next
          ? "Fully ripe. Keep watering to keep it that way."
          : `${left} more ${left === 1 ? "entry" : "entries"} to ${next.label.toLowerCase()}`}
      </p>
    </div>
  );
}

export function TargetBar({ pnl, target, compact }: { pnl: number; target: number; compact?: boolean }) {
  const pct = Math.max(0, Math.min(1, pnl / target));
  const done = pnl >= target;
  return (
    <div>
      <MeterHeader
        compact={compact}
        left="Profit target"
        right={
          <span className={done ? "text-gold" : "text-cream"}>
            {done && <span aria-hidden>🏆 </span>}
            {formatPnl(pnl)} <span className="text-muted">/ {formatMoney(target)}</span>
          </span>
        }
      />
      <PixelMeter pct={Math.max(pct * 100, pnl > 0 ? 3 : 0)} fill={done ? "#f2c14e" : "#9bd65a"} compact={compact} label="Profit target" />
    </div>
  );
}

export function DrawdownBar({ used, max, compact }: { used: number; max: number; compact?: boolean }) {
  const pct = max > 0 ? used / max : 0;
  const tone = drawdownTone(pct);
  return (
    <div>
      <MeterHeader
        compact={compact}
        left="Drawdown used"
        right={
          <span className={tone === "danger" ? "text-loss" : tone === "warn" ? "text-gold" : "text-cream"}>
            {tone === "danger" && <span aria-hidden>⚠️ </span>}
            {formatMoney(used)} <span className="text-muted">/ {formatMoney(max)}</span>
          </span>
        }
      />
      <PixelMeter
        pct={Math.min(100, pct * 100)}
        fill={tone === "danger" ? "#e8604c" : tone === "warn" ? "#f2c14e" : "#b08a5a"}
        compact={compact}
        blink={tone === "danger"}
        label="Drawdown used"
      />
    </div>
  );
}

/** Little wooden sign on two posts. */
export function WoodSign({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("relative inline-flex flex-col items-center", className)}>
      <div
        className="relative z-10 max-w-full rounded-sm border-[3px] border-outline bg-[#a0703c] px-4 py-1.5 text-center font-display text-lg leading-tight text-[#2b1a0e]"
        style={{
          boxShadow: "inset 0 3px 0 0 #c99556, inset 0 -3px 0 0 #7a4f26, 0 3px 0 0 rgba(0,0,0,0.4)",
          backgroundImage: "repeating-linear-gradient(180deg, transparent 0 7px, rgba(90,55,25,0.35) 7px 8px)",
        }}
      >
        <span className="block truncate">{children}</span>
      </div>
      <div className="flex w-full justify-between px-[22%]" aria-hidden>
        <span className="h-4 w-2 border-x-2 border-b-2 border-outline bg-[#6b4426]" />
        <span className="h-4 w-2 border-x-2 border-b-2 border-outline bg-[#6b4426]" />
      </div>
    </div>
  );
}
