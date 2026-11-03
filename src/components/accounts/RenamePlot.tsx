"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { renamePlot } from "@/app/(app)/accounts/actions";

export function RenamePlot({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [shown, setShown] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    const next = draft.trim();
    if (next === shown) {
      setEditing(false);
      return;
    }
    if (!next) {
      setError("Every plot needs a name on its sign.");
      return;
    }
    startTransition(async () => {
      const res = await renamePlot(id, next);
      if (res.error) {
        setError(res.error);
        return;
      }
      setShown(next);
      setError(null);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className="group flex items-center gap-2">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">{shown}</h1>
        <button
          type="button"
          onClick={() => {
            setDraft(shown);
            setEditing(true);
          }}
          className="rounded-sm border-2 border-transparent p-1.5 text-muted opacity-70 transition hover:border-outline hover:bg-wood hover:text-cream group-hover:opacity-100"
          title="Rename plot"
          aria-label="Rename plot"
        >
          <Pencil size={18} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          autoFocus
          value={draft}
          maxLength={40}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          className="input max-w-sm font-display text-2xl sm:text-3xl"
          aria-label="Plot name"
        />
        <button type="submit" className="btn-primary px-3" disabled={pending} aria-label="Save name">
          {pending ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}
        </button>
        <button type="button" className="btn-ghost px-3" onClick={() => setEditing(false)} aria-label="Cancel rename">
          <X size={18} />
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs font-semibold text-loss">{error}</p>}
    </div>
  );
}
