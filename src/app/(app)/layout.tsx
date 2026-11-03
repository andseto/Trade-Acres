import { requireUser } from "@/lib/supabase/server";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";

// Shell for every signed-in page: /farm, /accounts, /journal, /calendar, /settings
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav displayName={profile?.display_name ?? user.email ?? "Trader"} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-6 sm:px-6">{children}</main>
      <footer className="border-t-[3px] border-outline bg-bark/60 py-4 text-center text-xs text-muted">
        <Link href="/privacy" className="hover:text-cream">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-cream">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link href="/settings" className="hover:text-cream">
          Your data
        </Link>
      </footer>
    </div>
  );
}
