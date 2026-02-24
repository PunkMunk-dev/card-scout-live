import React from 'react';

export const SkeletonCard = React.forwardRef<HTMLDivElement>(
  function SkeletonCard(_props, ref) {
    return (
      <div ref={ref} className="rounded-lg overflow-hidden border border-border shadow-sm bg-card">
        <div className="aspect-square animate-pulse bg-muted" />
        <div className="p-3 space-y-2.5">
          <div className="h-5 w-20 rounded animate-pulse bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded animate-pulse bg-muted" />
            <div className="h-3.5 w-3/4 rounded animate-pulse bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-14 rounded-full animate-pulse bg-muted" />
            <div className="h-6 w-16 rounded-full animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    );
  }
);
