import { useMemo } from 'react';
import { Loader2, ExternalLink, Eye, GitCompare, Star, Clock, ArrowDown, Minus } from 'lucide-react';
import { useScanner } from '@/hooks/useScannerState';
import { useSharedWatchlist } from '@/contexts/WatchlistContext';
import { cn } from '@/lib/utils';
import type { NormalizedListing, OpportunityStrength } from '@/types/scanner';
import type { EbayItem } from '@/types/ebay';

const STRENGTH_STYLES: Record<OpportunityStrength, { bg: string; text: string; label: string }> = {
  strong: { bg: 'rgba(46,229,157,0.12)', text: 'var(--om-success)', label: 'Strong' },
  good: { bg: 'rgba(0,185,255,0.12)', text: 'var(--om-accent)', label: 'Good' },
  watch: { bg: 'rgba(255,204,102,0.12)', text: 'var(--om-warning)', label: 'Watch' },
  weak: { bg: 'var(--om-bg-3)', text: 'var(--om-text-3)', label: 'Weak' },
};

function toEbayItem(l: NormalizedListing): EbayItem {
  return {
    itemId: l.id,
    title: l.title,
    price: { value: String(l.price ?? 0), currency: 'USD' },
    shipping: l.shipping !== null ? { value: String(l.shipping), currency: 'USD' } : undefined,
    condition: l.condition ?? 'Unknown',
    buyingOption: l.listingType === 'auction' ? 'AUCTION' : 'FIXED_PRICE',
    endDate: l.endTime ?? undefined,
    imageUrl: l.imageUrl ?? undefined,
    itemUrl: l.ebayUrl ?? undefined,
    seller: l.sellerName ?? undefined,
  };
}

export function OpportunityResultsFeed() {
  const { state, dispatch, loadMore, activeModeState } = useScanner();
  const { results, isLoading, hasMore, error } = activeModeState;
  const { isInWatchlist, toggleWatchlist } = useSharedWatchlist();

  const visibleResults = useMemo(() => results.filter(r => !r.isLikelyJunk), [results]);

  if (isLoading && results.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--om-accent)' }} />
        <span className="ml-2 text-xs" style={{ color: 'var(--om-text-2)' }}>Scanning eBay…</span>
      </div>
    );
  }

  if (error && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm mb-2" style={{ color: 'var(--om-danger)' }}>{error}</p>
        <button onClick={() => state.query && dispatch({ type: 'SEARCH_START' })} className="text-xs underline" style={{ color: 'var(--om-accent)' }}>Retry</button>
      </div>
    );
  }

  if (visibleResults.length === 0 && !isLoading) return null;

  return (
    <div className="flex-1 min-w-0 overflow-auto">
      {/* Stats strip */}
      <div
        className="flex items-center gap-3 px-3 py-1.5 text-[11px] sticky top-0 z-10"
        style={{ background: 'var(--om-bg-1)', borderBottom: '1px solid var(--om-border-0)', color: 'var(--om-text-3)' }}
      >
        <span className="font-medium tabular-nums" style={{ color: 'var(--om-text-1)' }}>{visibleResults.length} results</span>
        {results.length !== visibleResults.length && (
          <span>{results.length - visibleResults.length} filtered</span>
        )}
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-[11px]" style={{ color: 'var(--om-text-1)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--om-border-0)', color: 'var(--om-text-3)' }}>
              <th className="text-left font-medium px-2 py-1.5 w-16"></th>
              <th className="text-left font-medium px-2 py-1.5">Title</th>
              <th className="text-left font-medium px-2 py-1.5 w-16">Type</th>
              <th className="text-right font-medium px-2 py-1.5 w-16">Price</th>
              <th className="text-right font-medium px-2 py-1.5 w-16">Ship</th>
              <th className="text-right font-medium px-2 py-1.5 w-16">Total</th>
              <th className="text-center font-medium px-2 py-1.5 w-16">Time</th>
              <th className="text-center font-medium px-2 py-1.5 w-20">vs Median</th>
              <th className="text-center font-medium px-2 py-1.5 w-16">Score</th>
              <th className="text-center font-medium px-2 py-1.5 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleResults.map(listing => (
              <ResultRow
                key={listing.id}
                listing={listing}
                isWatched={isInWatchlist(listing.id)}
                onToggleWatch={() => toggleWatchlist(toEbayItem(listing))}
                onSelect={() => dispatch({ type: 'SELECT_LISTING', id: listing.id })}
                onCompare={() => dispatch({ type: 'SET_COMPARISON', id: listing.id })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-1 p-2">
        {visibleResults.map(listing => (
          <MobileCard
            key={listing.id}
            listing={listing}
            isWatched={isInWatchlist(listing.id)}
            onToggleWatch={() => toggleWatchlist(toEbayItem(listing))}
            onSelect={() => dispatch({ type: 'SELECT_LISTING', id: listing.id })}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="om-pill om-btn px-4 py-1.5"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

function ResultRow({
  listing, isWatched, onToggleWatch, onSelect, onCompare,
}: {
  listing: NormalizedListing; isWatched: boolean; onToggleWatch: () => void; onSelect: () => void; onCompare: () => void;
}) {
  const style = STRENGTH_STYLES[listing.opportunityStrength];
  const discountDisplay = listing.activeDiscountPercent !== null
    ? `${listing.activeDiscountPercent > 0 ? '-' : '+'}${Math.abs(listing.activeDiscountPercent)}%`
    : '—';

  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-[var(--om-bg-2)]"
      style={{ borderBottom: '1px solid var(--om-border-0)' }}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <td className="px-2 py-1.5">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt="" className="w-14 h-14 rounded object-cover" style={{ background: 'var(--om-bg-3)' }} />
        ) : (
          <div className="w-14 h-14 rounded" style={{ background: 'var(--om-bg-3)' }} />
        )}
      </td>

      {/* Title */}
      <td className="px-2 py-1.5 max-w-xs">
        <p className="truncate font-medium text-[11px]" style={{ color: 'var(--om-text-0)' }} title={listing.title}>
          {listing.normalizedLabel}
        </p>
        <p className="truncate text-[10px]" style={{ color: 'var(--om-text-3)' }}>
          {listing.condition} {listing.sellerName ? `· ${listing.sellerName}` : ''}
        </p>
      </td>

      {/* Type */}
      <td className="px-2 py-1.5">
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
          style={{
            background: listing.listingType === 'auction' ? 'rgba(255,149,0,0.12)' : 'rgba(46,229,157,0.12)',
            color: listing.listingType === 'auction' ? 'var(--om-warning)' : 'var(--om-success)',
          }}
        >
          {listing.listingType === 'auction' ? 'Auction' : 'BIN'}
        </span>
      </td>

      {/* Price */}
      <td className="px-2 py-1.5 text-right tabular-nums font-medium" style={{ color: 'var(--om-text-0)' }}>
        ${listing.price?.toFixed(2) ?? '—'}
      </td>

      {/* Shipping */}
      <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: 'var(--om-text-3)' }}>
        {listing.shipping === 0 ? 'Free' : listing.shipping !== null ? `$${listing.shipping.toFixed(2)}` : '—'}
      </td>

      {/* Total */}
      <td className="px-2 py-1.5 text-right tabular-nums font-semibold" style={{ color: 'var(--om-text-0)' }}>
        ${listing.totalCost?.toFixed(2) ?? '—'}
      </td>

      {/* Time */}
      <td className="px-2 py-1.5 text-center">
        {listing.timeLeftLabel ? (
          <span className="flex items-center justify-center gap-0.5 text-[10px]" style={{ color: 'var(--om-warning)' }}>
            <Clock className="h-3 w-3" />
            {listing.timeLeftLabel}
          </span>
        ) : (
          <span style={{ color: 'var(--om-text-3)' }}>—</span>
        )}
      </td>

      {/* Discount */}
      <td className="px-2 py-1.5 text-center">
        {listing.activeDiscountPercent !== null ? (
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{
              background: listing.activeDiscountPercent > 0 ? 'rgba(46,229,157,0.12)' : listing.activeDiscountPercent < -5 ? 'rgba(255,92,122,0.12)' : 'var(--om-bg-3)',
              color: listing.activeDiscountPercent > 0 ? 'var(--om-success)' : listing.activeDiscountPercent < -5 ? 'var(--om-danger)' : 'var(--om-text-3)',
            }}
          >
            {listing.activeDiscountPercent > 0 && <ArrowDown className="h-3 w-3" />}
            {discountDisplay}
          </span>
        ) : (
          <Minus className="h-3 w-3 mx-auto" style={{ color: 'var(--om-text-3)' }} />
        )}
      </td>

      {/* Score badge */}
      <td className="px-2 py-1.5 text-center">
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
          style={{ background: style.bg, color: style.text }}
        >
          {style.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-2 py-1.5">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onCompare(); }} className="p-1 rounded hover:bg-[var(--om-bg-3)]" title="Compare">
            <GitCompare className="h-3.5 w-3.5" style={{ color: 'var(--om-text-2)' }} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggleWatch(); }} className="p-1 rounded hover:bg-[var(--om-bg-3)]" title="Watch">
            <Star className={cn('h-3.5 w-3.5', isWatched && 'fill-current')} style={{ color: isWatched ? 'var(--om-warning)' : 'var(--om-text-2)' }} />
          </button>
          {listing.ebayUrl && (
            <a href={listing.ebayUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1 rounded hover:bg-[var(--om-bg-3)]" title="Open on eBay">
              <ExternalLink className="h-3.5 w-3.5" style={{ color: 'var(--om-text-2)' }} />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

function MobileCard({
  listing, isWatched, onToggleWatch, onSelect,
}: {
  listing: NormalizedListing; isWatched: boolean; onToggleWatch: () => void; onSelect: () => void;
}) {
  const style = STRENGTH_STYLES[listing.opportunityStrength];

  return (
    <div
      onClick={onSelect}
      className="flex gap-2.5 p-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--om-bg-2)]"
      style={{ border: '1px solid var(--om-border-0)' }}
    >
      {listing.imageUrl ? (
        <img src={listing.imageUrl} alt="" className="w-14 h-14 rounded object-cover shrink-0" style={{ background: 'var(--om-bg-3)' }} />
      ) : (
        <div className="w-14 h-14 rounded shrink-0" style={{ background: 'var(--om-bg-3)' }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--om-text-0)' }}>{listing.normalizedLabel}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--om-text-0)' }}>
            ${listing.totalCost?.toFixed(2) ?? '—'}
          </span>
          <span
            className="px-1 py-0.5 rounded text-[9px] font-semibold"
            style={{
              background: listing.listingType === 'auction' ? 'rgba(255,149,0,0.12)' : 'rgba(46,229,157,0.12)',
              color: listing.listingType === 'auction' ? 'var(--om-warning)' : 'var(--om-success)',
            }}
          >
            {listing.listingType === 'auction' ? 'Auction' : 'BIN'}
          </span>
          <span className="px-1 py-0.5 rounded text-[9px] font-semibold" style={{ background: style.bg, color: style.text }}>
            {style.label}
          </span>
          {listing.activeDiscountPercent !== null && listing.activeDiscountPercent > 0 && (
            <span className="text-[10px] font-semibold" style={{ color: 'var(--om-success)' }}>
              -{listing.activeDiscountPercent}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {listing.timeLeftLabel && (
            <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--om-warning)' }}>
              <Clock className="h-2.5 w-2.5" />{listing.timeLeftLabel}
            </span>
          )}
          <span className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>{listing.condition}</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onToggleWatch(); }} className="p-1.5">
          <Star className={cn('h-4 w-4', isWatched && 'fill-current')} style={{ color: isWatched ? 'var(--om-warning)' : 'var(--om-text-3)' }} />
        </button>
        {listing.ebayUrl && (
          <a href={listing.ebayUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5">
            <ExternalLink className="h-3.5 w-3.5" style={{ color: 'var(--om-text-3)' }} />
          </a>
        )}
      </div>
    </div>
  );
}
