"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { CropSprite } from "@/components/farm/CropSprite";
import { PixelArt, WATERING_CAN } from "@/components/landing/PixelArt";

/** Celebratory "go check your email" state shown after signup / magic link / reset requests. */
export function CheckInbox({
  email,
  title = "Check your inbox",
  children,
  footer,
}: {
  email: string;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className="relative mx-auto mb-5 flex h-28 w-44 items-end justify-center gap-1">
        <CropSprite crop="sunflower" stage="sprout" size={64} animated />
        <motion.div
          className="absolute right-2 top-0"
          animate={{ rotate: [0, -10, -10, 0], y: [0, -2, -2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <PixelArt piece={WATERING_CAN} scale={3} />
        </motion.div>
      </div>
      <h1 className="font-display text-3xl [text-shadow:2px_2px_0_#140c06]">{title}</h1>
      <p className="mt-3 text-muted">
        We sent a link to <span className="break-all font-bold text-cream">{email}</span>.
      </p>
      <div className="mt-2 text-sm text-muted">{children ?? "Click it and your first plot is ready for seeds."}</div>
      <p className="mt-5 rounded-[3px] border-2 border-outline bg-soil/50 px-3 py-2 text-xs text-muted">
        Nothing yet? Give it a minute and check spam &mdash; sometimes mail gets lost in the hay.
      </p>
      {footer && <div className="mt-5 text-sm">{footer}</div>}
    </motion.div>
  );
}
