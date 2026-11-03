import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { EntryForm } from "@/components/journal/EntryForm";
import { PageHeader } from "@/components/journal/PageHeader";
import { waterable, isDateKey, loadPlots, sp, type SearchParams } from "@/components/journal/server";

export const metadata: Metadata = { title: "Daily journal · Trade Acres" };

export default async function NewEntryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const accounts = waterable(await loadPlots(supabase, user.id));
  const date = sp(params.date);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Daily journal 📓"
        subtitle="Plan the session, review the session. Every page waters the farm."
        back={{ href: "/journal?view=entries", label: "Journal" }}
      />
      <EntryForm
        userId={user.id}
        accounts={accounts}
        defaultAccountId={sp(params.account) || null}
        defaultDate={isDateKey(date) ? date : null}
      />
    </div>
  );
}
