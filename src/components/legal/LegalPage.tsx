import Link from "next/link";
import type { ReactNode } from "react";
import { PixelLogo } from "@/components/PixelLogo";
import { Footer } from "@/components/landing/Sections";
import { LEGAL_UPDATED, SITE_NAME } from "@/lib/site";

/** Shell for the public legal pages: a small header, a wooden document panel, the site footer. */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-[3px] border-outline bg-bark shadow-[inset_0_-3px_0_0_#6b4426]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-xl">
            <PixelLogo size={28} />
            <span>
              Trade <span className="text-leaf">Acres</span>
            </span>
          </Link>
          <Link href="/" className="font-display text-sm text-muted hover:text-cream">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="panel p-6 sm:p-9">
          <h1 className="font-display text-3xl [text-shadow:3px_3px_0_#140c06] sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {SITE_NAME} · Last updated {LEGAL_UPDATED}
          </p>
          <p className="mt-5 leading-relaxed text-cream/90">{intro}</p>
          <div className="mt-2">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-gold">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed text-cream/90">{children}</div>
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-leaf">{children}</ul>;
}
