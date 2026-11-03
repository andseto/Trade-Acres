"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { BookOpen, ChevronLeft, ChevronRight, NotebookPen, Plus, TrendingDown, TrendingUp, X } from "lucide-react";
import { formatCompactMoney, formatPnl, pnlClass, toDateKey } from "@/lib/format";
import { CropSprite } from "@/components/farm/CropSprite";
import { PlotIcon } from "@/components/journal/PlotIcon";
import type { CropId } from "@/lib/types";
import { MOOD_BY_ID } from "@/components/journal/constants";
import { useHydrated } from "@/components/journal/FormBits";
import type { PlotAccount } from "@/components/journal/normalize";
import type { CalEntry, CalTrade, DayStat } from "./types";
import { dryBg, grassBg, soilBg, tileLevel, tileStyle, type TileLevel } from "./tiles";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Compact P&L for small cells: +$1.2K */
function compactPnl(n: number) {
  if (Math.abs(n) < 1000) {
    const r = Math.round(n);
    return r === 0 ? "$0" : `${r > 0 ? "+" : "-"}$${Math.abs(r)}`;
  }
  return (n > 0 ? "+" : "-") + formatCompactMoney(Math.abs(n));
}

export function CalendarView({
  month,
  trades,
  entries,
  plots,
  account,
}: {
  month: string; // YYYY-MM
  trades: CalTrade[];
  entries: CalEntry[];
  plots: PlotAccount[];
  account: string;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const today = hydrated ? toDateKey() : "";
  const [selected, setSelected] = useState<string | null>(null);

  const monthStart = parseISO(`${month}-01`);
  const prev = format(addMonths(monthStart, -1), "yyyy-MM");
  const next = format(addMonths(monthStart, 1), "yyyy-MM");
  const qs = (m: string | null) => {
    const p = new URLSearchParams();
    if (m) p.set("month", m);
    if (account) p.set("account", account);
    const s = p.toString();
    return s ? `/calendar?${s}` : "/calendar";
  };

  const days = useMemo(() => {
    const map = new Map<string, DayStat>();
    const get = (d: string) => {
      let s = map.get(d);
      if (!s) {
        s = { date: d, net: 0, count: 0, trades: [], entries: [] };
        map.set(d, s);
      }
      return s;
    };
    for (const t of trades) {
      const s = get(t.trade_date);
      s.net += t.pnl;
      s.count++;
      s.trades.push(t);
    }
    for (const e of entries) get(e.entry_date).entries.push(e);
    return map;
  }, [trades, entries]);

  // grid: Monday-first weeks covering the month
  const weeks = (() => {
    const start = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
    const out: string[][] = [];
    for (let d = start; d <= end; d = addDays(d, 7)) {
      out.push(Array.from({ length: 7 }, (_, i) => toDateKey(addDays(d, i))));
    }
    return out;
  })();

  const inMonth = (d: string) => d.startsWith(month);
  const monthDays = [...days.values()].filter((d) => inMonth(d.date) && d.count > 0);
  const maxAbs = Math.max(1, ...monthDays.map((d) => Math.abs(d.net)));
  const summary = (() => {
    const net = monthDays.reduce((s, d) => s + d.net, 0);
    const green = monthDays.filter((d) => d.net > 0);
    const red = monthDays.filter((d) => d.net < 0);
    const best = monthDays.reduce<DayStat | null>((b, d) => (!b || d.net > b.net ? d : b), null);
    const worst = monthDays.reduce<DayStat | null>((w, d) => (!w || d.net < w.net ? d : w), null);
    return {
      net,
      green: green.length,
      red: red.length,
      winPct: green.length + red.length ? Math.round((green.length / (green.length + red.length)) * 100) : null,
      best,
      worst,
      trades: monthDays.reduce((s, d) => s + d.count, 0),
      journaled: [...days.values()].filter((d) => inMonth(d.date) && d.entries.length > 0).length,
    };
  })();

  const plotById = useMemo(() => new Map(plots.map((p) => [p.id, p])), [plots]);
  // sprout on the best days: the filtered plot's crop, or wheat for the whole farm
  const sproutCrop: CropId = (account && plotById.get(account)?.crop) || "wheat";
  const selectedDay = selected ? (days.get(selected) ?? { date: selected, net: 0, count: 0, trades: [], entries: [] }) : null;

  return (
    <div>
      {/* ── toolbar ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Link href={qs(prev)} className="btn-ghost !px-2.5" aria-label="Previous month">
            <ChevronLeft size={18} />
          </Link>
          <h2 className="min-w-44 text-center font-display text-2xl">{format(monthStart, "MMMM yyyy")}</h2>
          <Link href={qs(next)} className="btn-ghost !px-2.5" aria-label="Next month">
            <ChevronRight size={18} />
          </Link>
        </div>
        <Link href={qs(null)} className="btn-ghost !py-2">
          Today
        </Link>
        <select
          aria-label="Filter by plot"
          className="input ml-auto !w-auto min-w-48"
          value={account}
          onChange={(e) => {
            const p = new URLSearchParams();
            p.set("month", month);
            if (e.target.value) p.set("account", e.target.value);
            router.push(`/calendar?${p.toString()}`);
          }}
        >
          <option value="">All plots</option>
          {plots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.plot_name} · {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── month summary ── */}
      <section className="panel mb-4 grid grid-cols-2 gap-2 p-2 sm:grid-cols-4 lg:grid-cols-7">
        <SummaryTile label="Net P&L" value={formatPnl(summary.net)} className={clsx(pnlClass(summary.net), "text-xl")} />
        <SummaryTile label="Green days" value={String(summary.green)} className="text-gain" />
        <SummaryTile label="Red days" value={String(summary.red)} className="text-loss" />
        <SummaryTile label="Win-day %" value={summary.winPct === null ? "—" : `${summary.winPct}%`} />
        <SummaryTile
          label="Best day"
          value={summary.best && summary.best.net > 0 ? formatPnl(summary.best.net) : "—"}
          hint={summary.best && summary.best.net > 0 ? format(parseISO(summary.best.date), "EEE MMM d") : undefined}
          className="text-gain"
          onClick={summary.best && summary.best.net > 0 ? () => setSelected(summary.best!.date) : undefined}
        />
        <SummaryTile
          label="Worst day"
          value={summary.worst && summary.worst.net < 0 ? formatPnl(summary.worst.net) : "—"}
          hint={summary.worst && summary.worst.net < 0 ? format(parseISO(summary.worst.date), "EEE MMM d") : undefined}
          className="text-loss"
          onClick={summary.worst && summary.worst.net < 0 ? () => setSelected(summary.worst!.date) : undefined}
        />
        <SummaryTile label="Trades" value={String(summary.trades)} hint={`${summary.journaled} journaled day${summary.journaled === 1 ? "" : "s"}`} />
      </section>

      {/* ── grid ── */}
      <section className="panel p-1.5 sm:p-3">
        <div className="grid grid-cols-7 gap-1 sm:grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,0.9fr)] sm:gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center font-display text-[11px] uppercase tracking-wider text-muted sm:text-[13px]">
              {d}
            </div>
          ))}
          <div className="hidden py-1 text-center font-display text-[13px] uppercase tracking-wider text-muted sm:block">Week</div>

          {weeks.map((week, wi) => {
            const wDays = week.filter(inMonth).map((d) => days.get(d)).filter((d): d is DayStat => !!d);
            const wNet = wDays.reduce((s, d) => s + d.net, 0);
            const wCount = wDays.reduce((s, d) => s + d.count, 0);
            return (
              <WeekRow key={wi}>
                {week.map((d) => (
                  <DayCell
                    key={d}
                    date={d}
                    stat={days.get(d)}
                    inMonth={inMonth(d)}
                    isToday={d === today}
                    isSelected={d === selected}
                    maxAbs={maxAbs}
                    sproutCrop={sproutCrop}
                    onClick={() => setSelected(d)}
                  />
                ))}
                <div className="col-span-7 mb-1 flex items-center justify-between rounded-sm border-2 border-outline bg-wood px-2 py-1 text-xs shadow-[inset_0_2px_0_0_#7d5531,inset_0_-3px_0_0_#3d2714] sm:col-span-1 sm:mb-0 sm:flex-col sm:justify-center sm:gap-0.5 sm:px-1 sm:py-2">
                  <span className="font-display text-muted sm:hidden">Week {wi + 1}</span>
                  <span className={clsx("font-mono font-semibold sm:text-sm", wCount ? pnlClass(wNet) : "text-muted")}>
                    {wCount ? compactPnl(wNet) : "—"}
                  </span>
                  {wCount > 0 && <span className="text-[10px] text-muted">{wCount} trade{wCount === 1 ? "" : "s"}</span>}
                </div>
              </WeekRow>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <LegendRamp make={grassBg} /> green day
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LegendRamp make={dryBg} /> red day
          </span>
          <span>lusher / drier = bigger day</span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden>📓</span> journaled
          </span>
          <span className="ml-auto hidden sm:inline">Click a day for details</span>
        </div>
      </section>

      <DayPanel
        day={selectedDay}
        plotById={plotById}
        account={account}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

/** sunken slot inside a wooden panel */
const SLOT = "min-w-0 rounded-sm border-2 border-outline bg-soil/60 p-3 shadow-[inset_0_3px_0_0_rgba(0,0,0,0.35)]";

function LegendRamp({ make }: { make: (l: TileLevel) => string }) {
  return (
    <span className="inline-flex border-2 border-outline" aria-hidden>
      {([1, 2, 3, 4] as const).map((l) => (
        <span key={l} className="h-3.5 w-3.5" style={tileStyle(make(l), 28)} />
      ))}
    </span>
  );
}

function WeekRow({ children }: { children: React.ReactNode }) {
  // `contents` keeps cells on the parent grid while grouping them semantically
  return <div className="contents">{children}</div>;
}

function SummaryTile({
  label,
  value,
  hint,
  className,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <p className="label !mb-1">{label}</p>
      <p className={clsx("font-mono text-lg font-semibold", className)}>{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={clsx(SLOT, "text-left transition-colors hover:bg-soil/90")}>
      {body}
    </button>
  ) : (
    <div className={SLOT}>{body}</div>
  );
}

function DayCell({
  date,
  stat,
  inMonth,
  isToday,
  isSelected,
  maxAbs,
  sproutCrop,
  onClick,
}: {
  date: string;
  stat?: DayStat;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  maxAbs: number;
  sproutCrop: CropId;
  onClick: () => void;
}) {
  const hasTrades = !!stat && stat.count > 0;
  const net = stat?.net ?? 0;
  const level = tileLevel(Math.abs(net), maxAbs);
  const green = inMonth && hasTrades && net > 0;
  const red = inMonth && hasTrades && net < 0;
  const bg = green ? grassBg(level) : red ? dryBg(level) : soilBg(!inMonth);
  const dayNum = Number(date.slice(8));
  const journaled = !!stat && stat.entries.length > 0;
  const label = `${format(parseISO(date), "EEEE MMMM d")}: ${hasTrades ? `${formatPnl(net)} over ${stat!.count} trades` : "no trades"}${journaled ? ", journaled" : ""}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={tileStyle(bg)}
      className={clsx(
        "group relative flex aspect-square min-w-0 flex-col overflow-hidden rounded-sm border-2 border-outline p-1 text-left transition-[filter] sm:aspect-auto sm:min-h-24 sm:p-1.5",
        "shadow-[inset_0_2px_0_0_rgba(255,240,200,0.12),inset_0_-3px_0_0_rgba(0,0,0,0.3)]",
        inMonth ? "hover:brightness-110" : "opacity-45 hover:opacity-70",
        isSelected && "outline outline-[3px] outline-offset-0 outline-leaf",
        !isSelected && isToday && "outline outline-[3px] outline-offset-0 outline-gold",
      )}
    >
      {green && level >= 3 && (
        <CropSprite
          crop={sproutCrop}
          stage={level === 4 ? "young" : "sprout"}
          size={32}
          className="pointer-events-none absolute bottom-0.5 right-0.5 hidden sm:block"
        />
      )}
      <span className="relative flex items-center justify-between gap-1">
        <span
          className={clsx(
            "font-display text-[11px] leading-none sm:text-[13px]",
            isToday
              ? "rounded-xs bg-gold px-1 py-0.5 text-[#2b1a0e]"
              : clsx("[text-shadow:1px_1px_0_var(--outline)]", inMonth ? "text-cream" : "text-muted"),
          )}
        >
          {dayNum}
        </span>
        {journaled && (
          <span className="text-[10px] leading-none drop-shadow-[1px_1px_0_var(--outline)] sm:text-sm" aria-hidden>
            📓
          </span>
        )}
      </span>
      {hasTrades && inMonth && (
        <span className="relative mt-auto min-w-0 max-w-full self-start">
          <span
            className={clsx(
              "block max-w-full truncate rounded-xs bg-outline/75 px-1 font-mono text-[10px] font-semibold leading-tight sm:text-xs",
              net > 0 ? "text-gain" : net < 0 ? "text-[#ff8a74]" : "text-muted",
            )}
          >
            {compactPnl(net)}
          </span>
          <span className="hidden text-[10px] text-cream [text-shadow:1px_1px_0_var(--outline)] sm:block">
            {stat!.count} trade{stat!.count === 1 ? "" : "s"}
          </span>
        </span>
      )}
    </button>
  );
}

function DayPanel({
  day,
  plotById,
  account,
  onClose,
}: {
  day: DayStat | null;
  plotById: Map<string, PlotAccount>;
  account: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!day) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [day, onClose]);

  const acct = account ? `&account=${account}` : "";

  return (
    <AnimatePresence>
      {day && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-50 bg-outline/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${day.date}`}
            className="panel fixed inset-y-0 right-0 z-50 flex w-full flex-col !rounded-none sm:max-w-md"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <header className="flex items-start justify-between gap-3 border-b-[3px] border-outline p-5">
              <div>
                <p className="font-display text-xs uppercase tracking-wider text-muted">{format(parseISO(day.date), "EEEE")}</p>
                <h3 className="font-display text-2xl">{format(parseISO(day.date), "MMMM d, yyyy")}</h3>
                {day.count > 0 && (
                  <p className="mt-1 text-sm text-muted">
                    <span className={clsx("font-mono font-semibold", pnlClass(day.net))}>{formatPnl(day.net)}</span> ·{" "}
                    {day.count} trade{day.count === 1 ? "" : "s"}
                  </p>
                )}
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost !p-2">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <div>
                <h4 className="label">Trades</h4>
                {day.trades.length === 0 ? (
                  <p className="text-sm text-muted">No trades this day. A quiet day in the fields.</p>
                ) : (
                  <ul className="space-y-2">
                    {day.trades.map((t) => {
                      const f = plotById.get(t.account_id);
                      return (
                        <li key={t.id}>
                          <Link
                            href={`/journal/trades/${t.id}`}
                            className={clsx(SLOT, "flex items-center gap-3 transition-colors hover:bg-soil/90")}
                          >
                            {f ? <PlotIcon plot={f} size={32} className="shrink-0" /> : <span aria-hidden>🌱</span>}
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 font-mono font-semibold">
                                {t.symbol}
                                {t.direction === "long" ? (
                                  <TrendingUp size={13} className="text-gain" />
                                ) : (
                                  <TrendingDown size={13} className="text-loss" />
                                )}
                              </span>
                              <span className="block truncate text-xs text-muted">
                                {f?.plot_name}
                                {t.setup ? ` · ${t.setup}` : ""}
                              </span>
                            </span>
                            <span className={clsx("font-mono font-semibold", pnlClass(t.pnl))}>{formatPnl(t.pnl)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="label">Journal</h4>
                {day.entries.length === 0 ? (
                  <p className="text-sm text-muted">No journal entry yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {day.entries.map((e) => {
                      const mood = e.mood ? MOOD_BY_ID[e.mood] : null;
                      const f = e.account_id ? plotById.get(e.account_id) : null;
                      return (
                        <li key={e.id}>
                          <Link
                            href={`/journal/entries/${e.id}`}
                            className={clsx(SLOT, "flex items-center gap-3 transition-colors hover:bg-soil/90")}
                          >
                            <span className="text-2xl">{mood?.emoji ?? "📓"}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">{e.title || "Daily journal"}</span>
                              <span className="block truncate text-xs text-muted">{f ? f.plot_name : "All my plots"}</span>
                            </span>
                            <BookOpen size={16} className="text-gold" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <footer className="grid gap-2 border-t-[3px] border-outline p-4">
              <Link href={`/journal/new?date=${day.date}${acct}`} className="btn-primary">
                <Plus size={16} /> Log trade for this day
              </Link>
              <Link href={`/journal/entries/new?date=${day.date}${acct}`} className="btn-ghost">
                <NotebookPen size={16} /> Journal day
              </Link>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
