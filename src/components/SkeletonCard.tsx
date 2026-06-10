export function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="skeleton h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-20" />
          </div>
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-4 w-16" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" data-testid="skeleton-list">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
