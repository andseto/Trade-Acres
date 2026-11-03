import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Supabase client for Server Components, Server Actions and Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — safe to ignore, proxy.ts refreshes sessions.
          }
        },
      },
    },
  );
}

/** The signed-in user, read from the verified JWT claims. */
export interface AuthUser {
  id: string;
  email: string | undefined;
  user_metadata: Record<string, unknown>;
}

/**
 * Returns { supabase, user } or redirects to /login. Use in protected pages and actions.
 * getClaims() verifies the JWT locally against the project's (cached) signing keys, so this
 * costs no network round trip on every navigation — unlike getUser().
 */
export async function requireUser(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; user: AuthUser }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  return {
    supabase,
    user: {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      user_metadata: (claims.user_metadata as Record<string, unknown> | undefined) ?? {},
    },
  };
}
