import Link from "next/link";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import type { AccountStatus } from "@/lib/types";
import { AccountCard } from "@/components/accounts/AccountCard";
import { GRASS_BG } from "@/components/accounts/bits";
import { STATUS_FILTERS } from "@/components/accounts/constants";
import { computeStats, normalizeAccount, type StatTrade } from "@/components/accounts/stats";
import { PlotPreview } from "@/components/farm/PlotPreview";
import type { PlotState } from "@/lib/farm";

export const metadata = { title: "Your plots · Trade Acres" };

type Filter = AccountStatus | "all";

const EMPTY_COPY: Record<Filter, { title: string; body: string; state: PlotState }> = {
  active: {
    title: "Nothing's growing yet",
    body: "Plant a plot for each funded account or prop-firm eval, then water it by journaling your trades.",
    state: "fallow",
  },
  passed: { title: "No harvests yet", body: "Pass an eval and its plot comes in golden. We believe in you.", state: "fallow" },
  blown: { title: "No dead crops!", body: "Not a single wilted stalk. Your risk manager would be proud.", state: "soaked" },
  retired: { title: "No fallow fields", body: "Plots you stop trading rest here, ready to be replanted.", state: "fallow" },
  all: {
    title: "Your farm is bare dirt",
    body: "Every account you trade is a plot of land. Journal your trades to keep the soil wet and the crops growing.",
    state: "fallow",
  },
};

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter: Filter = STATUS_FILTERS.some((f) => f.id === status) ? (status as Filter) : "active";

  const { supabase, user } = await requireUser();
  const [{ data: accountRows, error }, { data: tradeRows }] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("trades").select("account_id, pnl, trade_date, created_at").eq("user_id", user.id),
  ]);

  const accounts = (accountRows ?? []).map((r) => normalizeAccount(r));
  const tradesByAccount = new Map<string, StatTrade[]>();
  for (const t of tradeRows ?? []) {
    const list = tradesByAccount.get(t.account_id) ?? [];
    list.push({ pnl: Number(t.pnl), trade_date: t.trade_date, created_at: t.created_at });
    tradesByAccount.set(t.account_id, list);
  }

  const counts: Record<Filter, number> = { active: 0, passed: 0, blown: 0, retired: 0, all: accounts.length };
  for (const a of accounts) counts[a.status]++;

  const visible = filter === "all" ? accounts : accounts.filter((a) => a.status === filter);
  const empty = EMPTY_COPY[accounts.length === 0 ? "all" : filter];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Your plots</h1>
          <p className="mt-1 text-muted">
            {accounts.length === 0
              ? "One plot per account. Water them by journaling."
              : `${counts.active} growing · ${counts.passed} harvested · ${counts.blown} dead`}
          </p>
        </div>
        <Link href="/accounts/new" className="btn-primary">
          <Plus size={18} strokeWidth={3} /> Plant a plot
        </Link>
      </div>

      {error && (
        <div className="panel p-4 text-sm font-semibold text-loss">Couldn&apos;t load your plots: {error.message}</div>
      )}

      {accounts.length > 0 && (
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" aria-label="Filter plots by status">
          {STATUS_FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <Link
                key={f.id}
                href={f.id === "active" ? "/accounts" : `/accounts?status=${f.id}`}
                aria-current={on ? "page" : undefined}
                className={clsx(
                  "flex shrink-0 items-center gap-2 rounded-sm border-[3px] border-outline px-3 py-1.5 font-display text-sm",
                  on
                    ? "bg-leaf text-[#1d2b0c] shadow-[inset_0_3px_0_0_#c3eb8a,inset_0_-3px_0_0_#5e9a2a]"
                    : "bg-wood text-cream/85 shadow-[inset_0_3px_0_0_#7d5531,inset_0_-3px_0_0_#3d2714] hover:brightness-110",
                )}
              >
                {f.label}
                <span
                  className={clsx(
                    "min-w-5 rounded-sm px-1 text-center text-xs",
                    on ? "bg-[#1d2b0c]/20" : "bg-outline/40 text-muted",
                  )}
                >
                  {counts[f.id]}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      {visible.length === 0 ? (
        <div className="panel flex flex-col items-center px-6 py-14 text-center">
          <div
            className="mb-6 flex items-center justify-center rounded-sm border-[3px] border-outline p-5"
            style={{ ...GRASS_BG, boxShadow: "inset 0 -4px 0 0 rgba(0,0,0,0.18)" }}
          >
            <PlotPreview crop="wheat" stage={empty.state === "soaked" ? "young" : "seed"} state={empty.state} size={120} />
          </div>
          <h2 className="font-display text-2xl">{empty.title}</h2>
          <p className="mt-2 max-w-md text-muted">{empty.body}</p>
          {(accounts.length === 0 || filter === "active") && (
            <Link href="/accounts/new" className="btn-primary mt-6">
              <Plus size={18} strokeWidth={3} /> Plant your {accounts.length === 0 ? "first" : "next"} plot
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((a) => (
            <AccountCard key={a.id} account={a} stats={computeStats(a, tradesByAccount.get(a.id) ?? [])} />
          ))}
        </div>
      )}
    </div>
  );
}
