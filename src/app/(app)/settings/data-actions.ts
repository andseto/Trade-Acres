"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

export interface DataResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

export interface ExportResult {
  error?: string;
  json?: string;
  tradesCsv?: string;
  filename?: string;
}

export type ClearScope = "trades" | "journal" | "plots" | "everything";
const SCOPES: ClearScope[] = ["trades", "journal", "plots", "everything"];
const CONFIRM_WORD = "DELETE";
const PAGE = 1000;
const BUCKET = "screenshots";

// ───────────────────────────── helpers ─────────────────────────────

/** Read every row the user owns (Supabase returns at most 1000 per request). */
async function fetchAll(supabase: Supabase, table: string, userId: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

const shotsOf = (rows: Record<string, unknown>[]) =>
  rows.flatMap((r) => (Array.isArray(r.screenshots) ? (r.screenshots as string[]) : []));

/** Every file this user has in storage (their folder is named after their id). */
async function listOwnFiles(supabase: Supabase, userId: string): Promise<string[]> {
  const paths: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data } = await supabase.storage.from(BUCKET).list(userId, { limit: 100, offset });
    if (!data?.length) break;
    paths.push(...data.filter((f) => f.id).map((f) => `${userId}/${f.name}`));
    if (data.length < 100) break;
  }
  return paths;
}

async function removeFiles(supabase: Supabase, userId: string, paths: string[]) {
  const own = [...new Set(paths)].filter((p) => p.startsWith(`${userId}/`));
  for (let i = 0; i < own.length; i += 100) {
    await supabase.storage.from(BUCKET).remove(own.slice(i, i + 100));
  }
}

const csvCell = (v: unknown, text = false): string => {
  let s = v === null || v === undefined ? "" : String(v);
  // stop spreadsheet apps from running text that starts like a formula
  if (text && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ───────────────────────────── export ─────────────────────────────

export async function exportDataAction(): Promise<ExportResult> {
  const { supabase, user } = await requireUser();
  try {
    const [profileRes, plots, trades, entries] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      fetchAll(supabase, "accounts", user.id),
      fetchAll(supabase, "trades", user.id),
      fetchAll(supabase, "journal_entries", user.id),
    ]);

    const exportedAt = new Date().toISOString();
    const json = JSON.stringify(
      {
        app: "Trade Acres",
        exported_at: exportedAt,
        account: { id: user.id, email: user.email ?? null },
        profile: profileRes.data ?? null,
        plots,
        trades,
        journal_entries: entries,
        note: "Screenshots are listed by storage path; the image files themselves are not included in this export.",
      },
      null,
      2,
    );

    const plotName = new Map(plots.map((p) => [String(p.id), String(p.plot_name ?? "")]));
    const accountName = new Map(plots.map((p) => [String(p.id), String(p.name ?? "")]));
    const header = ["date", "plot", "account", "symbol", "direction", "quantity", "entry", "exit", "pnl", "fees", "r_multiple", "emotion", "rating", "followed_plan", "notes"];
    const lines = [header.join(",")];
    for (const t of [...trades].sort((a, b) => String(a.trade_date).localeCompare(String(b.trade_date)))) {
      lines.push(
        [
          csvCell(t.trade_date),
          csvCell(plotName.get(String(t.account_id)), true),
          csvCell(accountName.get(String(t.account_id)), true),
          csvCell(t.symbol, true),
          csvCell(t.direction),
          csvCell(t.quantity),
          csvCell(t.entry_price),
          csvCell(t.exit_price),
          csvCell(t.pnl),
          csvCell(t.fees),
          csvCell(t.r_multiple),
          csvCell(t.emotion),
          csvCell(t.rating),
          csvCell(t.followed_plan),
          csvCell(t.notes, true),
        ].join(","),
      );
    }

    return { json, tradesCsv: lines.join("\n"), filename: `trade-acres-export-${exportedAt.slice(0, 10)}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't build your export. Try again." };
  }
}

// ───────────────────────────── clear data ─────────────────────────────

export async function clearDataAction(scope: ClearScope, confirmation: string): Promise<DataResult> {
  const { supabase, user } = await requireUser();
  if (!SCOPES.includes(scope)) return { error: "Unknown option." };
  if (confirmation.trim() !== CONFIRM_WORD) return { error: `Type ${CONFIRM_WORD} to confirm.` };

  try {
    let files: string[] = [];
    const counts: string[] = [];

    const del = async (table: string, label: string) => {
      const { error, count } = await supabase.from(table).delete({ count: "exact" }).eq("user_id", user.id);
      if (error) throw new Error(error.message);
      counts.push(`${count ?? 0} ${label}`);
    };

    if (scope === "trades") {
      files = shotsOf(await fetchAll(supabase, "trades", user.id));
      await del("trades", "trades");
    } else if (scope === "journal") {
      files = shotsOf(await fetchAll(supabase, "journal_entries", user.id));
      await del("journal_entries", "journal entries");
    } else if (scope === "plots") {
      // plots take their trades and plot-specific journal entries with them (ON DELETE CASCADE)
      const [trades, entries] = await Promise.all([fetchAll(supabase, "trades", user.id), fetchAll(supabase, "journal_entries", user.id)]);
      files = [...shotsOf(trades), ...shotsOf(entries.filter((e) => e.account_id))];
      await del("accounts", "plots");
    } else {
      files = await listOwnFiles(supabase, user.id);
      await del("trades", "trades");
      await del("journal_entries", "journal entries");
      await del("accounts", "plots");
    }

    await removeFiles(supabase, user.id, files);
    revalidatePath("/", "layout");
    return { ok: true, message: `Cleared ${counts.join(", ")}${files.length ? ` and ${new Set(files).size} screenshot${new Set(files).size === 1 ? "" : "s"}` : ""}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong clearing your data." };
  }
}

// ───────────────────────────── delete account ─────────────────────────────

export async function deleteAccountAction(confirmation: string): Promise<DataResult> {
  const { supabase, user } = await requireUser();
  if (confirmation.trim() !== CONFIRM_WORD) return { error: `Type ${CONFIRM_WORD} to confirm.` };

  // remember the files first — once the login is gone we can no longer list them
  const files = await listOwnFiles(supabase, user.id).catch(() => [] as string[]);

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (error.code === "PGRST202" || /could not find the function/i.test(error.message)) {
      return { error: "Account deletion isn't switched on for this server yet. The site owner needs to run migration 0003_account_tools.sql." };
    }
    return { error: error.message };
  }

  await removeFiles(supabase, user.id, files).catch(() => {});
  // the session belonged to the account we just deleted
  const fresh = await createClient();
  await fresh.auth.signOut().catch(() => {});
  revalidatePath("/", "layout");
  redirect("/?goodbye=1");
}
