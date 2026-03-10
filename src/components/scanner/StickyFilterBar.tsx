import { useScanner } from '@/hooks/useScannerState';
import { cn } from '@/lib/utils';
import type { MarketMode, ListingType, ScannerSort } from '@/types/scanner';

const MARKET_MODES: { value: MarketMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'tcg', label: 'TCG' },
  { value: 'sports', label: 'Sports' },
];

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'auction', label: 'Auction' },
  { value: 'bin', label: 'BIN' },
];

const SORTS: { value: ScannerSort; label: string }[] = [
  { value: 'bestOpportunity', label: 'Best Opportunity' },
  { value: 'biggestActiveDiscount', label: 'Biggest Discount' },
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'priceAsc', label: 'Price ↑' },
  { value: 'priceDesc', label: 'Price ↓' },
  { value: 'relevance', label: 'Relevance' },
];

export function StickyFilterBar() {
  const { state, dispatch, runSearch } = useScanner();
  const { filters, sortBy, query } = state;

  const updateFilter = (partial: Record<string, any>) => {
    dispatch({ type: 'UPDATE_FILTERS', filters: partial });
    if (query) runSearch(query, 1, { ...filters, ...partial });
  };

  const toggleBool = (key: string) => {
    updateFilter({ [key]: !(filters as any)[key] });
  };

  return (
    <div
      className="sticky top-11 z-40 overflow-x-auto"
      style={{ background: 'var(--om-bg-1)', borderBottom: '1px solid var(--om-border-0)' }}
    >
      <div className="mx-auto max-w-[1600px] px-3 md:px-4 py-1.5 flex items-center gap-1.5 flex-nowrap min-w-max">
        {/* Market mode */}
        <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--om-border-0)' }}>
          {MARKET_MODES.map(m => (
            <button
              key={m.value}
              onClick={() => updateFilter({ marketMode: m.value })}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium transition-colors',
                filters.marketMode === m.value
                  ? 'om-pill-active'
                  : 'hover:bg-[var(--om-bg-2)]'
              )}
              style={filters.marketMode !== m.value ? { color: 'var(--om-text-2)' } : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--om-border-0)' }} />

        {/* Listing type */}
        {LISTING_TYPES.map(lt => (
          <button
            key={lt.value}
            onClick={() => updateFilter({ listingType: lt.value })}
            className={cn('om-pill om-btn', filters.listingType === lt.value && 'om-pill-active')}
          >
            {lt.label}
          </button>
        ))}

        <div className="w-px h-5 mx-1" style={{ background: 'var(--om-border-0)' }} />

        {/* Toggle filters */}
        <button
          onClick={() => toggleBool('endingSoonOnly')}
          className={cn('om-pill om-btn', filters.endingSoonOnly && 'om-pill-active')}
        >
          Ending Soon
        </button>
        <button
          onClick={() => toggleBool('rawOnly')}
          className={cn('om-pill om-btn', filters.rawOnly && 'om-pill-active')}
        >
          Raw Only
        </button>
        <button
          onClick={() => toggleBool('excludeGraded')}
          className={cn('om-pill om-btn', filters.excludeGraded && 'om-pill-active')}
        >
          No Graded
        </button>
        <button
          onClick={() => toggleBool('excludeLots')}
          className={cn('om-pill om-btn', filters.excludeLots && 'om-pill-active')}
        >
          No Lots
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--om-border-0)' }} />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => {
            const s = e.target.value as ScannerSort;
            dispatch({ type: 'SET_SORT', sortBy: s });
            if (query) runSearch(query, 1, undefined, s);
          }}
          className="om-input h-7 text-[11px] px-2 pr-6 rounded-lg cursor-pointer"
          style={{ minWidth: 130 }}
        >
          {SORTS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Price range */}
        <input
          type="number"
          placeholder="Min $"
          className="om-input h-7 w-16 text-[11px] px-2 rounded-lg"
          value={filters.minPrice ?? ''}
          onChange={(e) => updateFilter({ minPrice: e.target.value ? Number(e.target.value) : null })}
        />
        <span className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>–</span>
        <input
          type="number"
          placeholder="Max $"
          className="om-input h-7 w-16 text-[11px] px-2 rounded-lg"
          value={filters.maxPrice ?? ''}
          onChange={(e) => updateFilter({ maxPrice: e.target.value ? Number(e.target.value) : null })}
        />
      </div>
    </div>
  );
}
