import { useState, useMemo } from 'react';
import { ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { UnifiedEmptyState } from '@/components/shared/UnifiedEmptyState';
import { UnifiedErrorState } from '@/components/shared/UnifiedErrorState';
import { useLiveRoiAuctions, type LiveRoiAuction } from '@/hooks/useLiveRoiAuctions';
import type { RoiCard } from '@/hooks/useRoiCards';

interface LiveRoiAuctionsProps {
  cards: RoiCard[] | undefined;
  isLoadingRoi: boolean;
  roiError: unknown;
}

function fmt(val: number | null, prefix = '$'): string {
  if (val == null) return '—';
  return `${prefix}${val.toFixed(val < 100 ? 2 : 0)}`;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="om-card p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

export function LiveRoiAuctions({ cards, isLoadingRoi, roiError }: LiveRoiAuctionsProps) {
  const [minProfit, setMinProfit] = useState(50);
  const [endingSoon, setEndingSoon] = useState(false);
  const { data: liveRows, isLoading: isLoadingLive, error: liveError, isFetching } = useLiveRoiAuctions();

  const cardMap = useMemo(() => {
    if (!cards) return new Map<string, RoiCard>();
    return new Map(cards.map(c => [c.id, c]));
  }, [cards]);

  const enriched = useMemo(() => {
    if (!liveRows || !cards) return [];
    let rows = liveRows
      .map(row => ({ auction: row, card: cardMap.get(row.roi_card_id) }))
      .filter((r): r is { auction: LiveRoiAuction; card: RoiCard } => !!r.card);

    if (minProfit > 0) {
      rows = rows.filter(r => (r.card.psa10_profit ?? 0) >= minProfit);
    }

    if (endingSoon) {
      rows.sort((a, b) => {
        const aEnd = a.auction.end_time ? new Date(a.auction.end_time).getTime() : Infinity;
        const bEnd = b.auction.end_time ? new Date(b.auction.end_time).getTime() : Infinity;
        return aEnd - bEnd;
      });
    }

    return rows;
  }, [liveRows, cards, cardMap, minProfit, endingSoon]);

  const isLoading = isLoadingRoi || isLoadingLive;
  const error = roiError || liveError;

  if (error) return <UnifiedErrorState message="Failed to load live auctions" />;

  return (
    <div>
      {/* Toolbar */}
      <div className="om-toolbar flex items-center gap-3 px-3 h-10 mb-4 overflow-x-auto">
        <label className="flex items-center gap-1.5 text-xs font-mono shrink-0" style={{ color: 'var(--om-text-2)' }}>
          Min profit
          <input
            type="number"
            value={minProfit}
            onChange={(e) => setMinProfit(Number(e.target.value) || 0)}
            className="om-input h-7 w-16 px-2 text-xs font-mono text-center"
          />
        </label>
        <div className="border-l h-5 shrink-0" style={{ borderColor: 'var(--om-border)' }} />
        <label className="flex items-center gap-1.5 text-xs font-mono shrink-0 cursor-pointer" style={{ color: 'var(--om-text-2)' }}>
          <Clock className="h-3.5 w-3.5" />
          Ending soon
          <Switch checked={endingSoon} onCheckedChange={setEndingSoon} className="scale-75" />
        </label>
        {isFetching && (
          <>
            <div className="border-l h-5 shrink-0" style={{ borderColor: 'var(--om-border)' }} />
            <span className="flex items-center gap-1 text-[10px] font-mono shrink-0" style={{ color: 'var(--om-text-3)' }}>
              <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing…
            </span>
          </>
        )}
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs mb-3" style={{ color: 'var(--om-text-3)' }}>
          {enriched.length} live auction{enriched.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <SkeletonGrid />
      ) : enriched.length === 0 ? (
        <UnifiedEmptyState
          variant="no-results"
          title="No live ROI auctions right now"
          message="They'll show up here automatically and stick for a short grace period."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {enriched.map(({ auction, card }) => (
            <a
              key={auction.id}
              href={auction.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="om-card p-4 space-y-2 hover:-translate-y-px transition-all duration-200 group"
              style={{ border: '1px solid var(--om-border-0)' }}
            >
              <div className="flex items-start justify-between gap-1">
                <h3 className="text-xs font-semibold line-clamp-2" style={{ color: 'var(--om-text-0)' }}>
                  {card.card_name}
                </h3>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--om-text-3)' }} />
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                <div>
                  <span style={{ color: 'var(--om-text-3)' }}>Bid</span>
                  <div style={{ color: 'var(--om-text-0)' }}>{fmt(auction.current_bid)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--om-text-3)' }}>Raw Avg</span>
                  <div style={{ color: 'var(--om-text-0)' }}>{fmt(card.raw_avg)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--om-text-3)' }}>PSA 10 Profit</span>
                  <div className={`font-semibold ${(card.psa10_profit ?? 0) > 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {fmt(card.psa10_profit)}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--om-text-3)' }}>Multiplier</span>
                  <div style={{ color: 'var(--om-text-0)' }}>{card.multiplier != null ? `${card.multiplier.toFixed(1)}×` : '—'}</div>
                </div>
              </div>
              {auction.end_time && (
                <p className="text-[10px] font-mono" style={{ color: 'var(--om-text-3)' }}>
                  Ends {new Date(auction.end_time).toLocaleDateString()} {new Date(auction.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
