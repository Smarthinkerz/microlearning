import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Card skeleton ─────────────────────────────────────────── */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border p-5 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
          <Skeleton className="h-3 w-1/2 skeleton-shimmer" />
        </div>
      </div>
      <Skeleton className="h-3 w-full skeleton-shimmer" />
      <Skeleton className="h-3 w-5/6 skeleton-shimmer" />
      <Skeleton className="h-8 w-24 rounded-md skeleton-shimmer" />
    </div>
  );
}

/* ── List skeleton ─────────────────────────────────────────── */
export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
          <Skeleton className="h-8 w-8 rounded-md skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 skeleton-shimmer" style={{ width: `${50 + (i * 17) % 40}%` }} />
            <Skeleton className="h-3 skeleton-shimmer" style={{ width: `${30 + (i * 11) % 30}%` }} />
          </div>
          <Skeleton className="h-6 w-16 rounded-full skeleton-shimmer shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ── Table skeleton ────────────────────────────────────────── */
export function TableSkeleton({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-muted/50 border-b border-border px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 skeleton-shimmer" style={{ width: `${60 + (i * 20) % 40}px` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/50 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 skeleton-shimmer" style={{ width: `${50 + ((i + j) * 13) % 50}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Detail skeleton ───────────────────────────────────────── */
export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 skeleton-shimmer" />
        <Skeleton className="h-4 w-96 skeleton-shimmer" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full skeleton-shimmer" />
          <Skeleton className="h-6 w-16 rounded-full skeleton-shimmer" />
        </div>
      </div>
      {/* Content blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-2">
            <Skeleton className="h-3 w-20 skeleton-shimmer" />
            <Skeleton className="h-7 w-24 skeleton-shimmer" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full skeleton-shimmer" />
        <Skeleton className="h-4 w-5/6 skeleton-shimmer" />
        <Skeleton className="h-4 w-4/5 skeleton-shimmer" />
        <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
      </div>
    </div>
  );
}

/* ── Stats grid skeleton ───────────────────────────────────── */
export function StatsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4", `grid-cols-2 md:grid-cols-${Math.min(count, 4)}`, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-5 space-y-2">
          <Skeleton className="h-3 w-24 skeleton-shimmer" />
          <Skeleton className="h-8 w-16 skeleton-shimmer" />
          <Skeleton className="h-3 w-20 skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
