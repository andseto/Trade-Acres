import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import clsx from "clsx";
import { Pencil, TrendingDown, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { formatMoney, formatPnl, pnlClass } from "@/lib/format";
import { PlotPreview } from "@/components/farm/PlotPreview";
import { getGrowthStage, getPlotState, PLOT_STATE_LABEL } from "@/lib/farm";
import { PageHeader } from "@/components/journal/PageHeader";
import { ScreenshotGallery } from "@/components/journal/ScreenshotGallery";
import { DeleteButton, LocalTime, StarRating } from "@/components/journal/FormBits";
import { EMOTION_BY_ID } from "@/components/journal/constants";
import { PLOT_ACCOUNT_COLUMNS, normalizeTrade, type PlotAccount } from "@/components/journal/normalize";
import { isUuid, signScreenshots } from "@/components/journal/server";
import { deleteTrade } from "../../actions";

export const metadata: Metadata = { title: "Trade · Trade Acres" };

const price = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 6 }));

export default async function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, user } = await requireUser();

  const { data: row } = await supabase.from("trades").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!row) notFound();
  const trade = normalizeTrade(row);

  const [{ data: acc }, images] = await Promise.all([
    supabase.from("accounts").select(PLOT_ACCOUNT_COLUMNS).eq("id", trade.account_id).maybeSingle(),
    signScreenshots(supabase, trade.screenshots),
  ]);
  const plot = acc as PlotAccount | null;
  const emotion = trade.emotion ? EMOTION_BY_ID[trade.emotion] : null;
  const win = trade.pnl > 0;

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Quantity", value: price(trade.quantity) },
    { label: "Entry", value: price(trade.entry_price) },
    { label: "Exit", value: price(trade.exit_price) },
    { label: "Stop loss", value: price(trade.stop_loss) },
    { label: "Take profit", value: price(trade.take_profit) },
    { label: "Fees", value: formatMoney(trade.fees) },
    {
      label: "R-multiple",
      value: trade.r_multiple === null ? "—" : <span className={pnlClass(trade.r_multiple)}>{trade.r_multiple}R</span>,
    },
    {
      label: "Time",
      value:
        trade.opened_at || trade.closed_at ? (
          <span>
            {trade.opened_at ? <LocalTime iso={trade.opened_at} /> : "?"} →{" "}
            {trade.closed_at ? <LocalTime iso={trade.closed_at} /> : "?"}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{ href: "/journal", label: "Journal" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{trade.symbol}</span>
            <span
              className={clsx(
                "chip !text-sm",
                trade.direction === "long" ? "text-gain" : "text-loss",
              )}
            >
              {trade.direction === "long" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {trade.direction === "long" ? "Long" : "Short"}
            </span>
          </span>
        }
        subtitle={format(parseISO(trade.trade_date), "EEEE, MMMM d, yyyy")}
      >
        <Link href={`/journal/trades/${trade.id}/edit`} className="btn-ghost">
          <Pencil size={16} /> Edit
        </Link>
        <DeleteButton action={deleteTrade.bind(null, trade.id)} confirmText="Delete this trade for good?" />
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <section
            className="panel relative overflow-hidden p-5 pl-7"
          >
            <span
              aria-hidden
              className={clsx(
                "absolute inset-y-0 left-0 w-2 border-r-2 border-outline",
                win ? "bg-gain" : trade.pnl < 0 ? "bg-loss" : "bg-plank",
              )}
            />
            <p className="label">Net P&amp;L</p>
            <p className={clsx("font-display text-5xl font-semibold tracking-tight", pnlClass(trade.pnl))}>
              {formatPnl(trade.pnl)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {win
                ? "A good rain for the crops. 🌧️"
                : trade.pnl < 0
                  ? "A dry day — but journaling it still waters the plot."
                  : "Scratch. Still counts."}
            </p>
          </section>

          <section className="panel grid grid-cols-2 gap-2 p-2 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="min-w-0 rounded-sm border-2 border-outline bg-soil/60 p-3 shadow-[inset_0_3px_0_0_rgba(0,0,0,0.35)]">
                <p className="label !mb-1">{f.label}</p>
                <p className="font-mono text-sm">{f.value}</p>
              </div>
            ))}
          </section>

          {trade.notes && (
            <section className="panel p-5">
              <h2 className="label">Notes</h2>
              <p className="whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
            </section>
          )}

          <section className="panel p-5">
            <h2 className="label">Screenshots</h2>
            <ScreenshotGallery images={images} />
          </section>
        </div>

        <aside className="space-y-5">
          {plot && (
            <Link href={`/accounts/${plot.id}`} className="panel flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
              <PlotPreview
                crop={plot.crop}
                stage={getGrowthStage(plot.water_count ?? 0)}
                state={getPlotState(plot)}
                size={72}
                animated
                className="shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate font-display text-lg">{plot.plot_name}</p>
                <p className="truncate text-xs text-muted">{plot.name}</p>
                <p className="mt-0.5 truncate text-xs text-leaf">{PLOT_STATE_LABEL[getPlotState(plot)]}</p>
              </div>
            </Link>
          )}
          <section className="panel space-y-4 p-4">
            <div>
              <p className="label">Setup</p>
              <p>{trade.setup ?? <span className="text-muted">—</span>}</p>
            </div>
            <div>
              <p className="label">Tags</p>
              {trade.tags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {trade.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/journal?tag=${encodeURIComponent(t)}`}
                      className="chip text-leaf hover:brightness-125"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted">—</p>
              )}
            </div>
            <div>
              <p className="label">Emotion</p>
              <p>{emotion ? `${emotion.emoji} ${emotion.label}` : <span className="text-muted">—</span>}</p>
            </div>
            <div>
              <p className="label">Execution</p>
              {trade.rating ? <StarRating value={trade.rating} size={18} /> : <p className="text-muted">—</p>}
            </div>
            <div>
              <p className="label">Followed plan</p>
              <p>
                {trade.followed_plan === null ? (
                  <span className="text-muted">—</span>
                ) : trade.followed_plan ? (
                  <span className="text-gain">Yes 👍</span>
                ) : (
                  <span className="text-loss">No 👎</span>
                )}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
