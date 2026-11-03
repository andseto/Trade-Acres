"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { friendlyAuthError } from "@/components/auth/redirects";
import { isSeason } from "@/lib/farm";

export interface SettingsState {
  ok?: boolean;
  error?: string;
  message?: string;
}


const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function updateProfileAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase, user } = await requireUser();

  const displayName = str(formData, "display_name").slice(0, 40);
  const usernameRaw = str(formData, "username").replace(/^@/, "").toLowerCase();
  const username = usernameRaw || null;

  if (!displayName) return { error: "Display name can't be empty — the farmhands need something to call you." };
  if (username && !USERNAME_RE.test(username)) {
    return { error: "Usernames are 3–20 characters: lowercase letters, numbers and underscores." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: displayName, username }, { onConflict: "id" });

  if (error) {
    if (error.code === "23505") return { error: `@${username} is already taken. Someone else staked that claim first.` };
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved. Looking sharp in those overalls." };
}

export async function updateSeasonAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase, user } = await requireUser();
  const season = str(formData, "farm_season");
  if (!isSeason(season)) return { error: "Pick one of the four seasons." };

  const { error } = await supabase.from("profiles").upsert({ id: user.id, farm_season: season }, { onConflict: "id" });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "The seasons have turned. Your farm looks great." };
}

export async function changePasswordAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireUser();
  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (password.length < 8) return { error: "Passwords need at least 8 characters." };
  if (password !== confirm) return { error: "Those passwords don't match." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendlyAuthError(error.message) };
  return { ok: true, message: "Password updated. Locked tighter than a daily loss limit." };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function changeEmailAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase, user } = await requireUser();
  const email = str(formData, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "That doesn't look like an email address." };
  if (email === (user.email ?? "").toLowerCase()) return { error: "That's already your email." };

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: friendlyAuthError(error.message) };
  return { ok: true, message: "Check your inbox. Open the confirmation link to finish switching your email." };
}

/** Sign out of every device, not just this one. */
export async function signOutEverywhereAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
