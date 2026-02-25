import React from 'react';

export const SkeletonCard = React.forwardRef<HTMLDivElement>(
  function SkeletonCard(_props, ref) {
    return (
      <div ref={ref} className="om-card overflow-hidden">
        <div className="aspect-square om-shimmer" />
        <div className="p-3 space-y-2.5">
          <div className="h-5 w-20 rounded om-shimmer" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded om-shimmer" />
            <div className="h-3.5 w-3/4 rounded om-shimmer" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-14 rounded-full om-shimmer" />
            <div className="h-6 w-16 rounded-full om-shimmer" />
          </div>
        </div>
      </div>
    );
  }
);
