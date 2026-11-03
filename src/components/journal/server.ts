import { PLOT_ACCOUNT_COLUMNS, type PlotAccount } from "./normalize";
import type { createClient } from "@/lib/supabase/server";
import type { GalleryImage } from "./ScreenshotGallery";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Signed URLs (1h) for private screenshot paths, preserving order. */
export async function signScreenshots(supabase: Supabase, paths: string[]): Promise<GalleryImage[]> {
  if (!paths.length) return [];
  const { data } = await supabase.storage.from("screenshots").createSignedUrls(paths, 60 * 60);
  const byPath = new Map((data ?? []).map((d) => [d.path, d.error ? null : d.signedUrl]));
  return paths.map((path) => ({ path, url: byPath.get(path) ?? null }));
}

/** All the user's accounts (plots), active/passed first. */
export async function loadPlots(supabase: Supabase, userId: string): Promise<PlotAccount[]> {
  const { data } = await supabase
    .from("accounts")
    .select(PLOT_ACCOUNT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  const order = { active: 0, passed: 1, retired: 2, blown: 3 } as const;
  return ((data ?? []) as PlotAccount[]).sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
}

/** Only plots that can still be watered (active / passed), plus an optional id to always keep (editing). */
export function waterable(accounts: PlotAccount[], keepId?: string | null) {
  return accounts.filter((a) => a.status === "active" || a.status === "passed" || a.id === keepId);
}

/** Distinct past symbols / setups / tags for datalists. */
export async function loadSuggestions(supabase: Supabase, userId: string) {
  const { data } = await supabase
    .from("trades")
    .select("symbol, setup, tags")
    .eq("user_id", userId)
    .order("trade_date", { ascending: false })
    .limit(1000);
  const symbols = new Set<string>();
  const setups = new Set<string>();
  const tags = new Set<string>();
  for (const r of (data ?? []) as { symbol: string; setup: string | null; tags: string[] | null }[]) {
    if (r.symbol) symbols.add(r.symbol);
    if (r.setup) setups.add(r.setup);
    for (const t of r.tags ?? []) tags.add(t);
  }
  return { symbols: [...symbols].slice(0, 100), setups: [...setups].slice(0, 100), tags: [...tags].slice(0, 200) };
}

export const isDateKey = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isUuid = (s: unknown): s is string =>
  typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export const sp = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
