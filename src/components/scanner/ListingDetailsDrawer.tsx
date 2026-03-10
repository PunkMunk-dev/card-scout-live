import { useMemo } from 'react';
import { X, ExternalLink, Star, GitCompare, Clock } from 'lucide-react';
import { useScanner } from '@/hooks/useScannerState';
import { useSharedWatchlist } from '@/contexts/WatchlistContext';
import { cn } from '@/lib/utils';
import type { NormalizedListing, OpportunityStrength } from '@/types/scanner';
import type { EbayItem } from '@/types/ebay';

const STRENGTH_COLORS: Record<OpportunityStrength, string> = {
  strong: 'var(--om-success)',
  good: 'var(--om-accent)',
  watch: 'var(--om-warning)',
  weak: 'var(--om-text-3)',
};

function toEbayItem(l: NormalizedListing): EbayItem {
  return {
    itemId: l.id, title: l.title,
    price: { value: String(l.price ?? 0), currency: 'USD' },
    shipping: l.shipping !== null ? { value: String(l.shipping), currency: 'USD' } : undefined,
    condition: l.condition ?? 'Unknown',
    buyingOption: l.listingType === 'auction' ? 'AUCTION' : 'FIXED_PRICE',
    endDate: l.endTime ?? undefined, imageUrl: l.imageUrl ?? undefined,
    itemUrl: l.ebayUrl ?? undefined, seller: l.sellerName ?? undefined,
  };
}

export function ListingDetailsDrawer() {
  const { state, dispatch } = useScanner();
  const { toggleWatchlist, isInWatchlist } = useSharedWatchlist();

  const listing = useMemo(
    () => state.results.find(r => r.id === state.selectedListingId) ?? null,
    [state.results, state.selectedListingId],
  );

  if (!listing || state.drawerMode !== 'details') return null;

  const watched = isInWatchlist(listing.id);

  return (
    <aside
      className="fixed inset-0 z-50 md:static md:z-auto md:w-80 shrink-0 md:border-l overflow-y-auto"
      style={{ background: 'var(--om-bg-1)', borderColor: 'var(--om-border-0)', height: 'calc(100vh - 72px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 sticky top-0 z-10" style={{ background: 'var(--om-bg-1)', borderBottom: '1px solid var(--om-border-0)' }}>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--om-text-0)' }}>Details</span>
        <button onClick={() => dispatch({ type: 'SELECT_LISTING', id: null })} className="p-1 rounded hover:bg-[var(--om-bg-2)]">
          <X className="h-3.5 w-3.5" style={{ color: 'var(--om-text-3)' }} />
        </button>
      </div>

      {/* Image */}
      {listing.imageUrl && (
        <div className="p-3">
          <img src={listing.imageUrl} alt="" className="w-full rounded-lg object-contain max-h-64" style={{ background: 'var(--om-bg-3)' }} />
        </div>
      )}

      {/* Info */}
      <div className="px-3 pb-3 space-y-3">
        <div>
          <p className="text-xs font-medium leading-snug" style={{ color: 'var(--om-text-0)' }}>{listing.normalizedLabel}</p>
          <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--om-text-3)' }}>{listing.title}</p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricBox label="Price" value={`$${listing.price?.toFixed(2) ?? '—'}`} />
          <MetricBox label="Shipping" value={listing.shipping === 0 ? 'Free' : listing.shipping !== null ? `$${listing.shipping.toFixed(2)}` : '—'} />
          <MetricBox label="Total Cost" value={`$${listing.totalCost?.toFixed(2) ?? '—'}`} highlight />
          <MetricBox label="Condition" value={listing.condition ?? '—'} />
        </div>

        {/* Type + time */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="om-pill text-[10px] font-semibold"
            style={{
              background: listing.listingType === 'auction' ? 'rgba(255,149,0,0.12)' : 'rgba(46,229,157,0.12)',
              color: listing.listingType === 'auction' ? 'var(--om-warning)' : 'var(--om-success)',
              borderColor: 'transparent',
            }}
          >
            {listing.listingType === 'auction' ? 'Auction' : 'Buy It Now'}
          </span>
          {listing.timeLeftLabel && (
            <span className="om-pill text-[10px] flex items-center gap-1" style={{ color: 'var(--om-warning)', borderColor: 'transparent', background: 'rgba(255,204,102,0.1)' }}>
              <Clock className="h-3 w-3" />{listing.timeLeftLabel}
            </span>
          )}
          <span
            className="om-pill text-[10px] font-semibold"
            style={{ background: 'transparent', borderColor: 'transparent', color: STRENGTH_COLORS[listing.opportunityStrength] }}
          >
            Score: {listing.opportunityScore} ({listing.opportunityStrength})
          </span>
        </div>

        {/* Active comparison */}
        {listing.clusterCount >= 2 && (
          <div className="rounded-lg p-2.5" style={{ background: 'var(--om-bg-2)', border: '1px solid var(--om-border-0)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--om-text-3)' }}>
              Active Listing Comparison
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>Min</p>
                <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--om-text-0)' }}>${listing.clusterMin?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>Median</p>
                <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--om-text-0)' }}>${listing.clusterMedian?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>Max</p>
                <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--om-text-0)' }}>${listing.clusterMax?.toFixed(2)}</p>
              </div>
            </div>
            {listing.activeDiscountPercent !== null && (
              <p className="text-[11px] font-semibold text-center mt-2" style={{ color: listing.activeDiscountPercent > 0 ? 'var(--om-success)' : 'var(--om-danger)' }}>
                {listing.activeDiscountPercent > 0 ? `${listing.activeDiscountPercent}% below` : `${Math.abs(listing.activeDiscountPercent)}% above`} active median
              </p>
            )}
            <p className="text-[9px] text-center mt-1" style={{ color: 'var(--om-text-3)' }}>
              {listing.clusterCount} similar active listings · {listing.clusterConfidence} confidence
            </p>
          </div>
        )}

        {listing.sellerName && (
          <div className="text-[11px]" style={{ color: 'var(--om-text-2)' }}>
            Seller: <span style={{ color: 'var(--om-text-1)' }}>{listing.sellerName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {listing.ebayUrl && (
            <a
              href={listing.ebayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold om-btn"
              style={{ background: 'var(--om-accent)', color: '#fff' }}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open on eBay
            </a>
          )}
          <button
            onClick={() => toggleWatchlist(toEbayItem(listing))}
            className={cn('h-8 w-8 flex items-center justify-center rounded-lg om-btn', watched ? 'bg-[rgba(255,204,102,0.15)]' : '')}
            style={{ border: '1px solid var(--om-border-0)' }}
          >
            <Star className={cn('h-4 w-4', watched && 'fill-current')} style={{ color: watched ? 'var(--om-warning)' : 'var(--om-text-2)' }} />
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_COMPARISON', id: listing.id })}
            className="h-8 w-8 flex items-center justify-center rounded-lg om-btn"
            style={{ border: '1px solid var(--om-border-0)' }}
          >
            <GitCompare className="h-4 w-4" style={{ color: 'var(--om-text-2)' }} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MetricBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg px-2.5 py-1.5" style={{ background: 'var(--om-bg-2)' }}>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--om-text-3)' }}>{label}</p>
      <p className={cn('text-xs tabular-nums', highlight ? 'font-bold' : 'font-medium')} style={{ color: 'var(--om-text-0)' }}>{value}</p>
    </div>
  );
}
