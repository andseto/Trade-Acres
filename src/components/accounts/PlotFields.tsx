"use client";

import { useId } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { CropSprite } from "@/components/farm/CropSprite";
import { PlotPreview } from "@/components/farm/PlotPreview";
import { CROPS, getCrop } from "@/lib/farm";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import { GRASS_BG, WoodSign } from "./bits";
import { ACCOUNT_TYPES, FIRMS, SIZE_CHIPS, randomPlotName } from "./constants";
import { PLOT_FIELDS, parseMoney, type PlotField, type PlotFormValues } from "./form-types";

type Errors = Partial<Record<PlotField, string>>;
type Patch = (patch: Partial<PlotFormValues>) => void;

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs font-semibold text-loss" role="alert">
      {msg}
    </p>
  );
}

/** Mirrors every value as a hidden input so a <form action> can submit controlled state. */
export function HiddenPlotInputs({ values }: { values: PlotFormValues }) {
  return (
    <>
      {PLOT_FIELDS.map((f) => (
        <input key={f} type="hidden" name={f} value={values[f]} />
      ))}
    </>
  );
}

/** Big funded accounts get corn — it grows tall. */
export function suggestsCorn(values: Pick<PlotFormValues, "account_type" | "account_size">) {
  const size = parseMoney(values.account_size);
  return values.account_type === "funded" && size !== null && !Number.isNaN(size) && size >= 100_000;
}

/** Pressed / raised wooden toggle look shared by the type + size pickers. */
function toggleClass(active: boolean) {
  return clsx(
    "rounded-sm border-[3px] border-outline transition-[filter,transform] active:translate-y-0.5",
    active
      ? "bg-leaf text-[#1d2b0c] shadow-[inset_0_3px_0_0_#c3eb8a,inset_0_-3px_0_0_#5e9a2a]"
      : "bg-wood text-cream shadow-[inset_0_3px_0_0_#7d5531,inset_0_-3px_0_0_#3d2714] hover:brightness-110",
  );
}

// ───────────────────────────── account fields ─────────────────────────────

export function AccountFields({ values, onChange, errors }: { values: PlotFormValues; onChange: Patch; errors?: Errors }) {
  const id = useId();
  const sizeNum = parseMoney(values.account_size);
  const isChip = sizeNum !== null && SIZE_CHIPS.includes(sizeNum);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="label">
            Account name
          </label>
          <input
            id={`${id}-name`}
            className="input"
            placeholder="Apex 50K #3"
            value={values.name}
            maxLength={80}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-invalid={!!errors?.name}
          />
          <FieldError msg={errors?.name} />
        </div>
        <div>
          <label htmlFor={`${id}-firm`} className="label">
            Firm
          </label>
          <input
            id={`${id}-firm`}
            className="input"
            placeholder="Apex, Topstep, FTMO…"
            list={`${id}-firms`}
            value={values.firm}
            maxLength={60}
            onChange={(e) => onChange({ firm: e.target.value })}
          />
          <datalist id={`${id}-firms`}>
            {FIRMS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
          <FieldError msg={errors?.firm} />
        </div>
      </div>

      <div>
        <span className="label">Account type</span>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Account type">
          {ACCOUNT_TYPES.map((t) => {
            const active = values.account_type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ account_type: t.id })}
                className={clsx("px-2 py-2.5 text-center", toggleClass(active))}
              >
                <span className="font-display text-[15px]">
                  {t.emoji} {t.label}
                </span>
                <span className={clsx("hidden text-[11px] font-semibold sm:block", active ? "text-[#1d2b0c]/70" : "text-muted")}>
                  {t.hint}
                </span>
              </button>
            );
          })}
        </div>
        <FieldError msg={errors?.account_type} />
      </div>

      <div>
        <label htmlFor={`${id}-size`} className="label">
          Account size
        </label>
        <div className="mb-2 flex flex-wrap gap-2">
          {SIZE_CHIPS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ account_size: String(s) })}
              className={clsx("px-3 py-1.5 font-sans text-sm font-bold tracking-wide", toggleClass(sizeNum === s))}
            >
              {formatCompactMoney(s)}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#7a5a35]">$</span>
          <input
            id={`${id}-size`}
            className="input pl-7"
            inputMode="decimal"
            placeholder={isChip ? undefined : "Custom size, e.g. 75000"}
            value={values.account_size}
            onChange={(e) => onChange({ account_size: e.target.value })}
            aria-invalid={!!errors?.account_size}
          />
        </div>
        {sizeNum !== null && !Number.isNaN(sizeNum) && !isChip && sizeNum > 0 && (
          <p className="mt-1.5 text-xs text-muted">{formatMoney(sizeNum)}</p>
        )}
        <FieldError msg={errors?.account_size} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <MoneyInput
          id={`${id}-target`}
          label="Profit target"
          hint={values.account_type === "eval" ? "$ profit needed to pass, e.g. 3000" : "Optional — $ profit goal"}
          value={values.profit_target}
          onChange={(v) => onChange({ profit_target: v })}
          error={errors?.profit_target}
        />
        <MoneyInput
          id={`${id}-dd`}
          label="Max drawdown"
          hint="Optional — $ you can lose before it's blown, e.g. 2500"
          value={values.max_drawdown}
          onChange={(v) => onChange({ max_drawdown: v })}
          error={errors?.max_drawdown}
        />
      </div>

      <div>
        <label htmlFor={`${id}-notes`} className="label">
          Notes <span className="normal-case tracking-normal text-muted/60">(optional)</span>
        </label>
        <textarea
          id={`${id}-notes`}
          className="input min-h-20 resize-y"
          placeholder="Rules, trailing drawdown details, payout dates…"
          maxLength={2000}
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
        <FieldError msg={errors?.notes} />
      </div>
    </div>
  );
}

function MoneyInput({
  id,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#7a5a35]">$</span>
        <input id={id} className="input pl-7" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      </div>
      {error ? <FieldError msg={error} /> : <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

// ───────────────────────────── crop picker ─────────────────────────────

export function CropPicker({ values, onChange, errors }: { values: PlotFormValues; onChange: Patch; errors?: Errors }) {
  const recommendCorn = suggestsCorn(values);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="radiogroup" aria-label="Crop">
        {CROPS.map((c) => {
          const selected = values.crop === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => !selected && onChange({ crop: c.id })}
              className={clsx(
                "relative flex flex-col items-center rounded-sm border-[3px] p-3 pt-4 text-center transition-transform duration-100 hover:-translate-y-0.5",
                selected
                  ? "border-outline bg-[#4a5f22] shadow-[inset_0_0_0_2px_#8cc84b,inset_0_4px_0_0_rgba(255,255,255,0.12),0_3px_0_0_rgba(0,0,0,0.4)]"
                  : "border-outline bg-wood shadow-[inset_0_3px_0_0_#7d5531,inset_0_-3px_0_0_#3d2714,0_3px_0_0_rgba(0,0,0,0.4)] hover:brightness-110",
              )}
            >
              {recommendCorn && c.id === "corn" && (
                <span className="chip absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#5a4312] text-[10px] text-gold">
                  <Sparkles size={10} /> Suggested
                </span>
              )}
              {selected && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-sm border-2 border-outline bg-leaf text-[#1d2b0c]">
                  <Check size={12} strokeWidth={4} />
                </span>
              )}
              <div className="flex h-20 items-end justify-center">
                <CropSprite crop={c.id} stage={selected ? "ripe" : "mature"} size={72} animated={selected} />
              </div>
              <div className="mt-2 font-display text-lg leading-none">{c.name}</div>
              <p className={clsx("mt-1.5 text-xs leading-snug", selected ? "text-cream/85" : "text-muted")}>{c.blurb}</p>
            </button>
          );
        })}
      </div>
      <FieldError msg={errors?.crop} />
    </div>
  );
}

// ───────────────────────────── name ─────────────────────────────

export function NameField({
  values,
  onChange,
  errors,
  autoFocus,
  compact,
}: {
  values: PlotFormValues;
  onChange: Patch;
  errors?: Errors;
  autoFocus?: boolean;
  /** icon-only random button, for narrow sidebars */
  compact?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={`${id}-plot`} className="label">
        Plot name
      </label>
      <div className="flex gap-2">
        <input
          id={`${id}-plot`}
          className="input font-display text-lg"
          placeholder="The Back Forty"
          maxLength={40}
          autoFocus={autoFocus}
          value={values.plot_name}
          onChange={(e) => onChange({ plot_name: e.target.value })}
          aria-invalid={!!errors?.plot_name}
        />
        <motion.button
          type="button"
          whileTap={{ rotate: 90 }}
          transition={{ duration: 0.15, ease: "linear" }}
          onClick={() => onChange({ plot_name: randomPlotName(values.plot_name) })}
          className="btn-ghost shrink-0 px-3"
          title="Random name"
        >
          <span aria-hidden>🎲</span>
          {!compact && <span className="hidden sm:inline">Random</span>}
        </motion.button>
      </div>
      <FieldError msg={errors?.plot_name} />
    </div>
  );
}

// ───────────────────────────── plot preview ─────────────────────────────

export function PlotSignPreview({ values, size = 220 }: { values: PlotFormValues; size?: number }) {
  const crop = getCrop(values.crop);
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center rounded-sm border-[3px] border-outline p-4"
        style={{ ...GRASS_BG, boxShadow: "inset 0 -4px 0 0 rgba(0,0,0,0.18), 0 4px 0 0 rgba(0,0,0,0.35)" }}
      >
        <PlotPreview crop={crop.id} stage="sprout" state="soaked" size={size} animated />
      </div>
      <motion.div
        key={values.plot_name || "unnamed"}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.18, ease: "linear" }}
        className="-mt-6 max-w-[90%]"
      >
        <WoodSign>{values.plot_name || "Unnamed plot"}</WoodSign>
      </motion.div>
      <p className="mt-1 text-xs text-muted">
        {crop.name}
        {values.name ? ` · ${values.name}` : ""}
      </p>
    </div>
  );
}
