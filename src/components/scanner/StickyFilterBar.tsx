import { RotateCcw } from 'lucide-react';
import { useScanner } from '@/hooks/useScannerState';
import { cn } from '@/lib/utils';
import { DEFAULT_FILTERS } from '@/types/scanner';
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
  { value: 'bestOpportunity', label: 'Best ROI' },
  { value: 'biggestActiveDiscount', label: 'Biggest Spread' },
  { value: 'priceDesc', label: 'Highest PSA 10 Premium' },
  { value: 'relevance', label: 'Most Liquid' },
  { value: 'priceAsc', label: 'Lowest Raw Price' },
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'newlyListed', label: 'Newest' },
];

export function StickyFilterBar() {
  const { state, dispatch, runSearch } = useScanner();
  const { filters, sortBy, query } = state;

  // Check if any filter/sort differs from defaults (ignoring marketMode)
  const activeCount = [
    filters.listingType !== DEFAULT_FILTERS.listingType,
    filters.endingSoonOnly,
    filters.rawOnly,
    filters.excludeGraded,
    filters.excludeLots,
    filters.minPrice != null,
    filters.maxPrice != null,
    sortBy !== 'bestOpportunity',
  ].filter(Boolean).length;

  const isDirty = activeCount > 0;

  const resetFilters = () => {
    const resetted = { ...DEFAULT_FILTERS, marketMode: filters.marketMode };
    dispatch({ type: 'UPDATE_FILTERS', filters: resetted });
    dispatch({ type: 'SET_SORT', sortBy: 'bestOpportunity' });
    if (query) runSearch(query, 1, resetted, 'bestOpportunity');
  };

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
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: 'var(--om-text-3)' }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              const s = e.target.value as ScannerSort;
              dispatch({ type: 'SET_SORT', sortBy: s });
              if (query) runSearch(query, 1, undefined, s);
            }}
            className="om-input h-7 text-[11px] px-2 pr-6 rounded-lg cursor-pointer"
            style={{ minWidth: 140 }}
          >
            {SORTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

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
        {/* Reset */}
        {isDirty && (
          <>
            <div className="w-px h-5 mx-1" style={{ background: 'var(--om-border-0)' }} />
            <button
              onClick={resetFilters}
              className="om-pill om-btn flex items-center gap-1 hover:text-[var(--om-accent)]"
              title="Reset filters"
            >
              <RotateCcw size={12} />
              <span className="text-[11px]">Reset</span>
              <span
                className="ml-0.5 inline-flex items-center justify-center rounded-full text-[9px] font-bold leading-none min-w-[16px] h-4 px-1"
                style={{ background: 'var(--om-accent)', color: '#fff' }}
              >
                {activeCount}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
