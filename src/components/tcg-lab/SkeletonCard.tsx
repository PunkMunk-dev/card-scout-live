export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border/30 bg-card overflow-hidden shadow-sm">
      <div className="aspect-[3/4] bg-muted animate-pulse" />
      <div className="p-3 space-y-2.5">
        <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          <div className="h-3 w-10 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
          <div className="h-2.5 w-14 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
