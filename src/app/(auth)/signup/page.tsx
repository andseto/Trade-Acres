import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";
import { safeNext } from "@/components/auth/redirects";

export const metadata: Metadata = { title: "Start your farm" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next);
  return <SignupForm next={next} />;
}
