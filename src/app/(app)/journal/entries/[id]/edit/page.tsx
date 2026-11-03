import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { EntryForm } from "@/components/journal/EntryForm";
import { PageHeader } from "@/components/journal/PageHeader";
import { normalizeEntry } from "@/components/journal/normalize";
import { waterable, isUuid, loadPlots, signScreenshots } from "@/components/journal/server";

export const metadata: Metadata = { title: "Edit journal entry · Trade Acres" };

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [allPlots, images] = await Promise.all([loadPlots(supabase, user.id), signScreenshots(supabase, entry.screenshots)]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Edit journal entry" back={{ href: `/journal/entries/${entry.id}`, label: "Back to entry" }} />
      <EntryForm userId={user.id} accounts={waterable(allPlots, entry.account_id)} entry={entry} initialShots={images} />
    </div>
  );
}
