import Link from "next/link";
import clsx from "clsx";
import { PixelLogo } from "@/components/PixelLogo";

export function Logo({ href = "/", size = 36, className }: { href?: string; size?: number; className?: string }) {
  return (
    <Link
      href={href}
      className={clsx("group inline-flex items-center gap-2.5 font-display text-xl leading-none", className)}
      aria-label="Trade Acres home"
    >
      <PixelLogo size={size} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
      <span className="[text-shadow:2px_2px_0_#140c06]">
        Trade <span className="text-leaf">Acres</span>
      </span>
    </Link>
  );
}
