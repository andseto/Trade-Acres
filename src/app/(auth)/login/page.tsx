import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNext } from "@/components/auth/redirects";

export const metadata: Metadata = { title: "Log in" };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(first(sp.next));
  const rawError = first(sp.error);
  const error = rawError ? rawError.slice(0, 240) : undefined;

  return <LoginForm next={next} initialError={error} />;
}
