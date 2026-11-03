import clsx from "clsx";

/** Shared look for selectable wooden tiles (pickers). */
export const tileClass = (active: boolean) =>
  clsx(
    "border-[3px] border-outline transition-[filter,transform] active:translate-y-px",
    active
      ? "bg-[#3f5a20] text-cream shadow-[inset_0_0_0_2px_var(--leaf),inset_0_4px_0_0_rgba(195,235,138,0.25)]"
      : "bg-wood/70 text-muted shadow-[inset_0_2px_0_0_#7d5531,inset_0_-3px_0_0_#3d2714] hover:bg-wood hover:text-cream",
  );
