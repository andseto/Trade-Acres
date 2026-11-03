import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { friendlyAuthError, safeNext } from "@/components/auth/redirects";

// OAuth (Google), magic links, signup confirmation and password recovery (PKCE flow) all land here
// with ?code=..., which we swap for a session cookie before sending the user on to ?next=.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const fail = (message: string) => {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", message);
    if (next !== "/farm" && next !== "/reset-password") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  };

  // Provider / GoTrue reported an error (e.g. user cancelled Google consent, link expired).
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) return fail(friendlyAuthError(providerError));

  if (!code) return fail("That sign-in link is missing its code. Request a fresh one.");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail(friendlyAuthError(error.message));

  return NextResponse.redirect(new URL(next, request.url));
}
