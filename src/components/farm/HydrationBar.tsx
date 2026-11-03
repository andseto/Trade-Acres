import clsx from "clsx";

/** Chunky 10-segment water gauge. 100 = just watered. */
export function HydrationBar({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(Math.max(0, Math.min(100, value)) / 10);
  const color = value > 50 ? "#5a92d6" : value > 25 ? "#f2c14e" : "#e8604c";
  return (
    <div
      className={clsx("flex h-3 gap-[2px] border-2 border-outline bg-soil p-[2px]", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label="Hydration"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className="flex-1" style={{ background: i < filled ? color : "#3a2616", boxShadow: i < filled ? "inset 0 1px 0 0 rgba(255,255,255,0.35)" : undefined }} />
      ))}
    </div>
  );
}
