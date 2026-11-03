"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sprout, BookOpen, CalendarDays, LayoutGrid, LogOut } from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { PixelLogo } from "@/components/PixelLogo";

const LINKS = [
  { href: "/farm", label: "Farm", icon: LayoutGrid },
  { href: "/accounts", label: "Plots", icon: Sprout },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

export function AppNav({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-outline bg-bark shadow-[inset_0_-3px_0_0_#6b4426,0_3px_0_0_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/farm" className="flex items-center gap-2 font-display text-xl">
          <PixelLogo size={28} />
          <span className="hidden sm:inline">
            Trade <span className="text-leaf">Acres</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto sm:ml-2">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 border-2 px-3 py-1.5 font-display text-[15px] transition",
                  active ? "border-outline bg-wood text-gold shadow-[inset_0_2px_0_0_#7d5531]" : "border-transparent text-muted hover:text-cream",
                )}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <span className="hidden max-w-40 truncate text-sm text-muted md:inline">{displayName}</span>
        <button onClick={signOut} className="btn-ghost px-3 py-2" title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
