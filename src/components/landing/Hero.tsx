"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MiniFarm, type MiniFarmPlot } from "@/components/farm/MiniFarm";
import { SEASONS } from "@/lib/farm";
import type { Season } from "@/lib/types";
import { DROP, PixelArt, SKULL, STAR } from "./PixelArt";
import { PARCHMENT, PLANK, TITLE_SHADOW } from "./ui";

const SAMPLE_PLOTS: MiniFarmPlot[] = [
  { crop: "corn", stage: "ripe", state: "soaked", name: "Funded 150K" },
  { crop: "strawberry", stage: "young", state: "soaked", name: "Eval #3" },
  { crop: "sunflower", stage: "ripe", state: "harvested", name: "Passed 100K" },
  { crop: "wheat", stage: "mature", state: "dry", name: "Combine 50K" },
  { crop: "carrot", stage: "young", state: "dead", name: "Revenge Trade RIP" },
  { crop: "tomato", stage: "young", state: "withering", name: "Journal Later" },
  { crop: "pumpkin", stage: "mature", state: "moist", name: "Swing Acct" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ signedIn }: { signedIn: boolean }) {
  const reduce = useReducedMotion();
  const [season, setSeason] = useState<Season>("summer");
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease },
  });

  return (
    <section className="relative pt-28 sm:pt-32">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...rise(0)} className="chip mx-auto mb-6 px-2.5 py-1 text-muted">
            <span aria-hidden>🌱</span> The trading journal with dirt under its nails
          </motion.div>

          <motion.h1
            {...rise(0.06)}
            className={clsx("font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl", TITLE_SHADOW)}
          >
            Water your journal.
            <br />
            <span className="text-leaf">Grow your accounts.</span>
          </motion.h1>

          <motion.p {...rise(0.12)} className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
            In <span className="font-bold text-cream">Trade Acres</span>, every prop-firm eval, funded account and personal
            account is a plot on your farm. Journal a trade and it gets watered. Say &ldquo;I&apos;ll journal later&rdquo;
            after a revenge-trading spree and&hellip; the tomatoes notice.
          </motion.p>

          <motion.div {...rise(0.18)} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {signedIn ? (
              <Link href="/farm" className="btn-primary px-7 py-3.5 text-lg">
                Go to my farm <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn-primary px-7 py-3.5 text-lg">
                  Plant your first plot <ArrowRight size={18} />
                </Link>
                <Link href="/login" className="btn-ghost px-7 py-3.5 text-lg">
                  Log in
                </Link>
              </>
            )}
          </motion.div>

          <motion.ul
            {...rise(0.24)}
            className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-cream/90"
          >
            <li className="chip py-1">
              <PixelArt piece={DROP} scale={2} /> Journal = water
            </li>
            <li className="chip py-1">
              <PixelArt piece={STAR} scale={2} /> Pass an eval, golden harvest
            </li>
            <li className="chip py-1">
              <PixelArt piece={SKULL} scale={2} /> Blow it, crop dies
            </li>
          </motion.ul>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          className="relative mx-auto mt-14 max-w-5xl"
        >
          {/* the "game window" */}
          <div className="panel relative p-2.5 sm:p-3.5">
            <div
              className={clsx(
                PLANK,
                "absolute -top-5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap px-4 py-1.5 font-display text-sm text-gold sm:text-base",
              )}
            >
              Your Farm &middot; {SEASONS.find((s) => s.id === season)?.name}, Year 1
            </div>
            <div className="overflow-hidden rounded-[2px] border-[3px] border-outline">
              <MiniFarm plots={SAMPLE_PLOTS} season={season} height="clamp(420px, 44vw, 560px)" className="w-full" />
            </div>
          </div>

          {/* season tabs hang off the bottom of the frame */}
          <div className="relative z-10 -mt-[3px] flex justify-center gap-1.5" role="radiogroup" aria-label="Preview season">
            {SEASONS.map((s) => {
              const active = s.id === season;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSeason(s.id)}
                  className={clsx(
                    "rounded-b-[3px] border-[3px] border-t-0 border-outline px-3 pb-1.5 pt-1 font-display text-sm transition sm:px-4",
                    active
                      ? "bg-wood pt-2 text-gold shadow-[inset_0_-3px_0_0_#3d2714]"
                      : "bg-bark text-muted shadow-[inset_0_-3px_0_0_#2a1b0f] hover:text-cream",
                  )}
                >
                  {s.name}
                </button>
              );
            })}
          </div>

          {/* parchment callouts */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.5, ease }}
            className={clsx(PARCHMENT, "absolute -left-3 top-12 hidden -rotate-2 px-3.5 py-2.5 text-sm md:block lg:-left-14")}
          >
            <div className="flex items-center gap-1.5 font-display text-[15px]">
              <PixelArt piece={DROP} scale={2} /> Eval #3 got watered
            </div>
            <div className="mt-0.5 text-xs font-bold text-[#3f6e17]">+$640 &middot; NQ long &middot; followed the plan</div>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.5, ease }}
            className={clsx(PARCHMENT, "absolute -right-3 bottom-20 hidden rotate-2 px-3.5 py-2.5 text-sm md:block lg:-right-14")}
          >
            <div className="font-display text-[15px]">&ldquo;Journal Later&rdquo; is withering</div>
            <div className="mt-0.5 text-xs font-bold text-[#a8432f]">4 days without water. Just one entry?</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
