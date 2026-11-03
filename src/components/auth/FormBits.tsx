"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import clsx from "clsx";

export function FormAlert({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  const Icon = kind === "error" ? AlertTriangle : CheckCircle2;
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-2.5 rounded-[3px] border-[3px] border-outline px-3.5 py-3 text-sm",
        kind === "error"
          ? "bg-[#5a2018] text-[#ffd6cc] shadow-[inset_0_2px_0_0_#7a2e22]"
          : "bg-[#2f4f17] text-[#e2f7c4] shadow-[inset_0_2px_0_0_#3f6e1f]",
      )}
    >
      <Icon size={18} className={clsx("mt-px shrink-0", kind === "error" ? "text-loss" : "text-gain")} />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" aria-hidden />;
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="label">
          {label}
        </label>
        {hint}
      </div>
      {children}
    </div>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={clsx("input pr-11", props.className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition hover:text-cream"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ───────────────────────────── password strength ─────────────────────────────

export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 8) score = Math.min(score, 1);
  return Math.min(4, score);
}

const STRENGTH = [
  { label: "Too short", note: "8+ characters, please. Even a scalp lasts longer.", color: "bg-loss" },
  { label: "Weak", note: "Blows up faster than an oversized eval.", color: "bg-loss" },
  { label: "Okay", note: "Passing… but barely. Add a number or symbol.", color: "bg-gold" },
  { label: "Strong", note: "Solid risk management.", color: "bg-gain" },
  { label: "Fortress", note: "Golden-harvest energy.", color: "bg-leaf" },
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = password.length < 8 ? 0 : Math.max(1, scorePassword(password));
  const s = STRENGTH[score];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={clsx("h-2.5 flex-1 border-2 border-outline transition-colors", i <= Math.max(score, 1) ? s.color : "bg-soil/60")} />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        <span className="font-semibold text-cream">{s.label}</span> — {s.note}
      </p>
    </div>
  );
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 flex items-center gap-3 font-display text-xs uppercase tracking-wider text-muted">
      <div className="h-[3px] flex-1 bg-outline/70" />
      {children}
      <div className="h-[3px] flex-1 bg-outline/70" />
    </div>
  );
}

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
