"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_NEXT, friendlyAuthError, safeNext } from "./redirects";

export interface AuthFormState {
  error?: string;
  /** success copy shown in place of / above the form */
  message?: string;
  /** signup / magic link: the address we emailed */
  sentTo?: string;
  /** echo back fields so the form keeps them after an error */
  email?: string;
  displayName?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Absolute origin of this site, used to build email / OAuth redirect URLs. */
async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function callbackUrl(origin: string, next: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

// ───────────────────────────── login (password + magic link) ─────────────────────────────

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const intent = str(formData, "intent") === "magic" ? "magic" : "password";
  const email = str(formData, "email").toLowerCase();
  const password = (formData.get("password") as string | null) ?? "";
  const next = safeNext(str(formData, "next"));

  if (!EMAIL_RE.test(email)) return { error: "That doesn't look like an email address.", email };

  const supabase = await createClient();

  if (intent === "magic") {
    const origin = await getOrigin();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(origin, next), shouldCreateUser: false },
    });
    if (error) return { error: friendlyAuthError(error.message), email };
    return {
      email,
      sentTo: email,
      message: "Magic link sent! Open it on this device and you'll land straight on your farm.",
    };
  }

  if (!password) return { error: "Pop in your password — or grab a magic link instead.", email };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendlyAuthError(error.message), email };

  redirect(next);
}

// ───────────────────────────── Google OAuth ─────────────────────────────

/** Ask GoTrue whether the Google provider is enabled, so we can fail politely instead of on a JSON error page. */
async function googleEnabled(): Promise<boolean | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { external?: Record<string, boolean> };
    return Boolean(json.external?.google);
  } catch {
    return null; // unknown — let the redirect try anyway
  }
}

export async function googleAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const next = safeNext(str(formData, "next"));

  if ((await googleEnabled()) === false) {
    return { error: friendlyAuthError("provider is not enabled") };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(origin, next) },
  });
  if (error || !data.url) return { error: friendlyAuthError(error?.message ?? "provider is not enabled") };

  redirect(data.url);
}

// ───────────────────────────── signup ─────────────────────────────

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const displayName = str(formData, "display_name").slice(0, 40);
  const email = str(formData, "email").toLowerCase();
  const password = (formData.get("password") as string | null) ?? "";
  const next = safeNext(str(formData, "next"));
  const keep = { email, displayName };

  if (!displayName) return { ...keep, error: "What should the farmhands call you? Add a display name." };
  if (!EMAIL_RE.test(email)) return { ...keep, error: "That doesn't look like an email address." };
  if (password.length < 8) return { ...keep, error: "Passwords need at least 8 characters. Size your risk, size your password." };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: callbackUrl(origin, next),
    },
  });
  if (error) return { ...keep, error: friendlyAuthError(error.message) };

  // Email confirmation disabled → we already have a session. Straight to the farm.
  if (data.session) redirect(next);

  return { ...keep, sentTo: email };
}

// ───────────────────────────── forgot / reset password ─────────────────────────────

export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = str(formData, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { email, error: "That doesn't look like an email address." };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(origin, "/reset-password"),
  });
  // Rate limits are worth surfacing; "user not found" is not (don't leak which emails exist).
  if (error && /rate|too many|security purposes/i.test(error.message)) {
    return { email, error: friendlyAuthError(error.message) };
  }
  return { email, sentTo: email };
}

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (password.length < 8) return { error: "Passwords need at least 8 characters." };
  if (password !== confirm) return { error: "Those passwords don't match. Double-check your entries (like a good trader)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your reset link has expired. Request a new one from the forgot password page." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendlyAuthError(error.message) };

  redirect(DEFAULT_NEXT);
}
