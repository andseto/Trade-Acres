"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, KeyRound, LogOut, Save, Sun, UserRound } from "lucide-react";
import clsx from "clsx";
import { Field, FormAlert, PasswordInput, PasswordStrength, Spinner } from "@/components/auth/FormBits";
import { CropSprite } from "@/components/farm/CropSprite";
import { isSeason, SEASONS, type GrowthStage } from "@/lib/farm";
import type { CropId, Season } from "@/lib/types";
import { changePasswordAction, signOutAction, signOutEverywhereAction, updateProfileAction, updateSeasonAction, type SettingsState } from "./actions";

function Card({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] border-[3px] border-outline bg-wood text-gold shadow-[inset_0_2px_0_0_#7d5531]">{icon}</div>
        <div>
          <h2 className="font-display text-xl">{title}</h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Feedback({ state }: { state: SettingsState }) {
  if (state.error) return <FormAlert kind="error">{state.error}</FormAlert>;
  if (state.ok && state.message) return <FormAlert kind="success">{state.message}</FormAlert>;
  return null;
}

// ───────────────────────────── profile ─────────────────────────────

export function ProfileForm({ email, displayName, username }: { email: string; displayName: string; username: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateProfileAction, {});
  return (
    <Card icon={<UserRound size={20} />} title="Profile" subtitle="How you show up around the farm.">
      <form action={action} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <input id="email" value={email} readOnly disabled className="input cursor-not-allowed opacity-70" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" htmlFor="display_name">
            <input
              id="display_name"
              name="display_name"
              required
              maxLength={40}
              defaultValue={displayName}
              placeholder="Scalp Daddy"
              className="input"
            />
          </Field>
          <Field label="Username" htmlFor="username">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-muted">@</span>
              <input
                id="username"
                name="username"
                maxLength={21}
                pattern="@?[A-Za-z0-9_]{3,20}"
                title="3–20 letters, numbers or underscores"
                defaultValue={username}
                placeholder="green_days_only"
                className="input pl-8"
              />
            </div>
          </Field>
        </div>
        <Feedback state={state} />
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? <Spinner /> : <Save size={16} />}
            Save profile
          </button>
        </div>
      </form>
    </Card>
  );
}

// ───────────────────────────── season ─────────────────────────────

const SEASON_PREVIEW: Record<
  Season,
  { sky: string; ground: string; groundTop: string; crop: CropId; stage: GrowthStage; dot: string; blurb: string }
> = {
  spring: {
    sky: "#8fd3ec",
    ground: "#5e9a2a",
    groundTop: "#8cc84b",
    crop: "strawberry",
    stage: "mature",
    dot: "#f4a6c0",
    blurb: "Blossoms and fresh rain. A good season to start an eval.",
  },
  summer: {
    sky: "#5fb6e6",
    ground: "#4f8a26",
    groundTop: "#76b23a",
    crop: "sunflower",
    stage: "ripe",
    dot: "#fff3c4",
    blurb: "Long days, tall crops, peak trading energy.",
  },
  fall: {
    sky: "#e7b56f",
    ground: "#7a6a26",
    groundTop: "#a3893a",
    crop: "pumpkin",
    stage: "ripe",
    dot: "#d6702a",
    blurb: "Golden light and harvest season. Cozy, a bit moody.",
  },
  winter: {
    sky: "#a9c6dc",
    ground: "#dfe9ef",
    groundTop: "#ffffff",
    crop: "blueberry",
    stage: "mature",
    dot: "#ffffff",
    blurb: "Frost on the fence. Quiet markets, warm journal.",
  },
};

// fixed pixel "particles" per card: blossoms, sun motes, falling leaves, snow
const DOTS: [number, number][] = [
  [12, 14], [30, 34], [52, 10], [70, 28], [86, 16], [22, 46], [62, 50], [92, 40],
];

export function SeasonForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSeasonAction, {});
  const [selected, setSelected] = useState<Season>(isSeason(current) ? current : "spring");

  return (
    <Card icon={<Sun size={20} />} title="Season" subtitle="Change the weather over your farm. Purely cosmetic — markets stay open.">
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="radiogroup" aria-label="Farm season">
          {SEASONS.map((sn) => {
            const p = SEASON_PREVIEW[sn.id];
            const active = selected === sn.id;
            return (
              <label
                key={sn.id}
                className={clsx(
                  "group relative cursor-pointer rounded-[3px] border-[3px] p-1.5 transition",
                  active
                    ? "border-outline bg-wood shadow-[0_0_0_3px_var(--leaf)]"
                    : "border-outline bg-bark hover:bg-wood",
                )}
              >
                <input
                  type="radio"
                  name="farm_season"
                  value={sn.id}
                  checked={active}
                  onChange={() => setSelected(sn.id)}
                  className="peer sr-only"
                />
                <div
                  className="relative h-24 overflow-hidden rounded-[2px] border-2 border-outline"
                  style={{ background: p.sky }}
                >
                  {DOTS.map(([x, y], i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="absolute h-1 w-1"
                      style={{ left: `${x}%`, top: `${y}%`, background: p.dot, opacity: sn.id === "summer" ? 0.6 : 1 }}
                    />
                  ))}
                  <div className="absolute inset-x-0 bottom-0 h-5" style={{ background: p.ground }}>
                    <div className="h-1" style={{ background: p.groundTop }} />
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                    <CropSprite crop={p.crop} stage={p.stage} size={48} />
                  </div>
                  {active && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center border-2 border-outline bg-leaf text-[#1d2b0c]">
                      <Check size={12} strokeWidth={3.5} />
                    </span>
                  )}
                </div>
                <div className="px-1 pb-1 pt-2">
                  <div className={clsx("font-display text-base", active ? "text-gold" : "text-cream")}>{sn.name}</div>
                  <div className="text-xs leading-snug text-muted">{p.blurb}</div>
                </div>
              </label>
            );
          })}
        </div>
        <Feedback state={state} />
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? <Spinner /> : <Sun size={16} />}
            Save season
          </button>
        </div>
      </form>
    </Card>
  );
}

// ───────────────────────────── password ─────────────────────────────

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [state, action, pending] = useActionState<SettingsState, FormData>(async (prev, fd) => {
    const result = await changePasswordAction(prev, fd);
    if (result.ok) setPassword("");
    return result;
  }, {});

  return (
    <Card icon={<KeyRound size={20} />} title="Change password" subtitle="Rotate it like you rotate out of bad setups.">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password" htmlFor="new_password">
            <PasswordInput
              id="new_password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrength password={password} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm_password">
            <PasswordInput
              id="confirm_password"
              name="confirm"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="One more time"
            />
          </Field>
        </div>
        <Feedback state={state} />
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? <Spinner /> : <KeyRound size={16} />}
            Update password
          </button>
        </div>
      </form>
    </Card>
  );
}

// ───────────────────────────── sign out ─────────────────────────────

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-danger">
      {pending ? <Spinner /> : <LogOut size={16} />}
      Sign out
    </button>
  );
}

export function SignOutCard() {
  return (
    <section className="panel flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
      <div>
        <h2 className="font-display text-xl">Heading home for the night?</h2>
        <p className="text-sm text-muted">Your crops stay planted. The soil keeps drying, though. Come back and journal.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <form action={signOutEverywhereAction}>
          <button type="submit" className="btn-ghost" title="Signs you out on every phone and computer">
            Sign out everywhere
          </button>
        </form>
        <form action={signOutAction}>
          <SignOutButton />
        </form>
      </div>
    </section>
  );
}
