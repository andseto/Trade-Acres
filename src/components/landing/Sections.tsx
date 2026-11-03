import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Camera, Flame, Target } from "lucide-react";
import { CropSprite } from "@/components/farm/CropSprite";
import { PlotPreview } from "@/components/farm/PlotPreview";
import { PixelLogo } from "@/components/PixelLogo";
import { CROPS, PLOT_STATE_LABEL, type GrowthStage, type PlotState } from "@/lib/farm";
import { formatPnl } from "@/lib/format";
import type { CropId } from "@/lib/types";
import {
  CALENDAR,
  CHART,
  DROP,
  FENCE,
  GRASS_EDGE,
  GRASS_FILL,
  JOURNAL,
  PixelArt,
  PixelStrip,
  SIGNPOST,
  SKULL,
  STAR,
  WATERING_CAN,
  type PixelPiece,
} from "./PixelArt";
import { Bob, Reveal } from "./Reveal";
import { PARCHMENT, PLANK, TITLE_SHADOW } from "./ui";

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <div className={clsx(PLANK, "mb-4 inline-block px-3 py-1 font-display text-sm uppercase tracking-widest text-gold")}>
        {eyebrow}
      </div>
      <h2 className={clsx("font-display text-4xl leading-tight sm:text-5xl", TITLE_SHADOW)}>{title}</h2>
      {children && <p className="mt-4 text-lg text-muted">{children}</p>}
    </Reveal>
  );
}

/** Split-rail fence on a strip of grass — the divider between sections. */
export function FenceDivider() {
  return (
    <div aria-hidden className="relative">
      <PixelStrip piece={FENCE} scale={4} className="relative z-10 -mb-3" />
      <PixelStrip piece={GRASS_EDGE} scale={4} className="bg-transparent" />
      <PixelStrip piece={GRASS_FILL} scale={3} className="h-6" style={{ backgroundRepeat: "repeat" }} />
      <div className="h-[3px] bg-outline" />
    </div>
  );
}

// ───────────────────────────── how it works ─────────────────────────────

const STEPS: { n: number; title: string; body: string; crop: CropId; stage: GrowthStage; state: PlotState }[] = [
  {
    n: 1,
    title: "Plant a plot per account",
    body: "Every eval, funded account and personal account gets its own square of dirt. Pick a crop, give it a name. Yes, you can call your 50K eval “Lil Drawdown.”",
    crop: "sunflower",
    stage: "seed",
    state: "soaked",
  },
  {
    n: 2,
    title: "Journal trades to water it",
    body: "Log a trade — entry, exit, P&L, setup, emotions, screenshots — and that plot gets watered. Every entry grows the crop one step closer to ripe.",
    crop: "strawberry",
    stage: "young",
    state: "soaked",
  },
  {
    n: 3,
    title: "Watch it grow, track your P&L",
    body: "Your calendar fills with green days (and, fine, some red). Passed evals turn into golden harvests. Blown ones… we don’t talk about the carrots.",
    crop: "corn",
    stage: "ripe",
    state: "moist",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="How it works" title="A journal you actually want to open">
          Three steps. Zero spreadsheets. One very judgmental row of strawberries.
        </SectionHeading>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} className="h-full">
              <div className="panel relative flex h-full flex-col p-6">
                <div
                  className={clsx(
                    PLANK,
                    "absolute -left-3 -top-3 flex h-10 w-10 items-center justify-center font-display text-xl text-gold",
                  )}
                >
                  {s.n}
                </div>
                <div className="mb-5 flex justify-center">
                  <PlotPreview crop={s.crop} stage={s.stage} state={s.state} size={128} animated />
                </div>
                <h3 className="font-display text-xl text-cream">{s.title}</h3>
                <p className="mt-2 text-muted">{s.body}</p>
                {s.n === 2 && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[#8fd0ec]">
                    <PixelArt piece={WATERING_CAN} scale={3} /> 1 entry = 1 watering
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────── crop showcase (seed packets) ─────────────────────────────

const PACKET_COLOR: Record<CropId, string> = {
  wheat: "#d9a441",
  corn: "#e3c13b",
  carrot: "#e07a2e",
  tomato: "#d2462f",
  pumpkin: "#d6702a",
  strawberry: "#d43d4f",
  sunflower: "#e8b830",
  blueberry: "#4a62b8",
};

const SHOWCASE_STAGES: GrowthStage[] = ["sprout", "young", "mature"];

export function CropShowcase() {
  return (
    <section id="crops" className="relative scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="The seed shelf" title="Pick a crop for every account">
          Eight crops, each with its own personality. Wheat for the steady eval, pumpkin for the swing account, strawberries
          for the scalper who can&apos;t sit still.
        </SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {CROPS.map((c, i) => (
            <Reveal key={c.id} delay={(i % 4) * 0.06} className="h-full">
              <article className={clsx(PARCHMENT, "group flex h-full flex-col overflow-hidden")}>
                <div
                  className="flex items-center justify-between border-b-[3px] border-outline px-3 py-1.5"
                  style={{ background: PACKET_COLOR[c.id] }}
                >
                  <h3 className="font-display text-lg text-[#fff8e4] [text-shadow:2px_2px_0_rgba(20,12,6,0.55)]">{c.name}</h3>
                  <span className="hidden font-display text-[11px] uppercase tracking-wider text-[#2b1a0e]/70 sm:inline">Seeds</span>
                </div>
                <div className="relative flex h-28 items-end justify-center bg-[#eadab0] pb-2 sm:h-32">
                  <div className="transition-transform duration-200 group-hover:-translate-y-1">
                    <CropSprite crop={c.id} stage="ripe" size={96} animated />
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                  <p className="flex-1 text-sm leading-snug">{c.blurb}</p>
                  <div className="mt-3 flex items-end justify-between border-t-2 border-dashed border-[#2b1a0e]/25 pt-2">
                    {SHOWCASE_STAGES.map((st) => (
                      <CropSprite key={st} crop={c.id} stage={st} size={32} />
                    ))}
                    <span className="font-display text-[11px] uppercase text-[#2b1a0e]/60">Grows</span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────── plot conditions ─────────────────────────────

const MOISTURE_CARDS: { state: PlotState; when: string; note: string; tone: string }[] = [
  { state: "soaked", when: "< 6h", note: "Just journaled. Dark, wet soil. Smug little tomatoes.", tone: "text-[#8fd0ec]" },
  { state: "moist", when: "< 1 day", note: "Happy and growing. This is the zone.", tone: "text-gain" },
  { state: "dry", when: "1–2 days", note: "Soil's getting pale. Leaves start to droop.", tone: "text-gold" },
  { state: "parched", when: "2–4 days", note: "Cracked dirt. Like trading without a stop.", tone: "text-[#f0a35c]" },
  { state: "withering", when: "4+ days", note: "“I'll journal later.” It's later. Please water me.", tone: "text-loss" },
];

// 20 blocks from fresh blue water to cracked brown dirt.
const METER = [
  "#5fa8d3", "#5fa8d3", "#5fa8d3", "#6fb0c4", "#7fbba5", "#8cc84b", "#8cc84b", "#8cc84b", "#9fc649", "#b8c447",
  "#d6c046", "#f2c14e", "#f2c14e", "#eeac4f", "#e9984f", "#e5844e", "#c4744a", "#a46a37", "#8b5a2b", "#6e4422",
];

function OutcomeCard({
  icon,
  title,
  children,
  crop,
  stage,
  state,
  border,
}: {
  icon: PixelPiece;
  title: string;
  children: React.ReactNode;
  crop: CropId;
  stage: GrowthStage;
  state: PlotState;
  border: string;
}) {
  return (
    <div className={clsx("panel flex h-full flex-col items-center p-6 text-center", border)}>
      <PlotPreview crop={crop} stage={stage} state={state} size={128} animated={state !== "dead"} />
      <div className="mt-4">
        <div className="flex items-center justify-center gap-2.5 font-display text-xl">
          <PixelArt piece={icon} scale={2} /> {title}
        </div>
        <p className="mt-1.5 text-sm text-muted">{children}</p>
      </div>
    </div>
  );
}

export function PlotConditions() {
  return (
    <section id="conditions" className="relative scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Plot care" title="Your crops can tell when you're dodging your journal">
          Every plot dries out the longer it goes without a journal entry. Thirst never kills a crop &mdash; only your trading
          can do that.
        </SectionHeading>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {MOISTURE_CARDS.map((s, i) => (
            <Reveal key={s.state} delay={i * 0.06} className={clsx("h-full", i === 4 && "col-span-2 sm:col-span-1")}>
              <div className="panel flex h-full flex-col items-center p-4 text-center">
                <PlotPreview crop="tomato" stage="mature" state={s.state} size={96} animated />
                <div className={clsx("mt-3 font-display text-lg", s.tone)}>{PLOT_STATE_LABEL[s.state]}</div>
                <div className="chip mt-1 text-[11px] text-muted">{s.when}</div>
                <p className="mt-2 text-sm leading-snug text-muted">{s.note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* moisture meter */}
        <Reveal delay={0.1} className="mx-auto mt-8 max-w-3xl">
          <div className="flex gap-[3px] rounded-[3px] border-[3px] border-outline bg-outline">
            {METER.map((c, i) => (
              <div key={i} className="h-4 flex-1 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.25)]" style={{ background: c }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-display text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <PixelArt piece={DROP} scale={2} /> Just journaled
            </span>
            <span>&ldquo;I&apos;ll journal later&rdquo;</span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <Reveal className="h-full">
            <OutcomeCard icon={SKULL} title="Blown = dead crop" crop="carrot" stage="mature" state="dead" border="">
              Hit max drawdown? Mark it blown and the crop shrivels where it stands. A quiet memorial to that 3-contract
              revenge trade at 3:58pm.
            </OutcomeCard>
          </Reveal>
          <Reveal delay={0.08} className="h-full">
            <OutcomeCard icon={STAR} title="Passed = golden harvest" crop="sunflower" stage="ripe" state="harvested" border="">
              Hit your profit target and the plot glows gold. Bragging rights, permanently tilled into the soil.
            </OutcomeCard>
          </Reveal>
          <Reveal delay={0.16} className="h-full">
            <OutcomeCard icon={SIGNPOST} title="Retired = fallow" crop="wheat" stage="seed" state="fallow" border="">
              Done with an account? Let the field rest. Its journal and stats stay on the books, no watering needed.
            </OutcomeCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────── features ─────────────────────────────

const FEATURES: { icon: PixelPiece; title: string; body: string }[] = [
  {
    icon: JOURNAL,
    title: "Trade journal with screenshots",
    body: "Symbol, direction, entries, exits, R-multiple, setup tags, emotions and chart screenshots. Future you will thank present you.",
  },
  {
    icon: CALENDAR,
    title: "P&L calendar",
    body: "Every day coloured green or red with weekly totals. Spot the Tuesday tilt pattern before it spots you.",
  },
  {
    icon: SIGNPOST,
    title: "Every prop firm, one farm",
    body: "Five evals across three firms plus a personal account? Each gets its own plot, its own rules, its own drawdown.",
  },
  {
    icon: CHART,
    title: "Stats that keep you honest",
    body: "Win rate, average R, best setups, and how often “revenge” shows up in your emotion tags. (We see you.)",
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Under the dirt" title="A real trading journal in overalls">
          The cozy part keeps you coming back. The journal part makes you a better trader.
        </SectionHeading>
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 2) * 0.08} className="h-full">
              <div className="panel flex h-full gap-5 p-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[3px] border-[3px] border-outline bg-[#f3e3bb] shadow-[inset_0_-3px_0_0_#dcc48f]">
                  <PixelArt piece={f.icon} scale={3} className="max-h-11 max-w-11" />
                </div>
                <div>
                  <h3 className="font-display text-xl">{f.title}</h3>
                  <p className="mt-1.5 text-muted">{f.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-cream/90">
          <span className="chip py-1">
            <Camera size={13} /> Screenshot uploads
          </span>
          <span className="chip py-1">
            <Target size={13} /> Profit targets &amp; drawdowns
          </span>
          <span className="chip py-1">
            <Flame size={13} /> Watering streaks
          </span>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────────── P&L calendar teaser ─────────────────────────────

// A fake month: 5 trading weeks, Mon–Fri. null = no trades that day.
const MOCK_WEEKS: (number | null)[][] = [
  [null, null, 420, -180, 610],
  [255, 890, -340, null, 120],
  [-760, -410, null, 300, 980],
  [540, 220, 1340, -95, null],
  [380, -150, 715, 460, 0],
];

function cellClass(v: number | null) {
  if (v === null) return "bg-[#2a1b0f] text-muted/40";
  if (v > 600) return "bg-[#6aa62f] text-[#13210a]";
  if (v > 0) return "bg-[#3f6e1f] text-[#d6f5ae]";
  if (v < -500) return "bg-[#c24b38] text-[#2a0d07]";
  if (v < 0) return "bg-[#7a2e22] text-[#ffc9bd]";
  return "bg-wood text-muted";
}

export function CalendarTeaser() {
  const allDays = MOCK_WEEKS.flat().filter((v): v is number => v !== null);
  const total = allDays.reduce((a, b) => a + b, 0);
  const greenDays = allDays.filter((v) => v > 0).length;

  return (
    <section className="relative py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.25fr]">
        <Reveal>
          <div className={clsx(PLANK, "mb-4 inline-block px-3 py-1 font-display text-sm uppercase tracking-widest text-gold")}>
            P&amp;L calendar
          </div>
          <h2 className={clsx("font-display text-4xl leading-tight sm:text-5xl", TITLE_SHADOW)}>
            The almanac for your account
          </h2>
          <p className="mt-4 text-lg text-muted">
            Green days, red days, and that one Wednesday you&apos;d rather forget. Filter by plot or firm, click any day to
            see the trades behind it.
          </p>
          <div className="mt-6 flex gap-4">
            <div className={clsx(PARCHMENT, "px-4 py-2.5")}>
              <div className={clsx("font-display text-3xl", total >= 0 ? "text-[#3f6e17]" : "text-[#a8432f]")}>
                {formatPnl(total).replace(".00", "")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#2b1a0e]/60">This month</div>
            </div>
            <div className={clsx(PARCHMENT, "px-4 py-2.5")}>
              <div className="font-display text-3xl">
                {greenDays}/{allDays.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#2b1a0e]/60">Green days</div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-display text-xl text-gold">March</div>
              <span className="chip text-muted">All plots</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5 text-center font-display text-[11px] uppercase tracking-wider text-muted sm:gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Week"].map((d) => (
                <div key={d} className="pb-1">
                  {d}
                </div>
              ))}
              {MOCK_WEEKS.map((week, w) => {
                const weekTotal = week.reduce<number>((a, b) => a + (b ?? 0), 0);
                return [
                  ...week.map((v, d) => (
                    <div
                      key={`${w}-${d}`}
                      className={clsx(
                        "flex aspect-square flex-col justify-between rounded-[2px] border-2 border-outline p-1 text-left shadow-[inset_0_2px_0_0_rgba(255,255,255,0.12)] sm:aspect-[5/4] sm:p-1.5",
                        cellClass(v),
                      )}
                    >
                      <span className="text-[9px] opacity-70 sm:text-[10px]">{w * 7 + d + 1}</span>
                      {v !== null && (
                        <span className="truncate font-sans text-[9px] font-extrabold normal-case tracking-normal sm:text-xs">
                          {v === 0 ? "$0" : formatPnl(v).replace(".00", "")}
                        </span>
                      )}
                    </div>
                  )),
                  <div
                    key={`${w}-total`}
                    className={clsx(
                      "flex aspect-square items-center justify-center rounded-[2px] border-2 border-outline bg-bark font-sans text-[9px] font-extrabold normal-case tracking-normal sm:aspect-[5/4] sm:text-xs",
                      weekTotal >= 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {formatPnl(weekTotal).replace(".00", "")}
                  </div>,
                ];
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────────────────────────── humor strip ─────────────────────────────

const CONFESSIONS = [
  "“My strawberries survived a 6-loss day. My eval did not.”",
  "“Named my funded account ‘Lil Drawdown.’ Healthiest corn on the farm.”",
  "“I journal now purely so my pumpkin stops looking at me like that.”",
  "“Golden harvest on the 100K. Framed it. Told nobody I almost blew it on day 2.”",
];

export function Confessions() {
  return (
    <section className="relative pb-24 pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-10 text-center">
          <span className="font-display text-sm uppercase tracking-widest text-muted">
            Pinned to the farmers&apos; market board
          </span>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CONFESSIONS.map((c, i) => (
            <Reveal key={c} delay={i * 0.06} className="h-full">
              <blockquote
                className={clsx(
                  PARCHMENT,
                  "relative h-full px-5 pb-5 pt-6 font-display text-[15px] leading-snug",
                  ["-rotate-1", "rotate-1", "rotate-[0.5deg]", "-rotate-[1.5deg]"][i],
                )}
              >
                <span
                  aria-hidden
                  className="absolute left-1/2 top-[-7px] h-3 w-3 -translate-x-1/2 border-2 border-outline bg-loss shadow-[inset_-2px_-2px_0_0_#a83a2a]"
                />
                {c}
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────── final CTA + footer ─────────────────────────────

const CTA_ROW: { crop: CropId; stage: GrowthStage; delay: number }[] = [
  { crop: "carrot", stage: "mature", delay: 0.3 },
  { crop: "sunflower", stage: "ripe", delay: 0 },
  { crop: "pumpkin", stage: "ripe", delay: 0.5 },
  { crop: "blueberry", stage: "ripe", delay: 0.2 },
];

export function FinalCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-4xl">
        <div className="panel relative overflow-hidden px-6 pb-0 pt-14 text-center sm:px-12">
          <h2 className={clsx("font-display text-4xl leading-tight sm:text-5xl", TITLE_SHADOW)}>Your plots are thirsty.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Set up your farm in under a minute. Plant your accounts, log today&apos;s trades, and give everything a good
            soak.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
                  I already have a farm
                </Link>
              </>
            )}
          </div>
          {/* a little crop row growing out of the bottom of the sign */}
          <div className="relative -mx-6 mt-12 sm:-mx-12">
            <div className="relative z-10 flex items-end justify-center gap-3 sm:gap-6">
              {CTA_ROW.map((c) => (
                <Bob key={c.crop} amount={2} duration={3} delay={c.delay}>
                  <CropSprite crop={c.crop} stage={c.stage} size={64} animated />
                </Bob>
              ))}
            </div>
            <PixelStrip piece={GRASS_EDGE} scale={3} className="-mt-3" />
            <div className="h-4 bg-[#4f8a26]" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative">
      <PixelStrip piece={GRASS_EDGE} scale={3} />
      <div className="border-b-[3px] border-outline bg-[#4f8a26] pb-1" />
      <div className="bg-bark">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <PixelLogo size={24} />
            <span className="font-display text-lg text-cream">Trade Acres</span>
            <span className="hidden sm:inline">&middot; Keep your accounts alive.</span>
          </div>
          <nav className="flex gap-5 font-display">
            <Link href="/login" className="hover:text-cream">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-cream">
              Sign up
            </Link>
            <Link href="/privacy" className="hover:text-cream">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-cream">
              Terms
            </Link>
          </nav>
          <p className="text-xs text-muted/70">
            &copy; {new Date().getFullYear()} Trade Acres. Not financial advice. Definitely farming advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
