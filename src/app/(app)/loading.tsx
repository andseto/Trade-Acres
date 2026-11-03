// Instant feedback while a signed-in page loads its data — shown the moment a tab is clicked.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-48 rounded-xl bg-white/[0.07]" />
          <div className="h-4 w-72 max-w-full rounded-lg bg-white/[0.05]" />
        </div>
        <div className="hidden h-10 w-32 rounded-xl bg-white/[0.07] sm:block" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="panel h-[104px]" />
        ))}
      </div>
      <div className="panel h-[50vh] min-h-[320px]" />
    </div>
  );
}
