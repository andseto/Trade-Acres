import Link from "next/link";
import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { formatPnl, pnlClass } from "@/lib/format";

export interface MonthTotal {
  month: string; // YYYY-MM
  net: number;
  count: number;
}

/** Diverging monthly P&L bars for one year, around a zero baseline. Each bar links to that month. */
export function YearBars({
  year,
  months,
  current,
  account,
}: {
  year: number;
  months: MonthTotal[];
  current: string;
  account: string;
}) {
  const maxAbs = Math.max(1, ...months.map((m) => Math.abs(m.net)));
  const net = months.reduce((s, m) => s + m.net, 0);
  const trades = months.reduce((s, m) => s + m.count, 0);
  const href = (m: string) => `/calendar?month=${m}${account ? `&account=${account}` : ""}`;
  const HALF = 56; // px for each side of the baseline

  return (
    <section className="panel mt-5 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">
          {year} by month
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <Link href={href(`${year - 1}-12`)} className="text-muted hover:text-leaf">
            ← {year - 1}
          </Link>
          <span className="text-muted">
            {trades} trades · <span className={clsx("font-mono font-semibold", pnlClass(net))}>{formatPnl(net)}</span>
          </span>
          <Link href={href(`${year + 1}-01`)} className="text-muted hover:text-leaf">
            {year + 1} →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 sm:gap-2">
        {months.map((m) => {
          // snap to 4px steps so the bars read as stacked pixel blocks
          const h = m.count ? Math.max(4, Math.round(((Math.abs(m.net) / maxAbs) * HALF) / 4) * 4) : 0;
          const label = `${format(parseISO(`${m.month}-01`), "MMMM yyyy")}: ${m.count ? `${formatPnl(m.net)} · ${m.count} trades` : "no trades"}`;
          const isCurrent = m.month === current;
          return (
            <Link
              key={m.month}
              href={href(m.month)}
              title={label}
              aria-label={label}
              className={clsx(
                "group flex flex-col items-center rounded-sm border-2 px-0.5 py-1 transition-colors",
                isCurrent ? "border-outline bg-soil/60 shadow-[inset_0_3px_0_0_rgba(0,0,0,0.35)]" : "border-transparent hover:bg-soil/40",
              )}
            >
              <div className="relative w-full" style={{ height: HALF * 2 }}>
                {/* baseline */}
                <div className="absolute inset-x-0 h-0.5 -translate-y-1/2 bg-plank" style={{ top: HALF }} />
                {m.count > 0 && (
                  <div
                    className={clsx(
                      "absolute left-1/2 w-3/5 max-w-6 -translate-x-1/2 border-2 border-outline group-hover:brightness-110",
                      m.net >= 0
                        ? "bg-gain shadow-[inset_2px_0_0_0_#c3eb8a,inset_-2px_0_0_0_#5e9a2a]"
                        : "bg-loss shadow-[inset_2px_0_0_0_#f59a8a,inset_-2px_0_0_0_#a83a2a]",
                    )}
                    style={m.net >= 0 ? { bottom: HALF, height: h } : { top: HALF, height: h }}
                  />
                )}
              </div>
              <span className={clsx("mt-1 font-display text-[11px] sm:text-[13px]", isCurrent ? "text-leaf" : "text-muted")}>
                {format(parseISO(`${m.month}-01`), "MMM")}
              </span>
              <span
                className={clsx(
                  "hidden h-4 max-w-full truncate font-mono text-[10px] text-muted sm:block",
                  isCurrent ? "sm:visible" : "sm:invisible sm:group-hover:visible",
                )}
              >
                {m.count ? formatPnl(Math.round(m.net)) : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
