import Link from "next/link";
import clsx from "clsx";
import { Image as ImageIcon, TrendingDown, TrendingUp } from "lucide-react";
import { formatPnl, pnlClass } from "@/lib/format";
import type { JournalEntry, Trade } from "@/lib/types";
import { PlotIcon } from "./PlotIcon";
import { EMOTION_BY_ID, MOOD_BY_ID } from "./constants";
import { StarRating } from "./FormBits";
import type { PlotAccount } from "./normalize";

export function TradeCard({ trade, plot }: { trade: Trade; plot?: PlotAccount }) {
  const emotion = trade.emotion ? EMOTION_BY_ID[trade.emotion] : null;
  return (
    <Link
      href={`/journal/trades/${trade.id}`}
      className={clsx(
        "panel group relative flex items-center gap-3 overflow-hidden p-3 pl-5 transition-transform hover:-translate-y-0.5 sm:gap-4 sm:p-4 sm:pl-6",
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "absolute inset-y-0 left-0 w-2 border-r-2 border-outline",
          trade.pnl > 0 ? "bg-gain" : trade.pnl < 0 ? "bg-loss" : "bg-plank",
        )}
      />
      <div className="hidden shrink-0 sm:block" title={plot ? `${plot.plot_name} · ${plot.name}` : undefined}>
        {plot ? <PlotIcon plot={plot} size={44} /> : <span className="text-2xl">🌱</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-base font-semibold">{trade.symbol}</span>
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 text-xs font-semibold uppercase",
              trade.direction === "long" ? "text-gain" : "text-loss",
            )}
          >
            {trade.direction === "long" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trade.direction}
          </span>
          {trade.setup && <span className="chip text-muted">{trade.setup}</span>}
          {emotion && (
            <span title={emotion.label} className="text-base leading-none">
              {emotion.emoji}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {plot && <span className="truncate">{plot.plot_name}</span>}
          {trade.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-leaf">
              #{t}
            </span>
          ))}
          {trade.rating ? <StarRating value={trade.rating} size={11} /> : null}
          {trade.screenshots.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ImageIcon size={12} /> {trade.screenshots.length}
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={clsx("font-mono text-base font-semibold sm:text-lg", pnlClass(trade.pnl))}>{formatPnl(trade.pnl)}</p>
        {trade.r_multiple !== null && <p className={clsx("font-mono text-xs", pnlClass(trade.r_multiple))}>{trade.r_multiple}R</p>}
      </div>
    </Link>
  );
}

export function EntryCard({ entry, plot }: { entry: JournalEntry; plot?: PlotAccount }) {
  const mood = entry.mood ? MOOD_BY_ID[entry.mood] : null;
  const preview = entry.body || entry.lessons || "";
  return (
    <Link
      href={`/journal/entries/${entry.id}`}
      className="panel group relative flex gap-3 overflow-hidden p-3 pl-5 transition-transform hover:-translate-y-0.5 sm:gap-4 sm:p-4 sm:pl-6"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-2 border-r-2 border-outline bg-gold" />
      <span className="shrink-0 text-3xl leading-none" title={mood?.label}>
        {mood?.emoji ?? "📓"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{entry.title || "Daily journal"}</span>
          <span className="chip text-gold">📓 Journal</span>
        </div>
        {preview && <p className="mt-1 line-clamp-2 text-sm text-muted">{preview}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>{plot ? plot.plot_name : "All my plots"}</span>
          {entry.screenshots.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ImageIcon size={12} /> {entry.screenshots.length}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
