import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO, endOfMonth } from "date-fns";
import { NotebookPen, Plus } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/format";
import type { Direction, Mood } from "@/lib/types";
import { PageHeader } from "@/components/journal/PageHeader";
import { isUuid, loadPlots, sp, type SearchParams } from "@/components/journal/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import { YearBars, type MonthTotal } from "@/components/calendar/YearBars";
import type { CalEntry, CalTrade } from "@/components/calendar/types";

export const metadata: Metadata = { title: "P&L Calendar · Trade Acres" };

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();

  const rawMonth = sp(params.month);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth) ? rawMonth : toDateKey().slice(0, 7);
  const account = isUuid(sp(params.account)) ? sp(params.account) : "";
  const year = Number(month.slice(0, 4));

  const monthFrom = `${month}-01`;
  const monthTo = toDateKey(endOfMonth(parseISO(monthFrom)));

  let tradesQ = supabase
    .from("trades")
    .select("id, account_id, symbol, direction, pnl, trade_date, setup")
    .eq("user_id", user.id)
    .gte("trade_date", monthFrom)
    .lte("trade_date", monthTo)
    .order("created_at", { ascending: true })
    .limit(5000);
  let entriesQ = supabase
    .from("journal_entries")
    .select("id, entry_date, title, mood, account_id")
    .eq("user_id", user.id)
    .gte("entry_date", monthFrom)
    .lte("entry_date", monthTo)
    .limit(1000);
  let yearQ = supabase
    .from("trades")
    .select("pnl, trade_date")
    .eq("user_id", user.id)
    .gte("trade_date", `${year}-01-01`)
    .lte("trade_date", `${year}-12-31`)
    .limit(20000);
  if (account) {
    tradesQ = tradesQ.eq("account_id", account);
    entriesQ = entriesQ.or(`account_id.eq.${account},account_id.is.null`);
    yearQ = yearQ.eq("account_id", account);
  }

  const [tradesRes, entriesRes, yearRes, plots] = await Promise.all([tradesQ, entriesQ, yearQ, loadPlots(supabase, user.id)]);

  const trades: CalTrade[] = ((tradesRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    account_id: String(r.account_id),
    symbol: String(r.symbol),
    direction: r.direction as Direction,
    pnl: Number(r.pnl) || 0,
    trade_date: String(r.trade_date),
    setup: (r.setup as string | null) ?? null,
  }));
  const entries: CalEntry[] = ((entriesRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    entry_date: String(r.entry_date),
    title: (r.title as string | null) ?? null,
    mood: (r.mood as Mood | null) ?? null,
    account_id: (r.account_id as string | null) ?? null,
  }));

  const months: MonthTotal[] = Array.from({ length: 12 }, (_, i) => ({
    month: `${year}-${String(i + 1).padStart(2, "0")}`,
    net: 0,
    count: 0,
  }));
  for (const r of (yearRes.data ?? []) as { pnl: number | string; trade_date: string }[]) {
    const m = months[Number(r.trade_date.slice(5, 7)) - 1];
    if (!m) continue;
    m.net += Number(r.pnl) || 0;
    m.count++;
  }

  const selectedPlot = account ? plots.find((p) => p.id === account) : null;

  return (
    <div>
      <PageHeader
        title="P&L Calendar 🗓️"
        subtitle={
          selectedPlot
            ? `${selectedPlot.plot_name} in ${format(parseISO(monthFrom), "MMMM")} — green days grow, dry days teach.`
            : "Green days grow the crops. Dry days teach you how to farm."
        }
      >
        <Link href={`/journal/entries/new${account ? `?account=${account}` : ""}`} className="btn-ghost">
          <NotebookPen size={16} /> Daily journal
        </Link>
        <Link href={`/journal/new${account ? `?account=${account}` : ""}`} className="btn-primary">
          <Plus size={16} /> Log trade
        </Link>
      </PageHeader>

      <CalendarView key={`${month}-${account}`} month={month} trades={trades} entries={entries} plots={plots} account={account} />

      <YearBars year={year} months={months} current={month} account={account} />
    </div>
  );
}
