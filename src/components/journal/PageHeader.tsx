import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlotPreview } from "@/components/farm/PlotPreview";

export function PageHeader({
  title,
  subtitle,
  back,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-leaf">
          <ArrowLeft size={14} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  );
}

export function NoPlots() {
  return (
    <div className="panel mx-auto max-w-lg p-8 text-center">
      <PlotPreview crop="wheat" stage="seed" state="dry" size={96} className="mx-auto" />
      <h2 className="mt-4 font-display text-2xl">Nothing planted here yet</h2>
      <p className="mt-2 text-muted">
        Every trade waters a plot — and each plot is one of your accounts. Till a plot for your first funded account or
        prop-firm eval, then come back to log trades.
      </p>
      <Link href="/accounts/new" className="btn-primary mt-6">
        Till a new plot 🌱
      </Link>
    </div>
  );
}
