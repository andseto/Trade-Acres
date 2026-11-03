"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { createAccount } from "@/app/(app)/accounts/actions";
import { CROP_BY_ID } from "@/lib/farm";
import { AccountFields, CropPicker, HiddenPlotInputs, NameField, PlotSignPreview, suggestsCorn } from "./PlotFields";
import { parseMoney, type PlotField, type PlotFormState, type PlotFormValues } from "./form-types";

const STEPS = [
  { title: "The account", sub: "Which account will this plot be farming for?" },
  { title: "Pick a crop", sub: "Every crop grows a little differently." },
  { title: "Name your plot", sub: "Every good field has a name painted on a sign." },
];

const STEP_FIELDS: PlotField[][] = [
  ["name", "firm", "account_type", "account_size", "profit_target", "max_drawdown", "notes"],
  ["crop"],
  ["plot_name"],
];

type Errors = Partial<Record<PlotField, string>>;

function validateStep(step: number, v: PlotFormValues): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!v.name.trim()) e.name = "Give the account a name, e.g. “Apex 50K #3”.";
    const size = parseMoney(v.account_size);
    if (size === null) e.account_size = "How big is the account?";
    else if (Number.isNaN(size) || size <= 0) e.account_size = "Account size should be a positive number.";
    for (const [k, label] of [
      ["profit_target", "Profit target"],
      ["max_drawdown", "Max drawdown"],
    ] as const) {
      const n = parseMoney(v[k]);
      if (n !== null && (Number.isNaN(n) || n < 0)) e[k] = `${label} should be a positive number.`;
    }
  }
  if (step === 1 && !CROP_BY_ID[v.crop]) e.crop = "Pick a crop.";
  if (step === 2 && !v.plot_name.trim()) e.plot_name = "Every plot needs a name on its sign.";
  return e;
}

const variants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

export function PlantWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [cropTouched, setCropTouched] = useState(false);
  const [values, setValues] = useState<PlotFormValues>({
    name: "",
    firm: "",
    account_type: "eval",
    account_size: "50000",
    profit_target: "",
    max_drawdown: "",
    notes: "",
    crop: "wheat",
    plot_name: "",
  });

  const [state, formAction, pending] = useActionState(async (prev: PlotFormState, fd: FormData) => {
    const res = await createAccount(prev, fd);
    if (res.errors) {
      setErrors(res.errors);
      const first = STEP_FIELDS.findIndex((fields) => fields.some((f) => res.errors?.[f]));
      if (first >= 0 && first !== step) {
        setDir(first > step ? 1 : -1);
        setStep(first);
      }
    }
    return res;
  }, {});

  function patch(p: Partial<PlotFormValues>) {
    if (p.crop) setCropTouched(true);
    setValues((v) => ({ ...v, ...p }));
    setErrors((e) => {
      const keys = Object.keys(p) as PlotField[];
      if (!keys.some((k) => e[k])) return e;
      const next = { ...e };
      for (const k of keys) delete next[k];
      return next;
    });
  }

  function go(to: number) {
    if (to > step) {
      for (let s = step; s < to; s++) {
        const e = validateStep(s, values);
        if (Object.keys(e).length) {
          setErrors(e);
          if (s !== step) {
            setDir(1);
            setStep(s);
          }
          return;
        }
      }
      // entering the crop step: pre-select corn for big funded accounts, unless they already chose
      if (step === 0 && to >= 1 && !cropTouched && suggestsCorn(values)) setValues((v) => ({ ...v, crop: "corn" }));
    }
    setDir(to > step ? 1 : -1);
    setStep(to);
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const e2 = validateStep(2, values);
        if (Object.keys(e2).length) {
          e.preventDefault();
          setErrors(e2);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && step < 2 && e.target instanceof HTMLInputElement) {
          e.preventDefault();
          go(step + 1);
        }
      }}
      className="mx-auto max-w-4xl"
    >
      <HiddenPlotInputs values={values} />

      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/accounts" className="inline-flex items-center gap-1.5 font-display text-sm text-muted hover:text-cream">
          <ArrowLeft size={16} /> Your plots
        </Link>
        {/* progress: a row of seed packets */}
        <ol className="flex items-center gap-1.5" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-center gap-1.5">
              {i > 0 && <span className={clsx("h-1 w-5", i <= step ? "bg-leaf" : "bg-wood")} aria-hidden />}
              <button
                type="button"
                onClick={() => i !== step && go(i)}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === step ? "step" : undefined}
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-sm border-[3px] border-outline font-display text-sm",
                  i < step && "bg-leaf text-[#1d2b0c] shadow-[inset_0_2px_0_0_#c3eb8a]",
                  i === step && "bg-gold text-[#3a2616] shadow-[inset_0_2px_0_0_#f8dc8c]",
                  i > step && "bg-wood text-muted shadow-[inset_0_2px_0_0_#7d5531]",
                )}
              >
                {i < step ? "✓" : i + 1}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="panel p-5 sm:p-8">
        <div className="mb-6">
          <p className="font-display text-xs uppercase tracking-wider text-leaf">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="mt-1 font-display text-3xl">{STEPS[step].title}</h1>
          <p className="mt-1 text-muted">{STEPS[step].sub}</p>
        </div>

        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {step === 0 && <AccountFields values={values} onChange={patch} errors={errors} />}
            {step === 1 && <CropPicker values={values} onChange={patch} errors={errors} />}
            {step === 2 && (
              <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
                <div className="space-y-4">
                  <NameField values={values} onChange={patch} errors={errors} autoFocus />
                  <p className="text-sm text-muted">
                    You water this plot every time you log a trade or journal entry on{" "}
                    <span className="text-cream">{values.name || "this account"}</span>. Each entry grows the crop a little. Skip a few days and the
                    soil starts to crack.
                  </p>
                </div>
                <div className="flex justify-center">
                  <PlotSignPreview values={values} size={200} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {state.message && !pending && (
          <p className="mt-6 rounded-sm border-[3px] border-outline bg-[#4e1d14] px-4 py-2.5 text-sm text-[#f59a8a]" role="alert">
            {state.message}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t-[3px] border-outline/60 pt-6">
          <button type="button" onClick={() => go(step - 1)} className={clsx("btn-ghost", step === 0 && "invisible")}>
            <ChevronLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button key="next" type="button" onClick={() => go(step + 1)} className="btn-primary">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button key="submit" type="submit" className="btn-primary" disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" /> Tilling the soil…
                </>
              ) : (
                <>🌱 Plant {values.plot_name.trim() || "this plot"}</>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
