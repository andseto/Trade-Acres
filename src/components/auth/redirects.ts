// Small, dependency-free helpers shared by auth server actions and route handlers.

export const DEFAULT_NEXT = "/farm";

/**
 * Only allow same-site relative paths ("/farm", "/journal?x=1").
 * Rejects absolute URLs, protocol-relative "//evil.com" and "/\evil.com" tricks.
 */
export function safeNext(next: unknown, fallback: string = DEFAULT_NEXT): string {
  if (typeof next !== "string" || next.length === 0) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n\t]/.test(next)) return fallback;
  return next;
}

/** Map raw Supabase auth messages to friendlier, on-brand ones. */
export function friendlyAuthError(message: string | undefined | null): string {
  const m = (message ?? "").toLowerCase();
  if (!m) return "Something went sideways. Give it another go.";
  if (m.includes("invalid login credentials"))
    return "Wrong email or password. Not even the scarecrow knows that combo.";
  if (m.includes("email not confirmed"))
    return "Your email isn't confirmed yet — check your inbox for the link we sent (and the spam folder, mail gets lost in the hay).";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "That email already has a farm. Try logging in instead.";
  if (m.includes("signups not allowed") || m.includes("user not found"))
    return "No farm found for that email. Sign up first and we'll get your first plot planted.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider"))
    return "Google sign-in isn't switched on yet. Use email for now — the crops don't mind.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes"))
    return "Whoa, slow down — that's revenge-clicking. Wait a minute and try again.";
  if (m.includes("password should be") || m.includes("weak password"))
    return "That password is weaker than a 5-minute chart breakout. Use at least 8 characters with a mix of letters and numbers.";
  if (m.includes("same password") || m.includes("different from the old"))
    return "New password has to be different from the old one.";
  if (m.includes("code verifier") || m.includes("code_verifier") || m.includes("both auth code and code verifier"))
    return "That link has to be opened in the same browser you requested it from. Request a fresh one and try again.";
  if (m.includes("expired") || (m.includes("invalid") && m.includes("token")))
    return "That link has expired or was already used. Request a fresh one.";
  if (m.includes("fetch failed") || m.includes("network") || m.includes("failed to fetch"))
    return "Couldn't reach the farm servers. Check your connection and try again.";
  return message ?? "Something went sideways. Give it another go.";
}
