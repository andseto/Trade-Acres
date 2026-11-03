"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Mail, Sprout } from "lucide-react";
import { loginAction, type AuthFormState } from "./actions";
import { CheckInbox } from "./CheckInbox";
import { Divider, Field, FormAlert, PasswordInput, Spinner } from "./FormBits";
import { GoogleButton } from "./GoogleButton";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(loginAction, {});
  const [intent, setIntent] = useState<"password" | "magic">("password");
  const [dismissedInitial, setDismissedInitial] = useState(false);

  if (state.sentTo) {
    return (
      <CheckInbox email={state.sentTo} title="Magic link sent">
        {state.message}
      </CheckInbox>
    );
  }

  const error = state.error ?? (!dismissedInitial ? initialError : undefined);
  const signupHref = next !== "/farm" ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl [text-shadow:2px_2px_0_#140c06]">Welcome back, farmer</h1>
        <p className="mt-2 text-sm text-muted">Your plots are waiting. The soil&apos;s been getting a little dry.</p>
      </div>

      <GoogleButton next={next} />

      <Divider>or with email</Divider>

      <form action={action} onSubmit={() => setDismissedInitial(true)} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.email}
            placeholder="you@greenday.com"
            className="input"
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint={
            <Link href="/forgot-password" className="text-xs font-semibold text-leaf/90 hover:text-leaf">
              Forgot?
            </Link>
          }
        >
          <PasswordInput id="password" name="password" autoComplete="current-password" placeholder="••••••••" />
        </Field>

        {error && <FormAlert kind="error">{error}</FormAlert>}

        <button
          type="submit"
          name="intent"
          value="password"
          onClick={() => setIntent("password")}
          disabled={pending}
          className="btn-primary w-full py-3 text-base"
        >
          {pending && intent === "password" ? <Spinner /> : <Sprout size={16} />}
          Head to the farm
        </button>

        <button
          type="submit"
          name="intent"
          value="magic"
          formNoValidate
          onClick={() => setIntent("magic")}
          disabled={pending}
          className="btn-ghost w-full"
        >
          {pending && intent === "magic" ? <Spinner /> : <Mail size={16} />}
          Email me a magic link instead
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to Trade Acres?{" "}
        <Link href={signupHref} className="font-semibold text-leaf hover:underline">
          Start your farm
        </Link>
      </p>
    </div>
  );
}
