import Link from "next/link";
import clsx from "clsx";
import { formatPnl, pnlClass } from "@/lib/format";
import type { TradeStats } from "./normalize";

export function StatsBar({ stats }: { stats: TradeStats }) {
  const pf = stats.profitFactor;
  const tiles: { label: string; value: React.ReactNode; hint?: React.ReactNode; className?: string }[] = [
    {
      label: "Net P&L",
      value: formatPnl(stats.net),
      className: clsx(pnlClass(stats.net), "text-xl xl:text-2xl"),
      hint: `${stats.count} trade${stats.count === 1 ? "" : "s"}`,
    },
    {
      label: "Win rate",
      value: stats.wins + stats.losses ? `${Math.round(stats.winRate * 100)}%` : "—",
      hint: `${stats.wins}W · ${stats.losses}L`,
    },
    {
      label: "Profit factor",
      value: pf === null ? (stats.grossWin > 0 ? "∞" : "—") : pf.toFixed(2),
      className: pf !== null ? (pf >= 1 ? "text-gain" : "text-loss") : undefined,
    },
    { label: "Avg win", value: stats.wins ? formatPnl(stats.avgWin) : "—", className: "text-gain" },
    { label: "Avg loss", value: stats.losses ? formatPnl(stats.avgLoss) : "—", className: "text-loss" },
    {
      label: "Best trade",
      value: stats.best ? (
        <Link href={`/journal/trades/${stats.best.id}`} className="hover:underline">
          {formatPnl(stats.best.pnl)}
        </Link>
      ) : (
        "—"
      ),
      className: stats.best ? pnlClass(stats.best.pnl) : undefined,
      hint: stats.best?.symbol,
    },
    {
      label: "Worst trade",
      value: stats.worst ? (
        <Link href={`/journal/trades/${stats.worst.id}`} className="hover:underline">
          {formatPnl(stats.worst.pnl)}
        </Link>
      ) : (
        "—"
      ),
      className: stats.worst ? pnlClass(stats.worst.pnl) : undefined,
      hint: stats.worst?.symbol,
    },
  ];

  return (
    <section className="panel grid grid-cols-2 gap-2 p-2 sm:grid-cols-4 lg:grid-cols-7">
      {tiles.map((t, i) => (
        <div key={t.label} className={clsx(
            "min-w-0 rounded-sm border-2 border-outline bg-soil/60 p-3 shadow-[inset_0_3px_0_0_rgba(0,0,0,0.35)]",
            i === 0 && "col-span-2 sm:col-span-1",
          )}>
          <p className="label !mb-1">{t.label}</p>
          <p className={clsx("truncate font-mono text-lg font-semibold", t.className)}>{t.value}</p>
          {t.hint && <p className="mt-0.5 truncate text-xs text-muted">{t.hint}</p>}
        </div>
      ))}
    </section>
  );
}
