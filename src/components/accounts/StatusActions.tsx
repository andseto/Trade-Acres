"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Fence, LoaderCircle, Skull, Sprout, Trash2, Trophy } from "lucide-react";
import { deleteAccount, setAccountStatus } from "@/app/(app)/accounts/actions";
import { PlotPreview } from "@/components/farm/PlotPreview";
import type { GrowthStage } from "@/lib/farm";
import type { AccountStatus, AccountType, CropId } from "@/lib/types";
import { BLOWN_CONDOLENCES } from "./constants";
import { Modal } from "./Modal";

interface Props {
  id: string;
  status: AccountStatus;
  accountType: AccountType;
  plotName: string;
  crop: CropId;
  stage: GrowthStage;
  tradeCount: number;
}

// ───────────────────────────── pixel particles ─────────────────────────────

const LEAF = ["..##.", ".####", "####.", "###..", "#...."];
const STAR = ["..#..", "..#..", "#####", "..#..", "..#.."];
const SPARK = [".#.", "###", ".#."];

function PixelGlyph({ rows, color, px }: { rows: string[]; color: string; px: number }) {
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg width={w * px} height={h * px} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden>
      {rows.flatMap((r, y) => [...r].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null)))}
    </svg>
  );
}

type Particle = { id: number; x: number; sway: number; delay: number; dur: number; rest: number; kind: "leaf" | "star" | "spark"; color: string; px: number };
const LEAF_COLORS = ["#8cc84b", "#5e9a2a", "#c3eb8a", "#d9853e"];
const STAR_COLORS = ["#f2c14e", "#f8dc8c", "#f6e7c1"];

function makeParticles(n = 46): Particle[] {
  return Array.from({ length: n }, (_, i) => {
    const r = Math.random();
    const kind: Particle["kind"] = r < 0.5 ? "leaf" : r < 0.8 ? "star" : "spark";
    const pool = kind === "leaf" ? LEAF_COLORS : STAR_COLORS;
    return {
      id: i,
      x: Math.random() * 100,
      sway: 16 + Math.random() * 28,
      delay: Math.random() * 1.6,
      dur: 3.2 + Math.random() * 2.4,
      rest: Math.random(),
      kind,
      color: pool[i % pool.length],
      px: kind === "spark" ? 3 : Math.random() > 0.5 ? 4 : 3,
    };
  });
}

// ───────────────────────────── component ─────────────────────────────

export function StatusActions({ id, status, accountType, plotName, crop, stage, tradeCount }: Props) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<AccountStatus | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmBlown, setConfirmBlown] = useState(false);
  const [condolence, setCondolence] = useState(BLOWN_CONDOLENCES[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[] | null>(null);

  function change(next: AccountStatus, after?: () => void) {
    setBusy(next);
    setError(null);
    startTransition(async () => {
      const res = await setAccountStatus(id, next);
      setBusy(null);
      if (res.error) setError(res.error);
      else after?.();
    });
  }

  function doDelete() {
    setBusy("delete");
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteAccount(id, deleteText);
      // on success the action redirects to /accounts
      setBusy(null);
      if (res?.error) setDeleteError(res.error);
    });
  }

  const spinner = <LoaderCircle size={16} className="animate-spin" />;
  const goldBtn =
    "btn bg-gold text-[#3a2616] shadow-[inset_0_3px_0_0_#f8dc8c,inset_0_-4px_0_0_#b8862a,0_3px_0_0_rgba(0,0,0,0.4)] hover:brightness-105";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === "active" && (
          <>
            {accountType === "eval" && (
              <button type="button" className={goldBtn} disabled={pending} onClick={() => change("passed", () => setParticles(makeParticles()))}>
                {busy === "passed" ? spinner : <Trophy size={16} />} Passed the eval — harvest! 🏆
              </button>
            )}
            <button
              type="button"
              className="btn-danger"
              disabled={pending}
              onClick={() => {
                setCondolence(BLOWN_CONDOLENCES[Math.floor(Math.random() * BLOWN_CONDOLENCES.length)]);
                setConfirmBlown(true);
              }}
            >
              <Skull size={16} /> Account blown 💀
            </button>
            <button type="button" className="btn-ghost" disabled={pending} onClick={() => change("retired")}>
              {busy === "retired" ? spinner : <Fence size={16} />} Let it lie fallow
            </button>
          </>
        )}
        {status === "passed" && (
          <button type="button" className="btn-ghost" disabled={pending} onClick={() => change("retired")}>
            {busy === "retired" ? spinner : <Fence size={16} />} Let it lie fallow
          </button>
        )}
        {status !== "active" && (
          <button type="button" className="btn-ghost" disabled={pending} onClick={() => change("active")}>
            {busy === "active" ? spinner : <Sprout size={16} />} Replant
          </button>
        )}
        <button
          type="button"
          className="btn-ghost text-muted hover:text-loss"
          disabled={pending}
          onClick={() => {
            setDeleteText("");
            setDeleteError(null);
            setConfirmDelete(true);
          }}
        >
          <Trash2 size={16} /> Delete plot
        </button>
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-loss">{error}</p>}

      {/* blown confirmation */}
      <Modal open={confirmBlown} onClose={() => setConfirmBlown(false)} title={`Bad news for ${plotName}?`}>
        <div className="flex justify-center pb-4">
          <PlotPreview crop={crop} stage={stage} state="dead" size={128} />
        </div>
        <p className="font-display text-lg text-cream">{condolence}</p>
        <p className="mt-2 text-sm text-muted">
          Marking this account as blown kills the crop on {plotName}. Your trades stay in the journal. The lessons are the real harvest.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setConfirmBlown(false)}>
            Not yet, it&apos;s still green
          </button>
          <button type="button" className="btn-danger" disabled={pending} onClick={() => change("blown", () => setConfirmBlown(false))}>
            {busy === "blown" ? spinner : <Skull size={16} />} Pull it up
          </button>
        </div>
      </Modal>

      {/* delete confirmation */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Pave over this plot?">
        <p className="text-muted">
          This permanently deletes <span className="font-semibold text-cream">{plotName}</span> and the account it represents.
        </p>
        <p className="mt-3 rounded-sm border-[3px] border-outline bg-[#4e1d14] px-3 py-2 text-sm text-[#f59a8a]">
          ⚠️ {tradeCount > 0 ? `All ${tradeCount} ${tradeCount === 1 ? "trade" : "trades"}` : "Any trades"} and journal entries linked to this account
          will be deleted too. This can&apos;t be undone.
        </p>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (deleteText.trim() === plotName.trim()) doDelete();
          }}
        >
          <label htmlFor="confirm-delete" className="label">
            Type <span className="normal-case tracking-normal text-cream">{plotName}</span> to confirm
          </label>
          <input
            id="confirm-delete"
            className="input"
            autoComplete="off"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder={plotName}
          />
          {deleteError && <p className="mt-1.5 text-xs font-semibold text-loss">{deleteError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(false)}>
              Keep it
            </button>
            <button type="submit" className="btn-danger" disabled={pending || deleteText.trim() !== plotName.trim()}>
              {busy === "delete" ? spinner : <Trash2 size={16} />} Delete forever
            </button>
          </div>
        </form>
      </Modal>

      {/* passed celebration: falling pixel leaves + stars */}
      <AnimatePresence>
        {particles && (
          <motion.div
            className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-hidden bg-outline/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setParticles(null)}
          >
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute top-0"
                style={{ left: `${p.x}%` }}
                initial={{ y: -40, x: 0 }}
                animate={{
                  y: "105vh",
                  x: [0, p.sway, -p.sway, p.sway * 0.6, 0],
                  scaleX: p.kind === "leaf" ? [1, -1, 1, -1, 1] : 1,
                  opacity: p.kind === "leaf" ? 1 : [1, 0.4, 1, 0.4, 1],
                }}
                transition={{ duration: p.dur, delay: p.delay, ease: "linear", repeat: 1, repeatDelay: p.rest }}
              >
                <PixelGlyph rows={p.kind === "leaf" ? LEAF : p.kind === "star" ? STAR : SPARK} color={p.color} px={p.px} />
              </motion.div>
            ))}
            <motion.div
              className="panel relative mx-4 flex max-w-sm flex-col items-center px-8 py-8 text-center"
              style={{ borderColor: "#6b4f12", boxShadow: "inset 0 0 0 2px #b8862a, inset 0 4px 0 0 rgba(255,220,160,0.1), 0 6px 0 0 rgba(0,0,0,0.4)" }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
                <PlotPreview crop={crop} stage="ripe" state="harvested" size={160} animated />
              </motion.div>
              <h2 className="mt-5 font-display text-3xl text-gold">Golden harvest!</h2>
              <p className="mt-2 text-muted">
                Eval passed. {plotName} came in golden. Go claim that funded account, and keep the journal watered.
              </p>
              <button type="button" className={`${goldBtn} mt-6`} onClick={() => setParticles(null)}>
                🏆 Bring it in
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
