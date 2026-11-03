"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Calculator, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import type { Direction, Emotion, Trade } from "@/lib/types";
import { formatPnl, pnlClass, toDateKey } from "@/lib/format";
import { createTrade, updateTrade } from "@/app/(app)/journal/actions";
import { POINT_VALUES, guessPointValue } from "./constants";
import { EmotionPicker, MultiPlotPicker, PlotPicker, StarRating } from "./FormBits";
import { ScreenshotUploader, uploadPendingShots, type ShotItem } from "./ScreenshotUploader";
import { tileClass } from "./styles";
import type { GalleryImage } from "./ScreenshotGallery";
import type { PlotAccount } from "./normalize";

const QUICK_POINT_VALUES = [
  { symbol: "Stock", label: "Stock · $1", value: 1 },
  ...["ES", "NQ", "MES", "MNQ", "CL", "GC"].map((sym) => POINT_VALUES.find((p) => p.symbol === sym)!),
];

const str = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
const parse = (s: string): number | null => {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface TradeFormProps {
  userId: string;
  accounts: PlotAccount[];
  trade?: Trade; // present when editing
  initialShots?: GalleryImage[];
  defaultAccountId?: string | null;
  defaultDate?: string | null;
  suggestions: { symbols: string[] };
}

export function TradeForm({
  userId,
  accounts,
  trade,
  initialShots = [],
  defaultAccountId,
  defaultDate,
  suggestions,
}: TradeFormProps) {
  const editing = !!trade;

  // editing a trade keeps its single plot; a new trade can be copied across several plots
  const [accountId, setAccountId] = useState<string | null>(trade?.account_id ?? null);
  const [accountIds, setAccountIds] = useState<string[]>(() =>
    defaultAccountId && accounts.some((a) => a.id === defaultAccountId)
      ? [defaultAccountId]
      : accounts.length === 1
        ? [accounts[0].id]
        : [],
  );
  const [symbol, setSymbol] = useState(trade?.symbol ?? "");
  const [direction, setDirection] = useState<Direction>(trade?.direction ?? "long");
  const [quantity, setQuantity] = useState(str(trade?.quantity) || (editing ? "" : "1"));
  const [entry, setEntry] = useState(str(trade?.entry_price));
  const [exit, setExit] = useState(str(trade?.exit_price));
  const [pnl, setPnl] = useState(trade ? str(trade.pnl) : "");
  const [fees, setFees] = useState(trade && trade.fees ? str(trade.fees) : "");
  const [rMultiple, setRMultiple] = useState(str(trade?.r_multiple));
  const [pointValue, setPointValue] = useState<string | null>(null); // null = auto from symbol
  const [tradeDate, setTradeDate] = useState(trade?.trade_date ?? defaultDate ?? toDateKey());
  const [emotion, setEmotion] = useState<Emotion | null>(trade?.emotion ?? null);
  const [rating, setRating] = useState<number | null>(trade?.rating ?? null);
  const [followedPlan, setFollowedPlan] = useState<boolean | null>(trade?.followed_plan ?? null);
  const [notes, setNotes] = useState(trade?.notes ?? "");
  const [shots, setShots] = useState<ShotItem[]>(() =>
    initialShots.map((s) => ({ key: s.path, path: s.path, url: s.url ?? undefined })),
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const busy = pending || uploading;

  const selectedIds = editing ? (accountId ? [accountId] : []) : accountIds;
  const firstPlot = accounts.find((a) => a.id === selectedIds[0]);
  const effectivePointValue = pointValue ?? String(guessPointValue(symbol));
  const dirSign = direction === "long" ? 1 : -1;

  const autoPnl = useMemo(() => {
    const e = parse(entry),
      x = parse(exit),
      q = parse(quantity),
      pv = parse(effectivePointValue) ?? 1;
    if (e === null || x === null || q === null) return null;
    return round2((x - e) * q * dirSign * pv - (parse(fees) ?? 0));
  }, [entry, exit, quantity, effectivePointValue, dirSign, fees]);


  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (selectedIds.length === 0) return setError("Pick at least one plot this trade waters.");
    if (!symbol.trim()) return setError("Symbol is required.");
    if (parse(pnl) === null) return setError("Net P&L is required — try the auto-calc helper.");

    startTransition(async () => {
      let uploaded = shots;
      try {
        if (shots.some((s) => !s.path)) {
          setUploading(true);
          uploaded = await uploadPendingShots(shots, userId);
          setShots(uploaded);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Screenshot upload failed.");
        return;
      } finally {
        setUploading(false);
      }

      const input = {
        symbol: symbol.trim().toUpperCase(),
        direction,
        quantity: parse(quantity),
        entry_price: parse(entry),
        exit_price: parse(exit),
        pnl: parse(pnl) ?? 0,
        fees: parse(fees) ?? 0,
        r_multiple: parse(rMultiple),
        trade_date: tradeDate,
        emotion,
        rating,
        followed_plan: followedPlan,
        notes: notes.trim() || null,
        screenshots: uploaded.map((s) => s.path!).filter(Boolean),
      };
      const res = editing
        ? await updateTrade(trade!.id, { ...input, account_id: accountId! })
        : await createTrade({ ...input, account_ids: accountIds });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* ── plot ── */}
      <section className="panel p-4 sm:p-5">
        <h2 className="mb-3 font-display text-lg">{editing ? "Which plot are you watering?" : "Which plots are you watering?"}</h2>
        {editing ? (
          <PlotPicker accounts={accounts} value={accountId} onChange={setAccountId} />
        ) : (
          <MultiPlotPicker accounts={accounts} value={accountIds} onChange={setAccountIds} />
        )}
      </section>

      {/* ── the trade ── */}
      <section className="panel space-y-4 p-4 sm:p-5">
        <h2 className="font-display text-lg">The trade</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="symbol">Symbol *</label>
            <input
              id="symbol"
              className="input font-mono uppercase"
              list="tt-symbols"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="NQ, ES, AAPL…"
              autoComplete="off"
              required
            />
            <datalist id="tt-symbols">
              {suggestions.symbols.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="label">Direction</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["long", "short"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={direction === d}
                  onClick={() => setDirection(d)}
                  className={clsx(
                    "flex items-center justify-center gap-1 rounded-sm py-2 text-sm font-semibold",
                    tileClass(direction === d),
                    direction === d && (d === "long" ? "!text-gain" : "!bg-[#5a2418] !text-loss !shadow-[inset_0_0_0_2px_var(--loss)]"),
                  )}
                >
                  {d === "long" ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  {d === "long" ? "Long" : "Short"}
                </button>
              ))}
            </div>
          </div>
          <Field label="Quantity" id="qty" value={quantity} onChange={setQuantity} step="any" />
          <div>
            <label className="label" htmlFor="date">Trade date</label>
            <input id="date" type="date" className="input" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required />
          </div>
          <Field label="Entry" id="entry" value={entry} onChange={setEntry} />
          <Field label="Exit" id="exit" value={exit} onChange={setExit} />
        </div>
      </section>

      {/* ── result ── */}
      <section className="panel space-y-4 p-4 sm:p-5">
        <h2 className="font-display text-lg">The result</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="pnl">Net P&amp;L ($) *</label>
            <input
              id="pnl"
              type="number"
              step="any"
              inputMode="decimal"
              className={clsx(
                "input font-mono text-base font-semibold",
                (parse(pnl) ?? 0) > 0 ? "!text-[#3d7212]" : (parse(pnl) ?? 0) < 0 ? "!text-[#b0321f]" : "",
              )}
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              placeholder="e.g. 425 or -180"
              required
            />
          </div>
          <Field label="Fees ($)" id="fees" value={fees} onChange={setFees} />
          <div>
            <label className="label" htmlFor="r">R-multiple</label>
            <input
              id="r"
              type="number"
              step="any"
              className="input font-mono"
              value={rMultiple}
              onChange={(e) => setRMultiple(e.target.value)}
              placeholder="optional"
            />
          </div>
        </div>

        <div className="rounded-md border-[3px] border-outline bg-soil/60 p-3 shadow-[inset_0_3px_0_0_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center gap-2">
            <Calculator size={16} className="text-leaf" />
            <span className="text-sm font-semibold">Auto-calc helper</span>
            <span className="text-xs text-muted">(exit − entry) × qty × direction × point value − fees</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {QUICK_POINT_VALUES.map((p) => (
              <button
                key={p.symbol}
                type="button"
                onClick={() => setPointValue(String(p.value))}
                className={clsx(
                  "chip transition",
                  effectivePointValue === String(p.value) ? "!bg-[#3f5a20] text-leaf !shadow-[inset_0_0_0_1px_var(--leaf)]" : "text-muted hover:text-cream",
                )}
              >
                {p.label}
              </button>
            ))}
            <label className="ml-1 flex items-center gap-1 text-xs text-muted">
              $/pt
              <input
                type="number"
                step="any"
                min="0"
                className="input !w-24 !px-2 !py-1 font-mono"
                value={effectivePointValue}
                onChange={(e) => setPointValue(e.target.value)}
                aria-label="Point value"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">
              Calculated:{" "}
              {autoPnl === null ? (
                <span className="italic">fill in entry, exit and quantity</span>
              ) : (
                <span className={clsx("font-mono font-semibold", pnlClass(autoPnl))}>{formatPnl(autoPnl)}</span>
              )}
            </span>
            <button
              type="button"
              className="btn-ghost !py-1.5"
              disabled={autoPnl === null}
              onClick={() => autoPnl !== null && setPnl(String(autoPnl))}
            >
              Use it
            </button>
          </div>
        </div>
      </section>

      {/* ── psychology ── */}
      <section className="panel space-y-4 p-4 sm:p-5">
        <h2 className="font-display text-lg">Head space</h2>
        <div>
          <span className="label">How were you feeling?</span>
          <EmotionPicker value={emotion} onChange={setEmotion} />
        </div>
        <div className="flex flex-wrap gap-8">
          <div>
            <span className="label">Execution</span>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <span className="label">Followed the plan?</span>
            <div className="flex gap-1">
              {[
                { v: true, label: "Yes 👍" },
                { v: false, label: "No 👎" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  aria-pressed={followedPlan === o.v}
                  onClick={() => setFollowedPlan(followedPlan === o.v ? null : o.v)}
                  className={clsx(
                    "rounded-sm px-3 py-1.5 text-sm",
                    tileClass(followedPlan === o.v),
                    followedPlan === o.v && !o.v && "!bg-[#5a2418] !text-loss !shadow-[inset_0_0_0_2px_var(--loss)]",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── notes & screenshots ── */}
      <section className="panel space-y-4 p-4 sm:p-5">
        <h2 className="font-display text-lg">Notes &amp; screenshots</h2>
        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            rows={5}
            className="input resize-y"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why did you take it? What did you see? What would you do differently?"
          />
        </div>
        <ScreenshotUploader items={shots} onChange={setShots} disabled={busy} />
      </section>

      {/* ── submit ── */}
      <div className="panel sticky bottom-3 z-10 flex flex-wrap items-center justify-end gap-3 p-3">
        {error && <p className="mr-auto text-sm text-loss">{error}</p>}
        <Link href={editing ? `/journal/trades/${trade!.id}` : "/journal"} className="btn-ghost">
          Cancel
        </Link>
        <button type="submit" className="btn-primary min-w-44" disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {uploading ? "Uploading…" : "Saving…"}
            </>
          ) : editing ? (
            "Save changes"
          ) : (
            <>
              {selectedIds.length > 1
                ? `Water ${selectedIds.length} plots 💧`
                : `Water ${firstPlot?.plot_name ?? "your plot"} 💧`}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  step = "any",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        step={step}
        inputMode="decimal"
        className="input font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
