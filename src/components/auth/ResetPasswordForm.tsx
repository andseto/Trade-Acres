"use client";

import { useActionState, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { resetPasswordAction, type AuthFormState } from "./actions";
import { Field, FormAlert, PasswordInput, PasswordStrength, Spinner } from "./FormBits";

export function ResetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(resetPasswordAction, {});
  const [password, setPassword] = useState("");

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl [text-shadow:2px_2px_0_#140c06]">Pick a new password</h1>
        <p className="mt-2 text-sm text-muted">
          For <span className="font-semibold text-cream">{email}</span>. Make it stronger than your conviction on a Friday
          afternoon.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <Field label="New password" htmlFor="password">
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

        <Field label="Confirm password" htmlFor="confirm">
          <PasswordInput id="confirm" name="confirm" required minLength={8} autoComplete="new-password" placeholder="One more time" />
        </Field>

        {state.error && <FormAlert kind="error">{state.error}</FormAlert>}

        <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-base">
          {pending ? <Spinner /> : <ShieldCheck size={16} />}
          Save &amp; back to my farm
        </button>
      </form>
    </div>
  );
}
