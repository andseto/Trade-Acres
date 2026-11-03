"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { Logo } from "./Logo";

export function LandingNav({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 border-b-[3px] transition-colors duration-150",
        scrolled
          ? "border-outline bg-bark shadow-[inset_0_-3px_0_0_#6b4426,0_3px_0_0_rgba(0,0,0,0.35)]"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 font-display text-[15px] text-muted md:flex">
          {[
            ["#how", "How it works"],
            ["#crops", "Crops"],
            ["#conditions", "Plot care"],
            ["#features", "Features"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="px-3 py-1.5 transition hover:text-cream">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/farm" className="btn-primary">
              Go to my farm <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
