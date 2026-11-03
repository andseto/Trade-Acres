"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import clsx from "clsx";
import { Loader2, Star, Trash2, X } from "lucide-react";
import { AllPlotsIcon, PlotIcon } from "./PlotIcon";
import type { Emotion, Mood } from "@/lib/types";
import { EMOTIONS, MOODS } from "./constants";
import { tileClass } from "./styles";
import type { PlotAccount } from "./normalize";

/** true after hydration — use to render timezone-dependent values without mismatches. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Renders an ISO timestamp in the viewer's local time. */
export function LocalTime({ iso, withDate = false }: { iso: string; withDate?: boolean }) {
  const hydrated = useHydrated();
  if (!hydrated) return <span className="opacity-0">--:--</span>;
  const d = new Date(iso);
  return (
    <time dateTime={iso}>
      {withDate ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " : ""}
      {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
    </time>
  );
}

// ───────────────────────────── plot (account) picker ─────────────────────────────

export function PlotPicker({
  accounts,
  value,
  onChange,
  allowAll,
}: {
  accounts: PlotAccount[];
  value: string | null;
  onChange: (id: string | null) => void;
  /** show an "All my plots" option (value null) */
  allowAll?: boolean;
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {allowAll && (
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          onClick={() => onChange(null)}
          className={clsx(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-left",
            tileClass(value === null),
          )}
        >
          <AllPlotsIcon size={40} className="shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] text-cream">All my plots</span>
            <span className="block truncate text-xs">Waters every active plot</span>
          </span>
        </button>
      )}
      {accounts.map((a) => {
        const active = value === a.id;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(a.id)}
            className={clsx(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-left",
              tileClass(active),
            )}
          >
            <PlotIcon plot={a} size={40} animated={active} className="shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] text-cream">
                {a.plot_name}
                {a.status === "passed" && <span className="ml-1" title="Harvested">🌾</span>}
              </span>
              <span className="block truncate text-xs">
                {a.name}
                {a.firm ? ` · ${a.firm}` : ""}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Copy trading: tick every plot the same trade was taken on. Each ticked plot gets its own trade. */
export function MultiPlotPicker({
  accounts,
  value,
  onChange,
}: {
  accounts: PlotAccount[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const allSelected = accounts.length > 0 && value.length === accounts.length;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : accounts.map((a) => a.id))}
          className="btn-ghost !px-3 !py-1.5 !text-[13px]"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
        <span className="text-xs text-muted">
          {value.length === 0
            ? "Pick one or more plots. Copy trades log once per plot."
            : `${value.length} of ${accounts.length} plot${accounts.length === 1 ? "" : "s"} selected`}
        </span>
      </div>
      <div role="group" aria-label="Plots" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const active = value.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggle(a.id)}
              className={clsx("flex items-center gap-3 rounded-md px-3 py-2.5 text-left", tileClass(active))}
            >
              <PlotIcon plot={a} size={40} animated={active} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[15px] text-cream">
                  {a.plot_name}
                  {a.status === "passed" && <span className="ml-1" title="Harvested">🌾</span>}
                </span>
                <span className="block truncate text-xs">
                  {a.name}
                  {a.firm ? ` · ${a.firm}` : ""}
                </span>
              </span>
              <span
                aria-hidden
                className={clsx(
                  "flex h-5 w-5 shrink-0 items-center justify-center border-[3px] border-outline text-[13px] font-bold leading-none",
                  active ? "bg-leaf text-[#1d2b0c]" : "bg-soil/60 text-transparent",
                )}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────── pickers ─────────────────────────────

export function EmotionPicker({ value, onChange }: { value: Emotion | null; onChange: (v: Emotion | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EMOTIONS.map((e) => {
        const active = value === e.id;
        return (
          <button
            key={e.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : e.id)}
            className={clsx(
              "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm",
              tileClass(active),
            )}
          >
            <span className={clsx("text-lg transition", active && "scale-125")}>{e.emoji}</span>
            {e.label}
          </button>
        );
      })}
    </div>
  );
}

export function MoodPicker({ value, onChange }: { value: Mood | null; onChange: (v: Mood | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((m) => {
        const active = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : m.id)}
            className={clsx(
              "flex min-w-16 flex-col items-center gap-0.5 rounded-md px-3 py-2 text-xs font-semibold",
              tileClass(active),
            )}
          >
            <span className={clsx("text-2xl transition", active && "scale-125")}>{m.emoji}</span>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

export function StarRating({
  value,
  onChange,
  size = 22,
}: {
  value: number | null;
  onChange?: (v: number | null) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  if (!onChange) {
    return (
      <span className="inline-flex gap-0.5" aria-label={`${value ?? 0} of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} className={n <= (value ?? 0) ? "fill-gold text-gold" : "text-plank"} />
        ))}
      </span>
    );
  }
  return (
    <div className="inline-flex gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(value === n ? null : n)}
          className="transition-transform hover:-translate-y-0.5"
        >
          <Star size={size} className={n <= shown ? "fill-gold text-gold" : "text-plank"} />
        </button>
      ))}
    </div>
  );
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  listId,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  listId: string;
}) {
  const [draft, setDraft] = useState("");
  function commit(raw: string) {
    const parts = raw
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);
    if (!parts.length) return;
    onChange([...new Set([...value, ...parts])].slice(0, 20));
    setDraft("");
  }
  return (
    <div className="input flex min-h-11 flex-wrap items-center gap-1.5 !py-1.5">
      {value.map((t) => (
        <span key={t} className="chip !bg-[#5e9a2a] text-[#f3fbe4] !shadow-[inset_0_2px_0_0_#8cc84b]">
          #{t}
          <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        list={listId}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) commit(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={value.length ? "" : "a+ setup, news, overtraded…"}
        className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-[#9a7b55]"
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}

// ───────────────────────────── delete w/ confirm ─────────────────────────────

export function DeleteButton({
  action,
  label = "Delete",
  confirmText,
}: {
  action: () => Promise<{ error: string } | undefined>;
  label?: string;
  confirmText: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <button type="button" className="btn-ghost text-loss" onClick={() => setConfirming(true)}>
        <Trash2 size={16} /> {label}
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border-[3px] border-outline bg-[#4a1f17] px-3 py-2 shadow-[inset_0_2px_0_0_#7a3226]">
      <span className="text-sm">{confirmText}</span>
      <button
        type="button"
        className="btn-danger !py-1.5"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await action();
            if (res?.error) setError(res.error);
          })
        }
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Yes, delete
      </button>
      <button type="button" className="btn-ghost !py-1.5" disabled={pending} onClick={() => setConfirming(false)}>
        Cancel
      </button>
      {error && <span className="w-full text-xs text-loss">{error}</span>}
    </div>
  );
}
