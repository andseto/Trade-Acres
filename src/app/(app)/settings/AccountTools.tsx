"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Database, Eraser, FileSpreadsheet, FileJson, Mail, Skull } from "lucide-react";
import { Modal } from "@/components/accounts/Modal";
import { Field, FormAlert, Spinner } from "@/components/auth/FormBits";
import { changeEmailAction, type SettingsState } from "./actions";
import { clearDataAction, deleteAccountAction, exportDataAction, type ClearScope, type DataResult } from "./data-actions";

function Card({ icon, title, subtitle, children, danger }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className={danger ? "panel border-[#7a2e22]! p-5 sm:p-6" : "panel p-5 sm:p-6"}>
      <div className="mb-5 flex items-start gap-3">
        <div
          className={
            danger
              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] border-[3px] border-outline bg-[#5a2018] text-loss shadow-[inset_0_2px_0_0_#7a2e22]"
              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] border-[3px] border-outline bg-wood text-gold shadow-[inset_0_2px_0_0_#7d5531]"
          }
        >
          {icon}
        </div>
        <div>
          <h2 className="font-display text-xl">{title}</h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/** Type-DELETE-to-confirm dialog shared by the clear and delete-account actions. */
function ConfirmModal({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<DataResult | void>;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function close() {
    if (pending) return;
    setText("");
    setError(null);
    onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await onConfirm();
      if (res && res.error) setError(res.error);
      else {
        setText("");
        onClose();
      }
    });
  }

  return (
    <Modal open={open} onClose={close} title={title}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2 text-sm text-muted">{children}</div>
        <Field label="Type DELETE to confirm" htmlFor="confirm-delete">
          <input
            id="confirm-delete"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="DELETE"
            className="input font-mono"
          />
        </Field>
        {error && <FormAlert kind="error">{error}</FormAlert>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={close} disabled={pending} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={pending || text.trim() !== "DELETE"} className="btn-danger">
            {pending ? <Spinner /> : <AlertTriangle size={16} />}
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ───────────────────────────── change email ─────────────────────────────

export function EmailForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(changeEmailAction, {});
  return (
    <Card icon={<Mail size={20} />} title="Email address" subtitle="Where we send sign-in and password-reset links.">
      <form action={action} className="space-y-4">
        <Field label="Email" htmlFor="new-email">
          <input id="new-email" name="email" type="email" required defaultValue={email} autoComplete="email" className="input" />
        </Field>
        {state.error && <FormAlert kind="error">{state.error}</FormAlert>}
        {state.ok && state.message && <FormAlert kind="success">{state.message}</FormAlert>}
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? <Spinner /> : <Mail size={16} />}
            Change email
          </button>
        </div>
      </form>
    </Card>
  );
}

// ───────────────────────────── your data ─────────────────────────────

function download(name: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const CLEAR_OPTIONS: { scope: ClearScope; title: string; blurb: string; confirm: ReactNode }[] = [
  {
    scope: "trades",
    title: "Clear all trades",
    blurb: "Removes every trade and its screenshots. Your plots, their growth and your journal entries stay.",
    confirm: <p>This permanently deletes every trade you have logged, including their screenshots. It can&apos;t be undone.</p>,
  },
  {
    scope: "journal",
    title: "Clear all journal entries",
    blurb: "Removes every daily journal entry and its screenshots. Your trades and plots stay.",
    confirm: <p>This permanently deletes every daily journal entry, including their screenshots. It can&apos;t be undone.</p>,
  },
  {
    scope: "plots",
    title: "Remove all plots",
    blurb: "Pulls up every plot, along with the trades and plot-specific journal entries on them.",
    confirm: <p>This permanently deletes every plot, and every trade and journal entry attached to them. It can&apos;t be undone.</p>,
  },
  {
    scope: "everything",
    title: "Reset my whole farm",
    blurb: "Deletes all plots, trades, journal entries and screenshots. You keep your login and settings.",
    confirm: <p>This permanently deletes everything you have added: plots, trades, journal entries and screenshots. Your login stays. It can&apos;t be undone.</p>,
  },
];

export function DataCard() {
  const router = useRouter();
  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [scope, setScope] = useState<ClearScope | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const active = CLEAR_OPTIONS.find((o) => o.scope === scope);

  async function runExport(kind: "json" | "csv") {
    setExporting(kind);
    setExportError(null);
    const res = await exportDataAction();
    setExporting(null);
    if (res.error || !res.json || !res.tradesCsv || !res.filename) return setExportError(res.error ?? "Couldn't build your export.");
    if (kind === "json") download(`${res.filename}.json`, "application/json", res.json);
    else download(`${res.filename}-trades.csv`, "text/csv;charset=utf-8", res.tradesCsv);
  }

  return (
    <Card icon={<Database size={20} />} title="Your data" subtitle="It's yours. Take a copy, or sweep it away.">
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-base">Download a copy</h3>
          <p className="mt-0.5 text-sm text-muted">Everything you have added: plots, trades and journal entries. Screenshots are listed by path but not included.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" disabled={exporting !== null} onClick={() => runExport("json")}>
              {exporting === "json" ? <Spinner /> : <FileJson size={16} />}
              Everything (.json)
            </button>
            <button type="button" className="btn-ghost" disabled={exporting !== null} onClick={() => runExport("csv")}>
              {exporting === "csv" ? <Spinner /> : <FileSpreadsheet size={16} />}
              Trades (.csv)
            </button>
          </div>
          {exportError && (
            <div className="mt-3">
              <FormAlert kind="error">{exportError}</FormAlert>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display text-base">Clear data</h3>
          <p className="mt-0.5 text-sm text-muted">Pick what to remove. Each one asks you to confirm first.</p>
          {done && (
            <div className="mt-3">
              <FormAlert kind="success">{done}</FormAlert>
            </div>
          )}
          <ul className="mt-3 divide-y-[3px] divide-outline border-[3px] border-outline bg-soil/40">
            {CLEAR_OPTIONS.map((o) => (
              <li key={o.scope} className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-[15px]">{o.title}</p>
                  <p className="text-sm text-muted">{o.blurb}</p>
                </div>
                <button
                  type="button"
                  className="btn-ghost shrink-0 text-loss"
                  onClick={() => {
                    setDone(null);
                    setScope(o.scope);
                  }}
                >
                  <Eraser size={16} />
                  Clear…
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ConfirmModal
        open={scope !== null}
        onClose={() => setScope(null)}
        title={active?.title ?? ""}
        confirmLabel="Delete for good"
        onConfirm={async () => {
          const res = await clearDataAction(scope!, "DELETE");
          if (res.ok) {
            setDone(res.message ?? "Done.");
            router.refresh();
          }
          return res;
        }}
      >
        {active?.confirm}
      </ConfirmModal>
    </Card>
  );
}

// ───────────────────────────── danger zone ─────────────────────────────

export function DangerCard() {
  const [open, setOpen] = useState(false);
  return (
    <Card danger icon={<Skull size={20} />} title="Delete account" subtitle="Close your account and wipe everything for good.">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-muted">
          Permanently deletes your login, profile, plots, trades, journal entries and screenshots. We can&apos;t bring any of it back, so download a copy first.
        </p>
        <button type="button" className="btn-danger shrink-0" onClick={() => setOpen(true)}>
          Delete my account…
        </button>
      </div>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete your account?"
        confirmLabel="Delete my account"
        onConfirm={() => deleteAccountAction("DELETE")}
      >
        <p>This closes your account and permanently deletes your plots, trades, journal entries and screenshots. You&apos;ll be signed out straight away.</p>
        <p>There&apos;s no undo and no recovery.</p>
      </ConfirmModal>
    </Card>
  );
}
