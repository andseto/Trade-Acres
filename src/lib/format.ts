import { formatDistanceToNowStrict } from "date-fns";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

/** $1,234.50 */
export function formatMoney(n: number | null | undefined): string {
  return usd.format(Number(n ?? 0));
}

/** +$1,234.50 / -$80.00 — for P&L */
export function formatPnl(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return (v > 0 ? "+" : v < 0 ? "-" : "") + usd.format(Math.abs(v));
}

/** $50K — hand-rolled so server (Node) and browser ICU always agree (avoids hydration mismatches). */
export function formatCompactMoney(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const fmt = (x: number, suffix: string) => `${sign}$${Number(x.toFixed(1))}${suffix}`;
  if (abs >= 1e9) return fmt(abs / 1e9, "B");
  if (abs >= 1e6) return fmt(abs / 1e6, "M");
  if (abs >= 1e3) return fmt(abs / 1e3, "K");
  return `${sign}$${Number(abs.toFixed(2))}`;
}

/** "pnl-pos" | "pnl-neg" | "" — pair with the utilities in globals.css */
export function pnlClass(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return v > 0 ? "pnl-pos" : v < 0 ? "pnl-neg" : "text-muted";
}

/** "3 hours ago" */
export function timeAgo(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

/** Local-date YYYY-MM-DD (not UTC — trade_date is the trader's calendar day). */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
