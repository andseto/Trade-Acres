import Link from "next/link";
import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Droplets, NotebookPen, Pencil } from "lucide-react";
import { PlotPreview } from "@/components/farm/PlotPreview";
import { DrawdownBar, GRASS_BG, GrowthMeter, HydrationBar, StatusBadge, TargetBar, TypeBadge } from "@/components/accounts/bits";
import { EquityChart } from "@/components/accounts/EquityChart";
import { RenamePlot } from "@/components/accounts/RenamePlot";
import { StatusActions } from "@/components/accounts/StatusActions";
import { getOwnAccount } from "@/components/accounts/queries";
import { computeStats, equityCurve, type StatTrade } from "@/components/accounts/stats";
import { getCrop, getGrowthStage, getPlotState, PLOT_STATE_LABEL } from "@/lib/farm";
import { formatCompactMoney, formatMoney, formatPnl, pnlClass, timeAgo } from "@/lib/format";
import type { Direction } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { account } = await getOwnAccount(id);
  return { title: `${account.plot_name} · Trade Acres` };
}

type TradeRow = StatTrade & { id: string; symbol: string; direction: Direction; setup: string | null; created_at: string };

function Stat({ label, value, className, sub }: { label: string; value: React.ReactNode; className?: string; sub?: React.ReactNode }) {
  return (
    <div className="panel px-4 py-3.5">
      <div className="font-display text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className={clsx("mt-1 truncate text-xl font-semibold", className)}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-muted">{sub}</div>}
    </div>
  );
}

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, account } = await getOwnAccount(id);

  const { data: tradeData, error: tradeErr } = await supabase
    .from("trades")
    .select("id, symbol, direction, pnl, setup, trade_date, created_at")
    .eq("account_id", account.id)
    .eq("user_id", user.id)
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false });

  const trades: TradeRow[] = (tradeData ?? []).map((t) => ({ ...t, pnl: Number(t.pnl) }) as TradeRow);
  const stats = computeStats(account, trades);
  const curve = equityCurve(trades);
  const recent = trades.slice(0, 12);

  const crop = getCrop(account.crop);
  const stage = getGrowthStage(account.water_count);
  const state = getPlotState(account);
  const active = account.status === "active";

  return (
    <div className="space-y-6">
      <Link href="/accounts" className="inline-flex items-center gap-1.5 font-display text-sm text-muted hover:text-cream">
        <ArrowLeft size={16} /> Your plots
      </Link>

      {/* ───────── hero ───────── */}
      <section className="panel overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div
            className="relative flex min-h-72 flex-col items-center justify-center gap-3 border-b-[3px] border-outline p-6 md:border-b-0 md:border-r-[3px]"
            style={GRASS_BG}
          >
            <PlotPreview crop={crop.id} stage={stage} state={state} size={232} animated={active} />
            <span className="chip text-cream/90">{PLOT_STATE_LABEL[state]}</span>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={account.account_type} />
              <StatusBadge status={account.status} />
              <span className="chip text-cream/90">{crop.name}</span>
            </div>
            <div>
              <RenamePlot key={account.plot_name} id={account.id} name={account.plot_name} />
              <p className="mt-1 text-muted">
                {account.name}
                {account.firm ? ` · ${account.firm}` : ""}
                {account.account_size ? ` · ${formatCompactMoney(account.account_size)}` : ""}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {active ? (
                <HydrationBar lastWateredAt={account.last_watered_at} />
              ) : (
                <div>
                  <div className="mb-1.5 font-display text-sm uppercase tracking-wider text-muted">Moisture</div>
                  <p className="text-sm text-muted">Not being watered — this plot is {account.status === "blown" ? "dead" : account.status === "passed" ? "harvested" : "fallow"}.</p>
                </div>
              )}
              <GrowthMeter waterCount={account.water_count} />
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Droplets size={14} /> Last watered {timeAgo(account.last_watered_at)} · {account.water_count}{" "}
              {account.water_count === 1 ? "entry" : "entries"} so far
            </p>

            <div className="flex flex-wrap gap-2">
              <Link href={`/journal/new?account=${account.id}`} className="btn-primary">
                <Droplets size={16} /> Water it — log a trade
              </Link>
              <Link href={`/journal/entries/new?account=${account.id}`} className="btn-ghost">
                <NotebookPen size={16} /> Journal entry
              </Link>
              <Link href={`/accounts/${account.id}/edit`} className="btn-ghost">
                <Pencil size={16} /> Edit
              </Link>
            </div>

            <div className="border-t-[3px] border-outline/60 pt-4">
              <StatusActions
                id={account.id}
                status={account.status}
                accountType={account.account_type}
                plotName={account.plot_name}
                crop={crop.id}
                stage={stage}
                tradeCount={stats.tradeCount}
              />
            </div>
          </div>
        </div>
      </section>

      {tradeErr && <div className="panel p-4 text-sm font-semibold text-loss">Couldn&apos;t load trades: {tradeErr.message}</div>}

      {/* ───────── stats ───────── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Balance" value={formatMoney(stats.balance)} sub={account.account_size ? `Started at ${formatMoney(stats.startBalance)}` : undefined} />
        <Stat label="Net P&L" value={formatPnl(stats.totalPnl)} className={pnlClass(stats.totalPnl)} />
        <Stat
          label="Win rate"
          value={stats.winRate === null ? "—" : `${Math.round(stats.winRate * 100)}%`}
          sub={stats.tradeCount ? `${stats.wins}W · ${stats.losses}L` : undefined}
        />
        <Stat label="Trades" value={stats.tradeCount} />
        <Stat label="Avg win" value={stats.avgWin === null ? "—" : formatPnl(stats.avgWin)} className={stats.avgWin ? "pnl-pos" : undefined} />
        <Stat label="Avg loss" value={stats.avgLoss === null ? "—" : formatPnl(stats.avgLoss)} className={stats.avgLoss ? "pnl-neg" : undefined} />
        <Stat label="Best trade" value={stats.best === null ? "—" : formatPnl(stats.best)} className={pnlClass(stats.best)} />
        <Stat label="Worst trade" value={stats.worst === null ? "—" : formatPnl(stats.worst)} className={pnlClass(stats.worst)} />
      </section>

      {(account.profit_target || account.max_drawdown) && (
        <section className="panel grid gap-5 p-5 sm:p-6 md:grid-cols-2">
          {account.profit_target ? (
            <TargetBar pnl={stats.totalPnl} target={account.profit_target} />
          ) : (
            <p className="text-sm text-muted">No profit target set.</p>
          )}
          {account.max_drawdown ? (
            <div>
              <DrawdownBar used={stats.drawdownUsed} max={account.max_drawdown} />
              <p className="mt-1.5 text-xs text-muted">
                Measured from peak closed P&amp;L. {formatMoney(Math.max(0, account.max_drawdown - stats.drawdownUsed))} of breathing room left.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">No max drawdown set.</p>
          )}
        </section>
      )}

      {/* ───────── equity curve ───────── */}
      <section className="panel p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl">Equity curve</h2>
        <EquityChart points={curve} />
      </section>

      {/* ───────── recent trades ───────── */}
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5 sm:px-6">
          <h2 className="font-display text-xl">Recent trades</h2>
          {trades.length > recent.length && (
            <Link href={`/journal?account=${account.id}`} className="font-display text-sm text-leaf hover:underline">
              View all {trades.length}
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="px-6 pb-10 pt-2 text-center">
            <p className="text-muted">{account.plot_name} hasn&apos;t had a drop of water yet. The soil is bone dry.</p>
            <Link href={`/journal/new?account=${account.id}`} className="btn-primary mt-4">
              <Droplets size={16} /> Water it with a trade
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-y-[3px] border-outline bg-wood/60 text-left font-display text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-5 py-2.5 font-normal sm:px-6">Date</th>
                  <th className="px-3 py-2.5 font-normal">Symbol</th>
                  <th className="px-3 py-2.5 font-normal">Side</th>
                  <th className="px-3 py-2.5 font-normal">Setup</th>
                  <th className="px-5 py-2.5 text-right font-normal sm:px-6">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id} className="group relative border-b-2 border-outline/40 last:border-0 hover:bg-wood/50">
                    <td className="whitespace-nowrap px-5 py-3 text-muted sm:px-6">
                      <Link href={`/journal/trades/${t.id}`} className="after:absolute after:inset-0">
                        {format(parseISO(t.trade_date), "MMM d, yyyy")}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-semibold group-hover:text-leaf">{t.symbol}</td>
                    <td className="px-3 py-3">
                      <span className={clsx("chip", t.direction === "long" ? "text-gain" : "text-loss")}>
                        {t.direction === "long" ? "▲ Long" : "▼ Short"}
                      </span>
                    </td>
                    <td className="max-w-[12rem] truncate px-3 py-3 text-muted">{t.setup || "—"}</td>
                    <td className={clsx("whitespace-nowrap px-5 py-3 text-right font-semibold sm:px-6", pnlClass(t.pnl))}>{formatPnl(t.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {account.notes && (
        <section className="panel p-5 sm:p-6">
          <h2 className="mb-2 font-display text-xl">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-cream/85">{account.notes}</p>
        </section>
      )}
    </div>
  );
}
