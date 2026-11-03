"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GalleryImage {
  path: string;
  url: string | null;
}

export function ScreenshotGallery({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const shown = images.filter((i): i is { path: string; url: string } => !!i.url);

  if (images.length === 0) {
    return <p className="text-sm text-muted">No screenshots on this one.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((img, i) => (
          <li key={img.path}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group block aspect-video w-full overflow-hidden rounded-sm border-[3px] border-outline bg-soil shadow-[0_0_0_2px_#6b4426] transition hover:shadow-[0_0_0_2px_var(--leaf)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Screenshot ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      {shown.length < images.length && (
        <p className="mt-2 text-xs text-gold">
          {images.length - shown.length} screenshot(s) couldn&apos;t be loaded.
        </p>
      )}
      <Lightbox images={shown.map((s) => s.url)} index={open} onIndex={setOpen} />
    </>
  );
}

export function Lightbox({
  images,
  index,
  onIndex,
}: {
  images: string[];
  index: number | null;
  onIndex: (i: number | null) => void;
}) {
  const count = images.length;
  const go = useCallback(
    (delta: number) => {
      if (index === null || count === 0) return;
      onIndex((index + delta + count) % count);
    },
    [index, count, onIndex],
  );

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onIndex(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, go, onIndex]);

  return (
    <AnimatePresence>
      {index !== null && images[index] && (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-outline/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot viewer"
        >
          <motion.img
            key={images[index]}
            src={images[index]}
            alt={`Screenshot ${index + 1} of ${count}`}
            className="max-h-[84vh] max-w-[92vw] rounded-sm border-[4px] border-outline object-contain shadow-[0_0_0_4px_#6b4426,0_8px_0_4px_rgba(0,0,0,0.5)]"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.15, ease: "linear" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => onIndex(null)}
            aria-label="Close"
            className="absolute right-4 top-4 h-10 w-10 grid place-items-center rounded-sm border-[3px] border-outline bg-wood text-cream shadow-[inset_0_2px_0_0_#7d5531,inset_0_-3px_0_0_#3d2714,0_3px_0_0_rgba(0,0,0,0.4)] hover:brightness-110 active:translate-y-0.5"
          >
            <X size={20} />
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous screenshot"
                className="absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 grid place-items-center rounded-sm border-[3px] border-outline bg-wood text-cream shadow-[inset_0_2px_0_0_#7d5531,inset_0_-3px_0_0_#3d2714,0_3px_0_0_rgba(0,0,0,0.4)] hover:brightness-110 active:translate-y-0.5"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Next screenshot"
                className="absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 grid place-items-center rounded-sm border-[3px] border-outline bg-wood text-cream shadow-[inset_0_2px_0_0_#7d5531,inset_0_-3px_0_0_#3d2714,0_3px_0_0_rgba(0,0,0,0.4)] hover:brightness-110 active:translate-y-0.5"
              >
                <ChevronRight size={22} />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 panel px-3 py-1.5 font-display text-xs text-cream">
                {index + 1} / {count} · ← → to browse · Esc to close
              </p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
