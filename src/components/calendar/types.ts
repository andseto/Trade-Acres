import type { Direction, Mood } from "@/lib/types";

export interface CalTrade {
  id: string;
  account_id: string;
  symbol: string;
  direction: Direction;
  pnl: number;
  trade_date: string;
  setup: string | null;
}

export interface CalEntry {
  id: string;
  entry_date: string;
  title: string | null;
  mood: Mood | null;
  account_id: string | null;
}

export interface DayStat {
  date: string;
  net: number;
  count: number;
  trades: CalTrade[];
  entries: CalEntry[];
}
