import type { Account, JournalEntry, Trade } from "@/lib/types";

// Supabase returns Postgres `numeric` columns as strings — coerce them here.

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function normalizeTrade(row: Record<string, unknown>): Trade {
  const r = row as unknown as Trade;
  return {
    ...r,
    quantity: num(row.quantity),
    entry_price: num(row.entry_price),
    exit_price: num(row.exit_price),
    stop_loss: num(row.stop_loss),
    take_profit: num(row.take_profit),
    pnl: num(row.pnl) ?? 0,
    fees: num(row.fees) ?? 0,
    r_multiple: num(row.r_multiple),
    rating: num(row.rating),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    screenshots: Array.isArray(row.screenshots) ? (row.screenshots as string[]) : [],
  };
}

export function normalizeEntry(row: Record<string, unknown>): JournalEntry {
  const r = row as unknown as JournalEntry;
  return { ...r, screenshots: Array.isArray(row.screenshots) ? (row.screenshots as string[]) : [] };
}

/** Minimal account shape the journal & calendar need. */
export type PlotAccount = Pick<Account, "id" | "name" | "plot_name" | "crop" | "water_count" | "last_watered_at" | "status" | "firm">;

export const PLOT_ACCOUNT_COLUMNS = "id, name, plot_name, crop, water_count, last_watered_at, status, firm";

export interface TradeStats {
  count: number;
  net: number;
  wins: number;
  losses: number;
  winRate: number; // 0..1 of decided trades
  grossWin: number;
  grossLoss: number; // positive number
  profitFactor: number | null; // null = no losses
  avgWin: number;
  avgLoss: number; // negative number
  best: Pick<Trade, "id" | "symbol" | "pnl" | "trade_date"> | null;
  worst: Pick<Trade, "id" | "symbol" | "pnl" | "trade_date"> | null;
}

export function computeStats(trades: Pick<Trade, "id" | "symbol" | "pnl" | "trade_date">[]): TradeStats {
  let net = 0,
    wins = 0,
    losses = 0,
    grossWin = 0,
    grossLoss = 0;
  let best: TradeStats["best"] = null;
  let worst: TradeStats["worst"] = null;
  for (const t of trades) {
    const p = Number(t.pnl) || 0;
    net += p;
    if (p > 0) {
      wins++;
      grossWin += p;
    } else if (p < 0) {
      losses++;
      grossLoss += -p;
    }
    if (!best || p > Number(best.pnl)) best = t;
    if (!worst || p < Number(worst.pnl)) worst = t;
  }
  const decided = wins + losses;
  return {
    count: trades.length,
    net,
    wins,
    losses,
    winRate: decided ? wins / decided : 0,
    grossWin,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
    avgWin: wins ? grossWin / wins : 0,
    avgLoss: losses ? -grossLoss / losses : 0,
    best,
    worst,
  };
}
