import { useState, useCallback, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CaptureSnapshotButton } from '@/components/ui-audit/CaptureSnapshotButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { UnifiedEmptyState } from '@/components/shared/UnifiedEmptyState';
import { UnifiedErrorState } from '@/components/shared/UnifiedErrorState';
import { useLiveAuctionFeed } from '@/hooks/useLiveAuctionFeed';
import { LiveAuctionCard } from '@/components/roi/LiveAuctionCard';

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="om-card rounded-2xl p-4 space-y-3">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function TopRoi() {
  const [minProfit, setMinProfit] = useState(50);
  const [sport, setSport] = useState('All');

  const { data: feed, isLoading, isFetching, error, refetch } = useLiveAuctionFeed({ minProfit });

  const uniqueSports = useMemo(
    () => ['All', ...[...new Set(feed.map(f => f.card.sport).filter(Boolean))].sort()],
    [feed]
  );

  const filteredFeed = useMemo(
    () => sport === 'All' ? feed : feed.filter(f => f.card.sport === sport),
    [feed, sport]
  );

  const getSnapshotState = useCallback(() => ({
    searchInputs: {},
    filters: { minProfit, sport },
    pagination: { liveCount: filteredFeed.length },
    loadingFlags: { isLoading },
    errorState: error ? { message: String(error) } : null,
    resultsSchema: { itemKeys: ['id', 'roi_card_id', 'item_id', 'current_bid', 'end_time'], count: filteredFeed.length },
    layoutMode: {},
  }), [minProfit, sport, filteredFeed.length, isLoading, error]);

  return (
    <div className="om-page-bg pb-24 md:pb-8 relative">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8">
        <PageHeader
          title="Live Auctions"
          subtitle="Sniper feed — auctions ending soonest"
          rightSlot={<CaptureSnapshotButton appId="roi" getState={getSnapshotState} />}
        />

        {error ? (
          <UnifiedErrorState message="Failed to load live auctions" onRetry={() => refetch()} />
        ) : (
          <>
            {/* Toolbar */}
            <div className="om-toolbar flex items-center gap-3 px-3 h-10 mb-4">
              <label className="flex items-center gap-1.5 text-xs font-mono shrink-0" style={{ color: 'var(--om-text-2)' }}>
                Min profit
                <input
                  type="number"
                  value={minProfit}
                  onChange={(e) => setMinProfit(Number(e.target.value) || 0)}
                  className="om-input h-7 w-16 px-2 text-xs font-mono text-center"
                />
              </label>

              <div className="flex-1" />

              <span className="flex items-center gap-1.5 text-[10px] font-mono shrink-0" style={{ color: 'var(--om-text-3)' }}>
                {isFetching && <RefreshCw className="h-3 w-3 animate-spin" />}
                Refreshing every 30s
              </span>
            </div>

            {/* Count */}
            {!isLoading && (
              <p className="text-xs mb-3" style={{ color: 'var(--om-text-3)' }}>
                {feed.length} live auction{feed.length !== 1 ? 's' : ''}
              </p>
            )}

            {/* Grid */}
            {isLoading ? (
              <SkeletonGrid />
            ) : feed.length === 0 ? (
              <UnifiedEmptyState
                variant="no-results"
                title="No live auctions right now"
                message="This feed automatically shows ROI-list auctions and updates as they appear."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {feed.map(({ live, card }) => (
                  <LiveAuctionCard key={live.id} live={live} card={card} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
