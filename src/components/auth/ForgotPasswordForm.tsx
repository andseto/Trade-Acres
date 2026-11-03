"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { forgotPasswordAction, type AuthFormState } from "./actions";
import { CheckInbox } from "./CheckInbox";
import { Field, FormAlert, Spinner } from "./FormBits";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(forgotPasswordAction, {});

  if (state.sentTo) {
    return (
      <CheckInbox
        email={state.sentTo}
        title="Reset link on its way"
        footer={
          <Link href="/login" className="font-semibold text-leaf hover:underline">
            ← Back to log in
          </Link>
        }
      >
        If there&apos;s a farm at that address, the link inside lets you pick a new password.
      </CheckInbox>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl [text-shadow:2px_2px_0_#140c06]">Forgot your password?</h1>
        <p className="mt-2 text-sm text-muted">
          Happens to the best of us — usually right after a red day. We&apos;ll email you a reset link.
        </p>
      </div>

      <form action={action} className="space-y-4">
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

        {state.error && <FormAlert kind="error">{state.error}</FormAlert>}

        <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-base">
          {pending ? <Spinner /> : <KeyRound size={16} />}
          Send reset link
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-leaf hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
