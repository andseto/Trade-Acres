import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Pencil } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { formatPnl, pnlClass } from "@/lib/format";
import { PlotPreview } from "@/components/farm/PlotPreview";
import { AllPlotsIcon } from "@/components/journal/PlotIcon";
import { getGrowthStage, getPlotState, PLOT_STATE_LABEL } from "@/lib/farm";
import { PageHeader } from "@/components/journal/PageHeader";
import { ScreenshotGallery } from "@/components/journal/ScreenshotGallery";
import { DeleteButton } from "@/components/journal/FormBits";
import { MOOD_BY_ID } from "@/components/journal/constants";
import { PLOT_ACCOUNT_COLUMNS, normalizeEntry, type PlotAccount } from "@/components/journal/normalize";
import { isUuid, signScreenshots } from "@/components/journal/server";
import { deleteEntry } from "../../actions";

export const metadata: Metadata = { title: "Journal entry · Trade Acres" };

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, user } = await requireUser();

  const { data: row } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) notFound();
  const entry = normalizeEntry(row);

  let dayTrades = supabase
    .from("trades")
    .select("id, symbol, direction, pnl")
    .eq("user_id", user.id)
    .eq("trade_date", entry.entry_date)
    .order("created_at", { ascending: true });
  if (entry.account_id) dayTrades = dayTrades.eq("account_id", entry.account_id);

  const [accRes, tradesRes, images] = await Promise.all([
    entry.account_id
      ? supabase.from("accounts").select(PLOT_ACCOUNT_COLUMNS).eq("id", entry.account_id).maybeSingle()
      : Promise.resolve({ data: null }),
    dayTrades,
    signScreenshots(supabase, entry.screenshots),
  ]);
  const plot = accRes.data as PlotAccount | null;
  const trades = (tradesRes.data ?? []) as { id: string; symbol: string; direction: string; pnl: number | string }[];
  const dayNet = trades.reduce((s, t) => s + Number(t.pnl), 0);
  const mood = entry.mood ? MOOD_BY_ID[entry.mood] : null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back={{ href: "/journal?view=entries", label: "Journal" }}
        title={
          <span className="flex items-center gap-3">
            {mood && <span title={mood.label}>{mood.emoji}</span>}
            <span>{entry.title || "Daily journal"}</span>
          </span>
        }
        subtitle={format(parseISO(entry.entry_date), "EEEE, MMMM d, yyyy")}
      >
        <Link href={`/journal/entries/${entry.id}/edit`} className="btn-ghost">
          <Pencil size={16} /> Edit
        </Link>
        <DeleteButton action={deleteEntry.bind(null, entry.id)} confirmText="Delete this journal entry?" />
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <section className="panel p-5">
            <h2 className="label">Plan / review</h2>
            {entry.body ? (
              <p className="whitespace-pre-wrap leading-relaxed">{entry.body}</p>
            ) : (
              <p className="text-muted">Nothing written here.</p>
            )}
          </section>
          {entry.lessons && (
            <section className="panel relative overflow-hidden p-5 pl-7">
              <span aria-hidden className="absolute inset-y-0 left-0 w-2 border-r-2 border-outline bg-gold" />
              <h2 className="label !text-gold">💡 Lessons learned</h2>
              <p className="whitespace-pre-wrap leading-relaxed">{entry.lessons}</p>
            </section>
          )}
          <section className="panel p-5">
            <h2 className="label">Screenshots</h2>
            <ScreenshotGallery images={images} />
          </section>
        </div>

        <aside className="space-y-5">
          <div className="panel flex items-center gap-3 p-4">
            {plot ? (
              <>
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
              </>
            ) : (
              <>
                <AllPlotsIcon size={64} className="shrink-0" />
                <div>
                  <p className="font-display text-lg">All my plots</p>
                  <p className="text-xs text-muted">Watered the whole farm</p>
                </div>
              </>
            )}
          </div>
          <section className="panel p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="label">That day&apos;s trades</h2>
              {trades.length > 0 && <span className={`font-mono text-sm ${pnlClass(dayNet)}`}>{formatPnl(dayNet)}</span>}
            </div>
            {trades.length === 0 ? (
              <p className="text-sm text-muted">No trades logged.</p>
            ) : (
              <ul className="divide-y-2 divide-outline/60">
                {trades.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/journal/trades/${t.id}`}
                      className="flex items-center justify-between py-2 text-sm hover:text-leaf"
                    >
                      <span className="font-mono">
                        {t.symbol} <span className="text-xs text-muted">{t.direction}</span>
                      </span>
                      <span className={`font-mono ${pnlClass(Number(t.pnl))}`}>{formatPnl(Number(t.pnl))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
