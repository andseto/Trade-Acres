"use client";

import { useActionState } from "react";
import { googleAction, type AuthFormState } from "./actions";
import { FormAlert, GoogleIcon, Spinner } from "./FormBits";

export function GoogleButton({ next, label = "Continue with Google" }: { next: string; label?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(googleAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <button type="submit" disabled={pending} className="btn-ghost w-full py-3">
        {pending ? <Spinner /> : <GoogleIcon />}
        {label}
      </button>
      {state.error && <FormAlert kind="error">{state.error}</FormAlert>}
    </form>
  );
}
