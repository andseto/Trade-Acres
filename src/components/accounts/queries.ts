import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { normalizeAccount } from "./stats";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads one of the signed-in user's accounts or 404s. Server-only. */
export async function getOwnAccount(id: string) {
  if (!UUID_RE.test(id)) notFound();
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("accounts").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();
  return { supabase, user, account: normalizeAccount(data) };
}
