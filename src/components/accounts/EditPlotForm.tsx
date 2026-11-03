"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Save } from "lucide-react";
import { updateAccount } from "@/app/(app)/accounts/actions";
import type { Account } from "@/lib/types";
import { AccountFields, CropPicker, HiddenPlotInputs, NameField, PlotSignPreview } from "./PlotFields";
import type { PlotField, PlotFormState, PlotFormValues } from "./form-types";

type Errors = Partial<Record<PlotField, string>>;

const str = (n: number | null) => (n === null || n === undefined ? "" : String(n));

export function EditPlotForm({ account }: { account: Account }) {
  const [values, setValues] = useState<PlotFormValues>({
    name: account.name,
    firm: account.firm ?? "",
    account_type: account.account_type,
    account_size: str(account.account_size),
    profit_target: str(account.profit_target),
    max_drawdown: str(account.max_drawdown),
    notes: account.notes ?? "",
    crop: account.crop,
    plot_name: account.plot_name,
  });
  const [errors, setErrors] = useState<Errors>({});

  const [state, formAction, pending] = useActionState(async (prev: PlotFormState, fd: FormData) => {
    const res = await updateAccount(prev, fd);
    setErrors(res.errors ?? {});
    return res;
  }, {});

  function patch(p: Partial<PlotFormValues>) {
    setValues((v) => ({ ...v, ...p }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(p) as PlotField[]) delete next[k];
      return next;
    });
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="id" value={account.id} />
      <HiddenPlotInputs values={values} />

      <div className="space-y-6">
        <section className="panel p-5 sm:p-7">
          <h2 className="mb-5 font-display text-xl">The account</h2>
          <AccountFields values={values} onChange={patch} errors={errors} />
        </section>

        <section className="panel p-5 sm:p-7">
          <h2 className="mb-1 font-display text-xl">Crop</h2>
          <p className="mb-6 text-sm text-muted">Switching crops keeps your growth. The new crop picks up at the same stage.</p>
          <CropPicker values={values} onChange={patch} errors={errors} />
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section className="panel p-5 sm:p-7">
          <h2 className="mb-5 font-display text-xl">Plot name</h2>
          <NameField values={values} onChange={patch} errors={errors} compact />
          <div className="mt-6 flex justify-center">
            <PlotSignPreview values={values} size={176} />
          </div>
        </section>

        {state.message && !pending && (
          <p className="rounded-sm border-[3px] border-outline bg-[#4e1d14] px-4 py-2.5 text-sm text-[#f59a8a]" role="alert">
            {state.message}
          </p>
        )}

        <div className="flex gap-3">
          <Link href={`/accounts/${account.id}`} className="btn-ghost flex-1">
            Cancel
          </Link>
          <button type="submit" className="btn-primary flex-[1.4] whitespace-nowrap" disabled={pending}>
            {pending ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </aside>
    </form>
  );
}
