import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { BookOpen, Filter, NotebookPen, Plus } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { formatPnl, pnlClass } from "@/lib/format";
import type { JournalEntry, Trade } from "@/lib/types";
import { PageHeader } from "@/components/journal/PageHeader";
import { StatsBar } from "@/components/journal/StatsBar";
import { EntryCard, TradeCard } from "@/components/journal/FeedItems";
import { PAGE_SIZE } from "@/components/journal/constants";
import { tileClass } from "@/components/journal/styles";
import { PlotPreview } from "@/components/farm/PlotPreview";
import { computeStats, normalizeEntry, normalizeTrade } from "@/components/journal/normalize";
import { isDateKey, isUuid, loadPlots, loadSuggestions, sp, type SearchParams } from "@/components/journal/server";

export const metadata: Metadata = { title: "Journal · Trade Acres" };

type View = "all" | "trades" | "entries";

interface Filters {
  account: string;
  from: string;
  to: string;
  result: "" | "win" | "loss";
  setup: string;
  tag: string;
  symbol: string;
}

export default async function JournalPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();

  const rawResult = sp(params.result);
  const f: Filters = {
    account: isUuid(sp(params.account)) ? sp(params.account) : "",
    from: isDateKey(sp(params.from)) ? sp(params.from) : "",
    to: isDateKey(sp(params.to)) ? sp(params.to) : "",
    result: rawResult === "win" || rawResult === "loss" ? rawResult : "",
    setup: sp(params.setup).trim(),
    tag: sp(params.tag).trim().toLowerCase(),
    symbol: sp(params.symbol).trim().toUpperCase(),
  };
  const rawView = sp(params.view);
  const view: View = rawView === "trades" || rawView === "entries" ? rawView : "all";
  const limit = Math.min(500, Math.max(PAGE_SIZE, Number(sp(params.limit)) || PAGE_SIZE));
  const tradeOnlyFilters = !!(f.result || f.setup || f.tag || f.symbol);
  const showEntries = view === "entries" || (view === "all" && !tradeOnlyFilters);
  const showTrades = view !== "entries";

  // one builder so stats and list always share the same filters
  const filteredTrades = (columns: string) => {
    let q = supabase.from("trades").select(columns).eq("user_id", user.id);
    if (f.account) q = q.eq("account_id", f.account);
    if (f.from) q = q.gte("trade_date", f.from);
    if (f.to) q = q.lte("trade_date", f.to);
    if (f.result === "win") q = q.gt("pnl", 0);
    if (f.result === "loss") q = q.lt("pnl", 0);
    if (f.setup) q = q.eq("setup", f.setup);
    if (f.tag) q = q.contains("tags", [f.tag]);
    if (f.symbol) q = q.eq("symbol", f.symbol);
    return q;
  };

  // stats over the whole filtered set (lightweight columns)
  const statsQuery = filteredTrades("id, symbol, pnl, trade_date").limit(10000);

  const tradesQuery = showTrades
    ? filteredTrades("*")
        .order("trade_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit + 1)
    : null;

  let entriesQuery = showEntries
    ? supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit + 1)
    : null;
  if (entriesQuery) {
    if (f.account) entriesQuery = entriesQuery.or(`account_id.eq.${f.account},account_id.is.null`);
    if (f.from) entriesQuery = entriesQuery.gte("entry_date", f.from);
    if (f.to) entriesQuery = entriesQuery.lte("entry_date", f.to);
  }

  const [statsRes, tradesRes, entriesRes, plotList, suggestions] = await Promise.all([
    statsQuery,
    tradesQuery ?? Promise.resolve({ data: [] }),
    entriesQuery ?? Promise.resolve({ data: [] }),
    loadPlots(supabase, user.id),
    loadSuggestions(supabase, user.id),
  ]);

  const stats = computeStats(
    ((statsRes.data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      symbol: String(r.symbol),
      pnl: Number(r.pnl) || 0,
      trade_date: String(r.trade_date),
    })),
  );
  const trades = ((tradesRes.data ?? []) as unknown as Record<string, unknown>[]).map(normalizeTrade);
  const entries = ((entriesRes.data ?? []) as Record<string, unknown>[]).map(normalizeEntry);
  const plotById = new Map(plotList.map((a) => [a.id, a]));

  // merge into one timeline, newest first
  type Item = { kind: "trade"; date: string; created: string; trade: Trade } | { kind: "entry"; date: string; created: string; entry: JournalEntry };
  const merged: Item[] = [
    ...trades.map((t) => ({ kind: "trade" as const, date: t.trade_date, created: t.created_at, trade: t })),
    ...entries.map((e) => ({ kind: "entry" as const, date: e.entry_date, created: e.created_at, entry: e })),
  ].sort((a, b) =>
    a.date !== b.date
      ? b.date.localeCompare(a.date)
      : a.kind !== b.kind
        ? a.kind === "entry"
          ? -1
          : 1
        : b.created.localeCompare(a.created),
  );
  const hasMore = merged.length > limit || trades.length > limit || entries.length > limit;
  const items = merged.slice(0, limit);

  const groups: { date: string; items: Item[]; net: number; tradeCount: number }[] = [];
  for (const it of items) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== it.date) {
      g = { date: it.date, items: [], net: 0, tradeCount: 0 };
      groups.push(g);
    }
    g.items.push(it);
    if (it.kind === "trade") {
      g.net += it.trade.pnl;
      g.tradeCount++;
    }
  }

  const query = (patch: Record<string, string | number | null>) => {
    const qs = new URLSearchParams();
    const base: Record<string, string> = { ...f, view: view === "all" ? "" : view };
    for (const [k, v] of Object.entries({ ...base, ...patch })) if (v !== null && v !== "") qs.set(k, String(v));
    const s = qs.toString();
    return s ? `/journal?${s}` : "/journal";
  };
  const activeFilters = Object.values(f).filter(Boolean).length;

  return (
    <div>
      <PageHeader title="Journal 📖" subtitle="Every log waters a plot. Every harvest starts with a lesson.">
        <Link href={`/journal/entries/new${f.account ? `?account=${f.account}` : ""}`} className="btn-ghost">
          <NotebookPen size={16} /> Daily journal
        </Link>
        <Link href={`/journal/new${f.account ? `?account=${f.account}` : ""}`} className="btn-primary">
          <Plus size={16} /> Log trade
        </Link>
      </PageHeader>

      <StatsBar stats={stats} />

      {/* ── filters ── */}
      <details className="panel group mt-5 p-0" open={activeFilters > 0}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold">
          <Filter size={16} className="text-leaf" /> Filters
          {activeFilters > 0 && <span className="chip text-leaf">{activeFilters} active</span>}
          <span className="ml-auto text-xs text-muted group-open:hidden">tap to open</span>
        </summary>
        <Form action="/journal" className="grid grid-cols-2 gap-3 border-t-[3px] border-outline p-4 sm:grid-cols-4 lg:grid-cols-8">
          {view !== "all" && <input type="hidden" name="view" value={view} />}
          <div className="col-span-2">
            <label className="label" htmlFor="f-account">Plot</label>
            <select id="f-account" name="account" defaultValue={f.account} className="input">
              <option value="">All plots</option>
              {plotList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.plot_name} · {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-from">From</label>
            <input id="f-from" type="date" name="from" defaultValue={f.from} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="f-to">To</label>
            <input id="f-to" type="date" name="to" defaultValue={f.to} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="f-result">Result</label>
            <select id="f-result" name="result" defaultValue={f.result} className="input">
              <option value="">Any</option>
              <option value="win">Wins 🟢</option>
              <option value="loss">Losses 🔴</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-symbol">Symbol</label>
            <input id="f-symbol" name="symbol" list="f-symbols" defaultValue={f.symbol} className="input font-mono uppercase" placeholder="Any" />
            <datalist id="f-symbols">
              {suggestions.symbols.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="f-setup">Setup</label>
            <input id="f-setup" name="setup" list="f-setups" defaultValue={f.setup} className="input" placeholder="Any" />
            <datalist id="f-setups">
              {suggestions.setups.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="f-tag">Tag</label>
            <input id="f-tag" name="tag" list="f-tags" defaultValue={f.tag} className="input" placeholder="Any" />
            <datalist id="f-tags">
              {suggestions.tags.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="col-span-2 flex items-end gap-2 sm:col-span-4 lg:col-span-8 lg:justify-end">
            <Link href={view === "all" ? "/journal" : `/journal?view=${view}`} className="btn-ghost">
              Clear
            </Link>
            <button type="submit" className="btn-primary">
              Apply filters
            </button>
          </div>
        </Form>
      </details>

      {/* ── tabs ── */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(
          [
            { id: "all", label: "Everything" },
            { id: "trades", label: "Trades" },
            { id: "entries", label: "Daily journal" },
          ] as const
        ).map((t) => (
          <Link
            key={t.id}
            href={query({ view: t.id === "all" ? null : t.id, limit: null })}
            className={clsx("rounded-sm px-4 py-2 font-display text-sm", tileClass(view === t.id))}
          >
            {t.label}
          </Link>
        ))}
        {view === "all" && tradeOnlyFilters && (
          <span className="text-xs text-muted">Daily journal entries are hidden while trade filters are on.</span>
        )}
      </div>

      {/* ── feed ── */}
      {groups.length === 0 ? (
        <div className="panel mt-4 p-10 text-center">
          <PlotPreview crop="wheat" stage="seed" state="moist" size={96} className="mx-auto" />
          <p className="mt-3 font-display text-xl">{activeFilters ? "Nothing growing here" : "Nothing planted here yet"}</p>
          <p className="mt-1 text-sm text-muted">
            {activeFilters ? "No matches for these filters." : "Log your first trade or write a daily journal to water your plots."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/journal/new" className="btn-primary">
              <Plus size={16} /> Log trade
            </Link>
            <Link href="/journal/entries/new" className="btn-ghost">
              <BookOpen size={16} /> Daily journal
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {groups.map((g) => (
            <section key={g.date}>
              <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
                <h2 className="font-display text-base text-gold">
                  <Link href={`/calendar?month=${g.date.slice(0, 7)}`} className="hover:text-leaf">
                    {format(parseISO(g.date), "EEE, MMM d, yyyy")}
                  </Link>
                </h2>
                {g.tradeCount > 0 && (
                  <span className="text-xs text-muted">
                    {g.tradeCount} trade{g.tradeCount === 1 ? "" : "s"} ·{" "}
                    <span className={clsx("font-mono font-semibold", pnlClass(g.net))}>{formatPnl(g.net)}</span>
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {g.items.map((it) =>
                  it.kind === "trade" ? (
                    <TradeCard key={`t-${it.trade.id}`} trade={it.trade} plot={plotById.get(it.trade.account_id)} />
                  ) : (
                    <EntryCard
                      key={`e-${it.entry.id}`}
                      entry={it.entry}
                      plot={it.entry.account_id ? plotById.get(it.entry.account_id) : undefined}
                    />
                  ),
                )}
              </div>
            </section>
          ))}
          {hasMore && (
            <div className="text-center">
              <Link href={query({ limit: limit + PAGE_SIZE })} scroll={false} className="btn-ghost">
                Load more
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
