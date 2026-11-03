"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Sprout } from "lucide-react";
import { signupAction, type AuthFormState } from "./actions";
import { CheckInbox } from "./CheckInbox";
import { Divider, Field, FormAlert, PasswordInput, PasswordStrength, Spinner } from "./FormBits";
import { GoogleButton } from "./GoogleButton";

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signupAction, {});
  const [password, setPassword] = useState("");

  if (state.sentTo) {
    return (
      <CheckInbox
        email={state.sentTo}
        title="Check your inbox"
        footer={
          <Link href="/login" className="font-semibold text-leaf hover:underline">
            Already confirmed? Log in →
          </Link>
        }
      >
        Your farm is waiting{state.displayName ? `, ${state.displayName}` : ""}. Click the link to confirm your email and plant
        your first account.
      </CheckInbox>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl [text-shadow:2px_2px_0_#140c06]">Start your farm</h1>
        <p className="mt-2 text-sm text-muted">Free to start. No drawdown limit on how much you water.</p>
      </div>

      <GoogleButton next={next} label="Sign up with Google" />

      <Divider>or with email</Divider>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <Field label="Display name" htmlFor="display_name">
          <input
            id="display_name"
            name="display_name"
            required
            maxLength={40}
            autoComplete="nickname"
            defaultValue={state.displayName}
            placeholder="e.g. Scalp Daddy"
            className="input"
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state.email}
            placeholder="you@greenday.com"
            className="input"
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
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

        {state.error && <FormAlert kind="error">{state.error}</FormAlert>}

        <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-base">
          {pending ? <Spinner /> : <Sprout size={16} />}
          Break ground
        </button>

        <p className="text-center text-xs text-muted/80">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-cream">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-cream">
            Privacy Policy
          </Link>
          . Journal honestly, revenge trades included.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have a farm?{" "}
        <Link href={next !== "/farm" ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-leaf hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
