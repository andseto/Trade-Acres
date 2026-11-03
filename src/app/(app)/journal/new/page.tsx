import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { TradeForm } from "@/components/journal/TradeForm";
import { NoPlots, PageHeader } from "@/components/journal/PageHeader";
import { waterable, isDateKey, loadPlots, loadSuggestions, sp, type SearchParams } from "@/components/journal/server";

export const metadata: Metadata = { title: "Log a trade · Trade Acres" };

export default async function NewTradePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const [allPlots, suggestions] = await Promise.all([loadPlots(supabase, user.id), loadSuggestions(supabase, user.id)]);
  const accounts = waterable(allPlots);
  const date = sp(params.date);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Log a trade 🌱"
        subtitle="Journal it while it's fresh — your plot is thirsty."
        back={{ href: "/journal", label: "Journal" }}
      />
      {accounts.length === 0 ? (
        <NoPlots />
      ) : (
        <TradeForm
          userId={user.id}
          accounts={accounts}
          suggestions={suggestions}
          defaultAccountId={sp(params.account) || null}
          defaultDate={isDateKey(date) ? date : null}
        />
      )}
    </div>
  );
}
