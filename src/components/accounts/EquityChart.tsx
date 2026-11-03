"use client";

import { useId, useState } from "react";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import { formatCompactMoney, formatPnl, pnlClass } from "@/lib/format";
import type { EquityPoint } from "./stats";

const W = 600;
const H = 220;
const PAD_Y = 14;

function fmtDate(d: string, f = "MMM d") {
  try {
    return format(parseISO(d), f);
  } catch {
    return d;
  }
}

/** Cumulative P&L curve. Single series: green above the starting balance, red below. Hand-built SVG. */
export function EquityChart({ points }: { points: EquityPoint[] }) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-sm border-[3px] border-dashed border-outline bg-[#2a1c10] text-center">
        <span className="text-3xl" aria-hidden>
          🌱
        </span>
        <p className="mt-2 text-sm text-muted">No trades yet. Your equity curve will sprout here.</p>
      </div>
    );
  }

  // prepend the zero origin so a single trade still draws a line
  const series = [{ date: "", pnl: 0, day: 0 }, ...points];
  const values = series.map((p) => p.pnl);
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  let min = Math.min(0, lo);
  let max = Math.max(0, hi);
  if (max === min) {
    max += 1;
    min -= 1;
  }
  const span = max - min;
  min -= span * 0.06;
  max += span * 0.06;

  const x = (i: number) => (series.length === 1 ? W / 2 : (i / (series.length - 1)) * W);
  const y = (v: number) => PAD_Y + (1 - (v - min) / (max - min)) * (H - PAD_Y * 2);
  const zeroY = y(0);

  const line = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(p.pnl).toFixed(2)}`).join(" ");
  const area = `${line} L${x(series.length - 1).toFixed(2)},${zeroY.toFixed(2)} L0,${zeroY.toFixed(2)} Z`;

  const final = points[points.length - 1].pnl;
  const hp = hover !== null && hover > 0 ? series[hover] : null;
  const leftPct = hover !== null ? (x(hover) / W) * 100 : 0;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const i = Math.round(rel * (series.length - 1));
    setHover(Math.max(1, i));
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="font-display text-xs uppercase tracking-wider text-muted">Cumulative P&amp;L</div>
        <div className={clsx("text-lg font-semibold", pnlClass(final))}>{formatPnl(final)}</div>
      </div>
      <div className="flex gap-2">
        {/* y labels */}
        <div className="relative w-12 shrink-0 text-right text-[10px] text-muted" style={{ height: H }}>
          {hi > 0 && (
            <span className="absolute right-0 -translate-y-1/2" style={{ top: `${(y(hi) / H) * 100}%` }}>
              +{formatCompactMoney(hi)}
            </span>
          )}
          <span className="absolute right-0 -translate-y-1/2 font-semibold text-cream/70" style={{ top: `${(zeroY / H) * 100}%` }}>
            $0
          </span>
          {lo < 0 && (
            <span className="absolute right-0 -translate-y-1/2" style={{ top: `${(y(lo) / H) * 100}%` }}>
              -{formatCompactMoney(Math.abs(lo))}
            </span>
          )}
        </div>
        <div
          className="relative min-w-0 flex-1 touch-pan-y"
          style={{ height: H }}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label={`Equity curve, ending at ${formatPnl(final)}`}>
            <defs>
              <clipPath id={`above-${uid}`}>
                <rect x="-10" y="-10" width={W + 20} height={zeroY + 10} />
              </clipPath>
              <clipPath id={`below-${uid}`}>
                <rect x="-10" y={zeroY} width={W + 20} height={H - zeroY + 10} />
              </clipPath>
              <linearGradient id={`gpos-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gain)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--gain)" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id={`gneg-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--loss)" stopOpacity="0.02" />
                <stop offset="100%" stopColor="var(--loss)" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* recessive grid */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgba(246,231,193,0.07)" vectorEffect="non-scaling-stroke" />
            ))}

            <g clipPath={`url(#above-${uid})`}>
              <path d={area} fill={`url(#gpos-${uid})`} />
              <path d={line} fill="none" stroke="var(--gain)" strokeWidth="3" strokeLinejoin="miter" strokeLinecap="square" vectorEffect="non-scaling-stroke" />
            </g>
            <g clipPath={`url(#below-${uid})`}>
              <path d={area} fill={`url(#gneg-${uid})`} />
              <path d={line} fill="none" stroke="var(--loss)" strokeWidth="3" strokeLinejoin="miter" strokeLinecap="square" vectorEffect="non-scaling-stroke" />
            </g>

            {/* baseline = starting balance */}
            <line x1="0" x2={W} y1={zeroY} y2={zeroY} stroke="rgba(246,231,193,0.35)" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />

            {hover !== null && (
              <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="rgba(246,231,193,0.4)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            )}
          </svg>

          {/* hover dot + tooltip in HTML so they don't stretch with the SVG */}
          {hp && (
            <>
              <span
                className={clsx(
                  "pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 border-2 border-outline",
                  hp.pnl >= 0 ? "bg-gain" : "bg-loss",
                )}
                style={{ left: `${leftPct}%`, top: `${(y(hp.pnl) / H) * 100}%` }}
              />
              <div
                className="pointer-events-none absolute top-0 z-10 rounded-sm border-[3px] border-outline bg-wood px-3 py-2 text-xs shadow-[inset_0_2px_0_0_#7d5531,0_3px_0_0_rgba(0,0,0,0.4)]"
                style={leftPct > 60 ? { right: `${100 - leftPct + 2}%` } : { left: `${leftPct + 2}%` }}
              >
                <div className="font-semibold text-cream">{fmtDate(hp.date, "EEE, MMM d yyyy")}</div>
                <div className="mt-1 flex justify-between gap-4 text-muted">
                  Day <span className={pnlClass(hp.day)}>{formatPnl(hp.day)}</span>
                </div>
                <div className="flex justify-between gap-4 text-muted">
                  Total <span className={clsx("font-semibold", pnlClass(hp.pnl))}>{formatPnl(hp.pnl)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="ml-14 mt-2 flex justify-between text-[10px] text-muted">
        <span>{fmtDate(points[0].date)}</span>
        {points.length > 2 && <span>{fmtDate(points[Math.floor((points.length - 1) / 2)].date)}</span>}
        <span>{fmtDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
