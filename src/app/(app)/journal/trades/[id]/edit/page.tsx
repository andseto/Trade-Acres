import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { TradeForm } from "@/components/journal/TradeForm";
import { PageHeader } from "@/components/journal/PageHeader";
import { normalizeTrade } from "@/components/journal/normalize";
import { waterable, isUuid, loadPlots, loadSuggestions, signScreenshots } from "@/components/journal/server";

export const metadata: Metadata = { title: "Edit trade · Trade Acres" };

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, user } = await requireUser();

  const { data: row } = await supabase.from("trades").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!row) notFound();
  const trade = normalizeTrade(row);

  const [allPlots, suggestions, images] = await Promise.all([
    loadPlots(supabase, user.id),
    loadSuggestions(supabase, user.id),
    signScreenshots(supabase, trade.screenshots),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={`Edit ${trade.symbol} trade`} back={{ href: `/journal/trades/${trade.id}`, label: "Back to trade" }} />
      <TradeForm
        userId={user.id}
        accounts={waterable(allPlots, trade.account_id)}
        trade={trade}
        initialShots={images}
        suggestions={suggestions}
      />
    </div>
  );
}
