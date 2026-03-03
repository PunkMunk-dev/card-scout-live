import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, X } from 'lucide-react';
import { useRoiCards } from '@/hooks/useRoiCards';
import { RoiCard } from '@/components/roi/RoiCard';
import { Skeleton } from '@/components/ui/skeleton';

const SPORTS = ['All', 'Basketball', 'Football', 'Baseball', 'Hockey', 'Soccer', 'Pokemon'] as const;

type SortKey = 'psa10_profit' | 'psa9_gain' | 'multiplier' | 'raw_avg';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'psa10_profit', label: 'PSA 10 Profit' },
  { key: 'psa9_gain', label: 'PSA 9 Gain' },
  { key: 'multiplier', label: 'Multiplier' },
  { key: 'raw_avg', label: 'Raw Price' },
];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="om-card p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function TopRoi() {
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('psa10_profit');
  const [searchQuery, setSearchQuery] = useState('');

  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: cards, isLoading, error } = useRoiCards(selectedSport);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedSport, searchQuery, sortKey]);

  const filteredAndSorted = useMemo(() => {
    if (!cards) return [];
    let result = cards;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.card_name.toLowerCase().includes(q));
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortKey] ?? -Infinity;
      const bVal = b[sortKey] ?? -Infinity;
      return (bVal as number) - (aVal as number);
    });

    return result;
  }, [cards, searchQuery, sortKey]);

  const visibleCards = useMemo(() => filteredAndSorted.slice(0, visibleCount), [filteredAndSorted, visibleCount]);
  const hasMore = visibleCount < filteredAndSorted.length;

  return (
    <div className="om-page-bg pb-24 md:pb-8">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--om-text-0)' }}>
            Top ROI Cards
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--om-text-2)' }}>
            PSA grading profit analysis across {cards?.length ?? '...'} cards
          </p>
        </div>

        {/* Sport filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SPORTS.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`om-pill ${selectedSport === sport ? 'om-pill-active' : ''}`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Search + sort toolbar */}
        <div className="om-toolbar flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--om-text-3)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="om-input w-full h-9 pl-9 pr-8 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4" style={{ color: 'var(--om-text-3)' }} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--om-text-3)' }} />
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`om-pill text-[10px] sm:text-[11px] ${sortKey === opt.key ? 'om-pill-active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-xs mb-3" style={{ color: 'var(--om-text-3)' }}>
            {hasMore ? `Showing ${visibleCards.length} of ` : ''}{filteredAndSorted.length} card{filteredAndSorted.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--om-danger)' }}>Failed to load cards</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--om-text-3)' }}>
              {searchQuery ? 'No cards match your search' : 'No cards found'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleCards.map((card) => (
                <RoiCard key={card.id} card={card} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="om-btn om-pill px-6 py-2 text-xs"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
