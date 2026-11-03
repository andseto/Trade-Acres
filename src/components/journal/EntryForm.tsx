"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { JournalEntry, Mood } from "@/lib/types";
import { toDateKey } from "@/lib/format";
import { createEntry, updateEntry, type EntryInput } from "@/app/(app)/journal/actions";
import { PlotPicker, MoodPicker } from "./FormBits";
import { ScreenshotUploader, uploadPendingShots, type ShotItem } from "./ScreenshotUploader";
import type { GalleryImage } from "./ScreenshotGallery";
import type { PlotAccount } from "./normalize";

export function EntryForm({
  userId,
  accounts,
  entry,
  initialShots = [],
  defaultAccountId,
  defaultDate,
}: {
  userId: string;
  accounts: PlotAccount[];
  entry?: JournalEntry;
  initialShots?: GalleryImage[];
  defaultAccountId?: string | null;
  defaultDate?: string | null;
}) {
  const editing = !!entry;
  const [accountId, setAccountId] = useState<string | null>(
    entry ? entry.account_id : defaultAccountId && accounts.some((a) => a.id === defaultAccountId) ? defaultAccountId : null,
  );
  const [date, setDate] = useState(entry?.entry_date ?? defaultDate ?? toDateKey());
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [lessons, setLessons] = useState(entry?.lessons ?? "");
  const [shots, setShots] = useState<ShotItem[]>(() =>
    initialShots.map((s) => ({ key: s.path, path: s.path, url: s.url ?? undefined })),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const busy = pending || uploading;

  const plot = accounts.find((a) => a.id === accountId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let uploaded = shots;
      try {
        if (shots.some((s) => !s.path)) {
          setUploading(true);
          uploaded = await uploadPendingShots(shots, userId);
          setShots(uploaded);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Screenshot upload failed.");
        return;
      } finally {
        setUploading(false);
      }
      const input: EntryInput = {
        account_id: accountId,
        entry_date: date,
        title: title.trim() || null,
        mood,
        body: body.trim() || null,
        lessons: lessons.trim() || null,
        screenshots: uploaded.map((s) => s.path!).filter(Boolean),
      };
      const res = editing ? await updateEntry(entry!.id, input) : await createEntry(input);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="panel space-y-4 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <label className="label" htmlFor="entry-date">Date</label>
            <input id="entry-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="entry-title">Title</label>
            <input
              id="entry-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="CPI day — sat on hands until 10am"
              maxLength={200}
            />
          </div>
        </div>
        <div>
          <span className="label">Mood</span>
          <MoodPicker value={mood} onChange={setMood} />
        </div>
      </section>

      {accounts.length > 0 && (
        <section className="panel p-4 sm:p-5">
          <h2 className="mb-3 font-display text-lg">Which plot does this water?</h2>
          <PlotPicker accounts={accounts} value={accountId} onChange={setAccountId} allowAll />
        </section>
      )}

      <section className="panel space-y-4 p-4 sm:p-5">
        <div>
          <label className="label" htmlFor="entry-body">Pre-market plan / review</label>
          <textarea
            id="entry-body"
            rows={8}
            className="input resize-y"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Key levels, bias, news, what A+ looks like today… or how the session actually went."
          />
        </div>
        <div>
          <label className="label" htmlFor="entry-lessons">Lessons learned</label>
          <textarea
            id="entry-lessons"
            rows={4}
            className="input resize-y"
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            placeholder="One thing to keep doing, one thing to stop doing."
          />
        </div>
        <div>
          <span className="label">Screenshots</span>
          <ScreenshotUploader items={shots} onChange={setShots} disabled={busy} />
        </div>
      </section>

      <div className="panel sticky bottom-3 z-10 flex flex-wrap items-center justify-end gap-3 p-3">
        {error && <p className="mr-auto text-sm text-loss">{error}</p>}
        <Link href={editing ? `/journal/entries/${entry!.id}` : "/journal?view=entries"} className="btn-ghost">
          Cancel
        </Link>
        <button type="submit" className="btn-primary min-w-44" disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {uploading ? "Uploading…" : "Saving…"}
            </>
          ) : editing ? (
            "Save changes"
          ) : plot ? (
            <>Water {plot.plot_name} 💧</>
          ) : (
            <>Water all my plots 💧</>
          )}
        </button>
      </div>
    </form>
  );
}
