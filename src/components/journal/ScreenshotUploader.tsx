"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ClipboardPaste, ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** One screenshot in a form: either already stored (path) or freshly picked (file). */
export interface ShotItem {
  key: string;
  path?: string; // storage path once uploaded
  url?: string; // signed URL (existing) or object URL (new)
  file?: File;
}

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_SHOTS = 12;

function extFor(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  const fromType = file.type.split("/")[1]?.replace("jpeg", "jpg").replace("svg+xml", "svg");
  return fromType || "png";
}

/** Upload every item that has a file but no path yet. Returns the updated list (all with paths). */
export async function uploadPendingShots(items: ShotItem[], userId: string): Promise<ShotItem[]> {
  const supabase = createClient();
  const out: ShotItem[] = [];
  for (const item of items) {
    if (item.path || !item.file) {
      out.push(item);
      continue;
    }
    const path = `${userId}/${crypto.randomUUID()}.${extFor(item.file)}`;
    const { error } = await supabase.storage
      .from("screenshots")
      .upload(path, item.file, { contentType: item.file.type || "image/png", upsert: false });
    if (error) throw new Error(`Screenshot upload failed: ${error.message}`);
    out.push({ ...item, path });
  }
  return out;
}

export function ScreenshotUploader({
  items,
  onChange,
  listenPaste = true,
  disabled,
}: {
  items: ShotItem[];
  onChange: (next: ShotItem[]) => void;
  /** capture Ctrl+V image pastes anywhere on the page while mounted */
  listenPaste?: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // keep latest values for the paste listener without re-binding
  const latest = useRef({ items, onChange });
  useEffect(() => {
    latest.current = { items, onChange };
  });

  // revoke object URLs we created when unmounting
  const created = useRef<Set<string>>(new Set());
  useEffect(() => {
    const set = created.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function addFiles(files: Iterable<File>) {
    const { items: current, onChange: emit } = latest.current;
    const next = [...current];
    let skipped = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        skipped++;
        continue;
      }
      if (file.size > MAX_BYTES) {
        setWarning(`${file.name || "Image"} is over 10 MB — skipped.`);
        continue;
      }
      if (next.length >= MAX_SHOTS) {
        setWarning(`Max ${MAX_SHOTS} screenshots per log.`);
        break;
      }
      const url = URL.createObjectURL(file);
      created.current.add(url);
      next.push({ key: crypto.randomUUID(), file, url });
    }
    if (skipped) setWarning("Only images can be added.");
    if (next.length !== current.length) emit(next);
  }

  useEffect(() => {
    if (!listenPaste || disabled) return;
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      setWarning(null);
      addFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [listenPaste, disabled]);

  function remove(key: string) {
    const item = items.find((i) => i.key === key);
    if (item?.file && item.url && created.current.has(item.url)) {
      URL.revokeObjectURL(item.url);
      created.current.delete(item.url);
    }
    onChange(items.filter((i) => i.key !== key));
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (disabled) return;
          setWarning(null);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        className={clsx(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-[3px] border-dashed px-4 py-6 text-center transition-colors",
          dragging ? "border-leaf bg-[#2f4218]" : "border-plank bg-soil/50 hover:border-leaf hover:bg-soil/70",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <ImagePlus className={dragging ? "text-leaf" : "text-muted"} size={28} />
        <p className="text-sm font-semibold">
          {dragging ? "Drop it in the basket!" : "Drag & drop screenshots, or click to browse"}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted">
          <ClipboardPaste size={12} /> Tip: paste a chart straight from your clipboard with Ctrl+V
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            setWarning(null);
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {warning && <p className="mt-2 text-xs text-gold">{warning}</p>}

      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <li
              key={item.key}
              className="group relative aspect-video overflow-hidden rounded-sm border-[3px] border-outline bg-soil"
            >
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="Screenshot preview" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted">🖼️</div>
              )}
              {!item.path && (
                <span className="absolute bottom-1 left-1 rounded-xs border-2 border-outline bg-leaf px-1 font-display text-[10px] text-[#1d2b0c]">
                  NEW
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(item.key)}
                disabled={disabled}
                aria-label="Remove screenshot"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-xs border-2 border-outline bg-wood text-cream opacity-90 transition hover:bg-loss sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
