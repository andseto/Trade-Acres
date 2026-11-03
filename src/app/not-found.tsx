import Link from "next/link";
import { FarmBackdrop } from "@/components/auth/FarmBackdrop";
import { PlotPreview } from "@/components/farm/PlotPreview";
import { Logo } from "@/components/landing/Logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
      <FarmBackdrop />
      <header className="relative z-10 mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <div className="panel inline-block px-3 py-2">
          <Logo size={24} className="text-lg" />
        </div>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-48 pt-4">
        <div className="panel w-full max-w-lg p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 flex justify-center">
            <PlotPreview crop="wheat" stage="seed" state="fallow" size={128} />
          </div>
          <div className="font-display text-6xl text-gold [text-shadow:3px_3px_0_#140c06] sm:text-7xl">404</div>
          <h1 className="mt-2 font-display text-2xl [text-shadow:2px_2px_0_#140c06] sm:text-3xl">
            This plot doesn&apos;t exist
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-muted">
            Nothing grows here. Maybe the link got stopped out, maybe it was never planted. Either way &mdash; don&apos;t
            revenge-click.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/farm" className="btn-primary px-6 py-3">
              Back to my farm
            </Link>
            <Link href="/" className="btn-ghost px-6 py-3">
              Trade Acres home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
