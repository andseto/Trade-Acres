import Link from "next/link";
import clsx from "clsx";
import { PlotPreview } from "@/components/farm/PlotPreview";
import { getCrop, getGrowthStage, getPlotState } from "@/lib/farm";
import { formatCompactMoney, formatMoney, formatPnl, pnlClass, timeAgo } from "@/lib/format";
import type { Account } from "@/lib/types";
import { DrawdownBar, GRASS_BG, GrowthMeter, HydrationBar, StatusBadge, TargetBar, TypeBadge } from "./bits";
import type { AccountStats } from "./stats";

export function AccountCard({ account, stats }: { account: Account; stats: AccountStats }) {
  const crop = getCrop(account.crop);
  const stage = getGrowthStage(account.water_count);
  const state = getPlotState(account);
  const active = account.status === "active";

  return (
    <Link
      href={`/accounts/${account.id}`}
      className={clsx(
        "panel group relative flex flex-col p-4 transition-transform duration-150 hover:-translate-y-1",
        account.status === "passed" && "border-[#6b4f12]",
      )}
    >
      {/* field window */}
      <div
        className="relative -mx-1 -mt-1 mb-4 flex h-44 items-center justify-center overflow-hidden rounded-sm border-[3px] border-outline"
        style={{ ...GRASS_BG, boxShadow: "inset 0 -4px 0 0 rgba(0,0,0,0.18)" }}
      >
        <PlotPreview crop={crop.id} stage={stage} state={state} size={136} animated={active} />
        <div className="absolute left-2 top-2 flex gap-1.5">
          <TypeBadge type={account.account_type} />
        </div>
        <div className="absolute right-2 top-2">
          <StatusBadge status={account.status} />
        </div>
        <span className="chip absolute bottom-2 left-2 text-cream/90">{crop.name}</span>
      </div>

      <h3 className="truncate font-display text-2xl leading-tight group-hover:text-leaf">{account.plot_name}</h3>
      <p className="mt-0.5 truncate text-sm text-muted">
        {account.name}
        {account.firm ? ` · ${account.firm}` : ""}
        {account.account_size ? ` · ${formatCompactMoney(account.account_size)}` : ""}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Balance", value: formatMoney(stats.balance), cls: "" },
          { label: "Net P&L", value: formatPnl(stats.totalPnl), cls: pnlClass(stats.totalPnl) },
          { label: "Trades", value: String(stats.tradeCount), cls: "" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-sm border-2 border-outline bg-[#2a1c10] px-1.5 py-1.5"
            style={{ boxShadow: "inset 0 2px 0 0 rgba(0,0,0,0.35)" }}
          >
            <div className="font-display text-[10px] uppercase tracking-wider text-muted">{s.label}</div>
            <div className={clsx("truncate text-sm font-semibold", s.cls)}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {active && <HydrationBar lastWateredAt={account.last_watered_at} compact />}
        <GrowthMeter waterCount={account.water_count} compact />
        {account.account_type === "eval" && account.profit_target ? (
          <TargetBar pnl={stats.totalPnl} target={account.profit_target} compact />
        ) : null}
        {account.max_drawdown ? <DrawdownBar used={stats.drawdownUsed} max={account.max_drawdown} compact /> : null}
      </div>

      <p className="mt-auto pt-4 text-xs text-muted">
        💧 Last watered {timeAgo(account.last_watered_at)} · {account.water_count} {account.water_count === 1 ? "entry" : "entries"}
      </p>
    </Link>
  );
}
