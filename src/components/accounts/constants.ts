import type { AccountStatus, AccountType } from "@/lib/types";

export const FIRMS = [
  "Apex",
  "Topstep",
  "FTMO",
  "Take Profit Trader",
  "MyFundedFutures",
  "Tradeify",
  "Lucid Trading",
  "The5ers",
  "FundedNext",
  "Alpha Futures",
  "E8",
  "Personal",
];

export const SIZE_CHIPS = [25_000, 50_000, 100_000, 150_000, 200_000];

export const ACCOUNT_TYPES: { id: AccountType; label: string; emoji: string; hint: string }[] = [
  { id: "eval", label: "Eval", emoji: "🎯", hint: "Chasing a profit target" },
  { id: "funded", label: "Funded", emoji: "💰", hint: "Live payouts on the line" },
  { id: "personal", label: "Personal", emoji: "🏠", hint: "Your own capital" },
];

export const STATUS_META: Record<AccountStatus, { label: string; emoji: string; className: string }> = {
  active: { label: "Growing", emoji: "🌱", className: "bg-[#35501c]! text-[#c3eb8a] shadow-[inset_0_2px_0_0_#4d7028]!" },
  passed: { label: "Harvested", emoji: "🏆", className: "bg-[#5a4312]! text-gold shadow-[inset_0_2px_0_0_#7c5e1c]!" },
  blown: { label: "Dead crop", emoji: "💀", className: "bg-[#4e1d14]! text-[#f59a8a] shadow-[inset_0_2px_0_0_#6e2c20]!" },
  retired: { label: "Fallow", emoji: "🍂", className: "text-muted" },
};

export const TYPE_META: Record<AccountType, { label: string; className: string }> = {
  eval: { label: "Eval", className: "text-[#f3d98f]" },
  funded: { label: "Funded", className: "text-gain" },
  personal: { label: "Personal", className: "text-cream/80" },
};

export const PLOT_NAMES = [
  "The Back Forty",
  "Drawdown Acres",
  "Bull Run Ranch",
  "Scalper's Patch",
  "Green Candle Gardens",
  "Stop-Loss Meadow",
  "Liquidity Field",
  "Theta Farm",
  "Compound Interest Croft",
  "Margin Call Manor",
  "Bid & Ask Barn",
  "Fill-or-Kill Field",
  "Pip Orchard",
  "Breakout Brook",
  "Mean Reversion Meadow",
  "Support Line Pasture",
  "Resistance Ridge",
  "Wick Hollow",
  "Gap Fill Gully",
  "VWAP Valley",
  "Bear Trap Bottoms",
  "Short Squeeze Silo",
  "Payout Pasture",
  "Prop Firm Paddock",
  "Risk-Reward Ranch",
  "Fibonacci Furrows",
  "Trend Line Terrace",
  "Overnight Gap Grove",
  "Slippage Slope",
  "Opening Bell Acres",
  "Dead Cat Dell",
  "Moving Average Meadow",
  "Diamond Hands Homestead",
  "Paper Hands Plot",
  "Limit Order Lot",
  "Consolidation Commons",
  "Futures Furlong",
  "Golden Cross Gardens",
  "Harvest the Spread",
  "Tick Value Thicket",
];

export function randomPlotName(exclude?: string): string {
  const pool = PLOT_NAMES.filter((n) => n !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

export const BLOWN_CONDOLENCES = [
  "Hail storm. Total loss.",
  "Locusts came through at the open. Nothing left but stalks.",
  "It got flooded on one more trade. The levee was your stop loss.",
  "Frost hit overnight. Should've covered it before the close.",
  "Revenge trading is not a fertilizer. We learned that together.",
];

export const STATUS_FILTERS: { id: AccountStatus | "all"; label: string }[] = [
  { id: "active", label: "Growing" },
  { id: "passed", label: "Harvested" },
  { id: "blown", label: "Dead" },
  { id: "retired", label: "Fallow" },
  { id: "all", label: "All" },
];
