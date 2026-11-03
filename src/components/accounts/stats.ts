import type { Account, AccountStatus, AccountType, CropId, Trade } from "@/lib/types";

/** Supabase numeric columns may come back as strings — normalise an account row. */
export function normalizeAccount(row: Record<string, unknown>): Account {
  const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  return {
    ...(row as unknown as Account),
    account_type: (row.account_type as AccountType) ?? "eval",
    status: (row.status as AccountStatus) ?? "active",
    crop: (row.crop as CropId) ?? "wheat",
    account_size: num(row.account_size),
    profit_target: num(row.profit_target),
    max_drawdown: num(row.max_drawdown),
    water_count: Number(row.water_count ?? 0),
  };
}

export type StatTrade = Pick<Trade, "pnl" | "trade_date"> & Partial<Pick<Trade, "created_at">>;

export interface AccountStats {
  tradeCount: number;
  totalPnl: number;
  wins: number;
  losses: number;
  winRate: number | null; // 0..1
  avgWin: number | null;
  avgLoss: number | null;
  best: number | null;
  worst: number | null;
  balance: number;
  startBalance: number;
  /** peak-to-current drop in closed equity (trailing-style), >= 0 */
  drawdownUsed: number;
  /** 0..1+ of max_drawdown used, null when no max_drawdown set */
  drawdownPct: number | null;
  /** 0..1 progress toward profit_target, null when none set */
  targetPct: number | null;
}

function sortTrades<T extends StatTrade>(trades: T[]): T[] {
  return [...trades].sort(
    (a, b) => a.trade_date.localeCompare(b.trade_date) || (a.created_at ?? "").localeCompare(b.created_at ?? ""),
  );
}

export function computeStats(account: Pick<Account, "account_size" | "profit_target" | "max_drawdown">, trades: StatTrade[]): AccountStats {
  const sorted = sortTrades(trades);
  const start = Number(account.account_size ?? 0);
  let total = 0;
  let peak = 0;
  let wins = 0;
  let losses = 0;
  let winSum = 0;
  let lossSum = 0;
  let best: number | null = null;
  let worst: number | null = null;

  for (const t of sorted) {
    const p = Number(t.pnl ?? 0);
    total += p;
    peak = Math.max(peak, total);
    if (p > 0) {
      wins++;
      winSum += p;
    } else if (p < 0) {
      losses++;
      lossSum += p;
    }
    best = best === null ? p : Math.max(best, p);
    worst = worst === null ? p : Math.min(worst, p);
  }

  const drawdownUsed = Math.max(0, peak - total);
  const maxDd = Number(account.max_drawdown ?? 0);
  const target = Number(account.profit_target ?? 0);

  return {
    tradeCount: sorted.length,
    totalPnl: total,
    wins,
    losses,
    winRate: sorted.length ? wins / sorted.length : null,
    avgWin: wins ? winSum / wins : null,
    avgLoss: losses ? lossSum / losses : null,
    best,
    worst,
    startBalance: start,
    balance: start + total,
    drawdownUsed,
    drawdownPct: maxDd > 0 ? drawdownUsed / maxDd : null,
    targetPct: target > 0 ? Math.max(0, total / target) : null,
  };
}

export interface EquityPoint {
  date: string; // YYYY-MM-DD
  pnl: number; // cumulative
  day: number; // that day's P&L
}

/** Cumulative P&L by trade_date. */
export function equityCurve(trades: StatTrade[]): EquityPoint[] {
  const byDay = new Map<string, number>();
  for (const t of sortTrades(trades)) byDay.set(t.trade_date, (byDay.get(t.trade_date) ?? 0) + Number(t.pnl ?? 0));
  let run = 0;
  return [...byDay.entries()].map(([date, day]) => {
    run += day;
    return { date, pnl: run, day };
  });
}

export function drawdownTone(pct: number | null): "ok" | "warn" | "danger" {
  if (pct === null) return "ok";
  if (pct >= 0.8) return "danger";
  if (pct >= 0.5) return "warn";
  return "ok";
}
