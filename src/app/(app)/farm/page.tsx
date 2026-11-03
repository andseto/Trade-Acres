import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { Droplets, Flame, NotebookPen, Plus, Sprout, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import type { Account, Season } from "@/lib/types";
import {
  getCrop,
  getGrowthStage,
  getHydration,
  getPlotState,
  isSeason,
  PLOT_STATE_LABEL,
  THIRSTY,
  type Moisture,
} from "@/lib/farm";
import { formatPnl, pnlClass, timeAgo, toDateKey } from "@/lib/format";
import { Farm, type FarmPlotData } from "@/components/farm/Farm";
import { PlotPreview } from "@/components/farm/PlotPreview";
import { HydrationBar } from "@/components/farm/HydrationBar";

export const metadata: Metadata = { title: "Your farm" };

/** Consecutive days (ending today — or yesterday if today isn't logged yet) with a trade or journal entry. */
function journalStreak(days: Set<string>, now: Date): { streak: number; today: boolean } {
  const d = new Date(now);
  const today = days.has(toDateKey(d));
  if (!today) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(toDateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return { streak, today };
}

function isThirsty(p: FarmPlotData) {
  return p.status === "active" && THIRSTY.includes(p.state as Moisture);
}

function thirstyNudge(thirsty: FarmPlotData[]): string {
  if (thirsty.length === 0) return "Every plot is well watered.";
  if (thirsty.length === 1) return `${thirsty[0].plot_name} is drying out — log a trade.`;
  if (thirsty.some((p) => p.state === "withering")) return "Some crops are wilting. Time to journal!";
  return `${thirsty.length} plots could use a drink.`;
}

export default async function FarmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const watered = typeof sp.watered === "string" ? sp.watered : null;
  const { supabase, user } = await requireUser();
  const now = new Date();
  const monthStart = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
  const sinceD = new Date(now);
  sinceD.setDate(sinceD.getDate() - 400);
  const since = toDateKey(sinceD);

  const [accountsRes, profileRes, monthRes, tradeDaysRes, entryDaysRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("profiles").select("farm_season").eq("id", user.id).maybeSingle(),
    supabase.from("trades").select("pnl").eq("user_id", user.id).gte("trade_date", monthStart),
    supabase.from("trades").select("trade_date").eq("user_id", user.id).gte("trade_date", since),
    supabase.from("journal_entries").select("entry_date").eq("user_id", user.id).gte("entry_date", since),
  ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const rawSeason: string = profileRes.data?.farm_season ?? "spring";
  const season: Season = isSeason(rawSeason) ? rawSeason : "spring";

  const plots: FarmPlotData[] = accounts.map((a) => ({
    id: a.id,
    plot_name: a.plot_name,
    crop: a.crop,
    name: a.name,
    firm: a.firm,
    account_type: a.account_type,
    status: a.status,
    last_watered_at: a.last_watered_at,
    water_count: a.water_count,
    stage: getGrowthStage(a.water_count),
    state: getPlotState(a, now),
    hydration: a.status === "active" ? getHydration(a.last_watered_at, now) : 0,
  }));

  const growing = plots.filter((p) => p.status === "active");
  const harvested = plots.filter((p) => p.status === "passed").length;
  const thirsty = plots.filter(isThirsty).sort((a, b) => a.hydration - b.hydration);
  const monthPnl = ((monthRes.data ?? []) as { pnl: number | string }[]).reduce((s, t) => s + Number(t.pnl ?? 0), 0);
  const days = new Set<string>([
    ...((tradeDaysRes.data ?? []) as { trade_date: string }[]).map((t) => t.trade_date),
    ...((entryDaysRes.data ?? []) as { entry_date: string }[]).map((e) => e.entry_date),
  ]);
  const streak = journalStreak(days, now);
  const monthName = now.toLocaleString("en-US", { month: "long" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your farm</h1>
          <p className="mt-1 text-sm text-muted">
            {plots.length === 0
              ? "Nothing planted yet — plant a plot for each account you trade."
              : "Journal a trade to water a plot. Click a plot to look closer."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/accounts/new" className="btn-ghost">
            <Plus className="h-4 w-4" /> Plant a plot
          </Link>
          <Link href="/journal/new" className="btn-primary">
            <NotebookPen className="h-4 w-4" /> Log a trade
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Sprout className="h-4 w-4" />} label="Plots growing" value={String(growing.length)}>
          {plots.length === 0 ? "Your field is empty" : `${harvested} harvested · ${plots.length} total`}
        </StatCard>
        <StatCard
          icon={<Droplets className="h-4 w-4" />}
          label="Thirsty plots"
          value={String(thirsty.length)}
          valueClass={thirsty.length ? "text-gold" : "text-gain"}
        >
          {thirstyNudge(thirsty)}
        </StatCard>
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label={`${monthName} P&L`} value={formatPnl(monthPnl)} valueClass={pnlClass(monthPnl)}>
          Net of fees, all plots
        </StatCard>
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Journal streak"
          value={`${streak.streak} day${streak.streak === 1 ? "" : "s"}`}
          valueClass={streak.streak ? "text-gold" : undefined}
        >
          {streak.streak === 0 ? "Log a trade or entry to start one" : streak.today ? "Logged today — nice." : "Log today to keep it going"}
        </StatCard>
      </div>

      <Farm plots={plots} season={season} watered={watered} />

      {thirsty.length > 0 && (
        <section className="panel p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Thirsty plots</h2>
            <span className="text-xs text-muted">Log a trade to water a plot</span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {thirsty.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-2 border-outline bg-soil/40 p-2.5" style={{ borderRadius: 3 }}>
                <PlotPreview crop={p.crop} stage={p.stage} state={p.state} size={56} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-semibold">{p.plot_name}</p>
                    <span className={clsx("shrink-0 text-xs", p.state === "withering" ? "text-loss" : "text-gold")}>
                      {PLOT_STATE_LABEL[p.state]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted">
                    {p.name} · {getCrop(p.crop).name} · watered {timeAgo(p.last_watered_at)}
                  </p>
                  <HydrationBar value={p.hydration} className="mt-1.5" />
                </div>
                <Link href={`/journal/new?account=${p.id}`} className="btn-primary shrink-0 px-3 py-2 text-xs">
                  <Droplets className="h-3.5 w-3.5" /> Water
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <span className="flex h-6 w-6 items-center justify-center border-2 border-outline bg-wood text-leaf" style={{ borderRadius: 2 }}>
          {icon}
        </span>
        {label}
      </div>
      <p className={clsx("mt-2 font-display text-2xl font-semibold sm:text-3xl", valueClass)}>{value}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted">{children}</p>
    </div>
  );
}
