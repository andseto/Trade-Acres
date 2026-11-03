import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { friendlyAuthError, safeNext } from "@/components/auth/redirects";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

// Token-hash email links (works across browsers/devices, unlike PKCE codes). Point the Supabase email
// templates here, e.g. {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/farm
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type = OTP_TYPES.find((t) => t === rawType);
  const next = safeNext(searchParams.get("next"), type === "recovery" ? "/reset-password" : "/farm");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));

    const url = new URL("/login", request.url);
    url.searchParams.set("error", friendlyAuthError(error.message));
    return NextResponse.redirect(url);
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("error", "That confirmation link is incomplete. Request a fresh one.");
  return NextResponse.redirect(url);
}
