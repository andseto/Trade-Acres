"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import type { Direction, Emotion, Mood } from "@/lib/types";

export type ActionResult = { error: string } | undefined;

export interface TradeInput {
  account_id: string;
  symbol: string;
  direction: Direction;
  quantity: number | null;
  entry_price: number | null;
  exit_price: number | null;
  pnl: number;
  fees: number;
  r_multiple: number | null;
  trade_date: string;
  emotion: Emotion | null;
  rating: number | null;
  followed_plan: boolean | null;
  notes: string | null;
  screenshots: string[];
}

/** Copy trading: the same trade logged on several plots at once. */
export type CopyTradeInput = Omit<TradeInput, "account_id"> & { account_ids: string[] };

export interface EntryInput {
  account_id: string | null;
  entry_date: string;
  title: string | null;
  mood: Mood | null;
  body: string | null;
  lessons: string | null;
  screenshots: string[];
}

const EMOTIONS: Emotion[] = ["calm", "confident", "fomo", "revenge", "fearful", "greedy", "bored"];
const MOODS: Mood[] = ["great", "good", "meh", "bad", "awful"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function revalidateAll() {
  revalidatePath("/journal", "layout");
  revalidatePath("/calendar");
  revalidatePath("/farm");
  revalidatePath("/accounts", "layout");
}

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const textOrNull = (v: unknown, max = 20000): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};
const ownPaths = (paths: unknown, userId: string): string[] =>
  Array.isArray(paths)
    ? paths.filter((p): p is string => typeof p === "string" && p.startsWith(`${userId}/`) && !p.includes("..")).slice(0, 30)
    : [];

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

/**
 * Delete screenshots from storage — but only the ones no other trade or journal entry still points at
 * (copy-traded trades share the same uploaded files).
 */
async function removeUnreferenced(supabase: Supabase, userId: string, paths: string[], exceptTradeId?: string) {
  if (!paths.length) return;
  let tradesQ = supabase.from("trades").select("screenshots").eq("user_id", userId).overlaps("screenshots", paths);
  if (exceptTradeId) tradesQ = tradesQ.neq("id", exceptTradeId);
  const [{ data: trades }, { data: entries }] = await Promise.all([
    tradesQ,
    supabase.from("journal_entries").select("screenshots").eq("user_id", userId).overlaps("screenshots", paths),
  ]);
  const inUse = new Set<string>();
  for (const r of [...(trades ?? []), ...(entries ?? [])]) for (const p of (r.screenshots as string[] | null) ?? []) inUse.add(p);
  const orphaned = paths.filter((p) => !inUse.has(p));
  if (orphaned.length) await supabase.storage.from("screenshots").remove(orphaned);
}

function cleanTrade(input: TradeInput, userId: string): { error: string } | { row: Record<string, unknown> } {
  const symbol = String(input.symbol ?? "").trim().toUpperCase().slice(0, 32);
  if (!input.account_id) return { error: "Pick which plot this trade waters." };
  if (!symbol) return { error: "Symbol is required." };
  if (input.direction !== "long" && input.direction !== "short") return { error: "Pick Long or Short." };
  const pnl = numOrNull(input.pnl);
  if (pnl === null) return { error: "Net P&L is required." };
  if (!DATE_RE.test(String(input.trade_date))) return { error: "Trade date is invalid." };
  const rating = numOrNull(input.rating);
  return {
    row: {
      account_id: input.account_id,
      symbol,
      direction: input.direction,
      quantity: numOrNull(input.quantity),
      entry_price: numOrNull(input.entry_price),
      exit_price: numOrNull(input.exit_price),
      pnl: Math.round(pnl * 100) / 100,
      fees: numOrNull(input.fees) ?? 0,
      r_multiple: numOrNull(input.r_multiple) === null ? null : Math.round(Number(input.r_multiple) * 100) / 100,
      trade_date: input.trade_date,
      emotion: input.emotion && EMOTIONS.includes(input.emotion) ? input.emotion : null,
      rating: rating && rating >= 1 && rating <= 5 ? Math.round(rating) : null,
      followed_plan: typeof input.followed_plan === "boolean" ? input.followed_plan : null,
      notes: textOrNull(input.notes),
      screenshots: ownPaths(input.screenshots, userId),
    },
  };
}

function cleanEntry(input: EntryInput, userId: string): { error: string } | { row: Record<string, unknown> } {
  if (!DATE_RE.test(String(input.entry_date))) return { error: "Date is invalid." };
  const row = {
    account_id: input.account_id || null,
    entry_date: input.entry_date,
    title: textOrNull(input.title, 200),
    mood: input.mood && MOODS.includes(input.mood) ? input.mood : null,
    body: textOrNull(input.body),
    lessons: textOrNull(input.lessons),
    screenshots: ownPaths(input.screenshots, userId),
  };
  if (!row.title && !row.body && !row.lessons && !row.mood && row.screenshots.length === 0) {
    return { error: "Write at least a little something — a blank page won't water anything." };
  }
  return { row };
}

// ───────────────────────────── trades ─────────────────────────────

export async function createTrade(input: CopyTradeInput): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const ids = [...new Set((Array.isArray(input.account_ids) ? input.account_ids : []).filter(Boolean))].slice(0, 50);
  if (!ids.length) return { error: "Pick at least one plot this trade waters." };

  const rows: Record<string, unknown>[] = [];
  for (const account_id of ids) {
    const cleaned = cleanTrade({ ...input, account_id }, user.id);
    if ("error" in cleaned) return cleaned;
    rows.push({ ...cleaned.row, user_id: user.id });
  }

  const { data: owned } = await supabase.from("accounts").select("id").eq("user_id", user.id).in("id", ids);
  if ((owned ?? []).length !== ids.length) return { error: "One of those plots isn't on your farm." };

  const { error } = await supabase.from("trades").insert(rows);
  if (error) return { error: error.message };

  revalidateAll();
  redirect(`/farm?watered=${ids.join(",")}`);
}

export async function updateTrade(id: string, input: TradeInput): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const cleaned = cleanTrade(input, user.id);
  if ("error" in cleaned) return cleaned;

  const { data: existing } = await supabase
    .from("trades")
    .select("id, screenshots")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Trade not found." };

  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", cleaned.row.account_id as string)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!account) return { error: "That plot isn't on your farm." };

  const { error } = await supabase.from("trades").update(cleaned.row).eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  const kept = new Set(cleaned.row.screenshots as string[]);
  const removed = ((existing.screenshots as string[] | null) ?? []).filter((p) => !kept.has(p));
  await removeUnreferenced(supabase, user.id, removed, id);

  revalidateAll();
  redirect(`/journal/trades/${id}`);
}

export async function deleteTrade(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase
    .from("trades")
    .select("id, screenshots")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Trade not found." };

  const { error } = await supabase.from("trades").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  await removeUnreferenced(supabase, user.id, (existing.screenshots as string[] | null) ?? []);

  revalidateAll();
  redirect("/journal");
}

// ───────────────────────────── journal entries ─────────────────────────────

export async function createEntry(input: EntryInput): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const cleaned = cleanEntry(input, user.id);
  if ("error" in cleaned) return cleaned;

  if (cleaned.row.account_id) {
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", cleaned.row.account_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!account) return { error: "That plot isn't on your farm." };
  }

  const { error } = await supabase.from("journal_entries").insert({ ...cleaned.row, user_id: user.id });
  if (error) return { error: error.message };

  revalidateAll();
  redirect(`/farm?watered=${cleaned.row.account_id ?? "all"}`);
}

export async function updateEntry(id: string, input: EntryInput): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const cleaned = cleanEntry(input, user.id);
  if ("error" in cleaned) return cleaned;

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id, screenshots")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Journal entry not found." };

  if (cleaned.row.account_id) {
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", cleaned.row.account_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!account) return { error: "That plot isn't on your farm." };
  }

  const { error } = await supabase.from("journal_entries").update(cleaned.row).eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  const kept = new Set(cleaned.row.screenshots as string[]);
  const removed = ((existing.screenshots as string[] | null) ?? []).filter((p) => !kept.has(p));
  if (removed.length) await supabase.storage.from("screenshots").remove(removed);

  revalidateAll();
  redirect(`/journal/entries/${id}`);
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id, screenshots")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Journal entry not found." };

  const { error } = await supabase.from("journal_entries").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  const shots = (existing.screenshots as string[] | null) ?? [];
  if (shots.length) await supabase.storage.from("screenshots").remove(shots);

  revalidateAll();
  redirect("/journal?view=entries");
}
