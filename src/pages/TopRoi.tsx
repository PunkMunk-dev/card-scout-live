import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CaptureSnapshotButton } from '@/components/ui-audit/CaptureSnapshotButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { Search, X } from 'lucide-react';
import { UnifiedEmptyState } from '@/components/shared/UnifiedEmptyState';
import { UnifiedErrorState } from '@/components/shared/UnifiedErrorState';
import { useRoiCards, usePrefetchRoiEbayListings } from '@/hooks/useRoiCards';
import { RoiCard } from '@/components/roi/RoiCard';
import { LiveRoiAuctions } from '@/components/roi/LiveRoiAuctions';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getSession, setSession } from '@/lib/sessionStore';

type SortOption = { key: string; field: 'psa10_profit' | 'raw_avg' | 'multiplier'; dir: 'asc' | 'desc'; label: string };
const SORT_OPTIONS: SortOption[] = [
  { key: 'profit-desc', field: 'psa10_profit', dir: 'desc', label: 'Profit ↑' },
  { key: 'profit-asc', field: 'psa10_profit', dir: 'asc', label: 'Profit ↓' },
  { key: 'raw-asc', field: 'raw_avg', dir: 'asc', label: 'Raw ↓' },
  { key: 'raw-desc', field: 'raw_avg', dir: 'desc', label: 'Raw ↑' },
  { key: 'multiplier-desc', field: 'multiplier', dir: 'desc', label: 'Multiplier' },
];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
  const sessionSortKey = getSession().roiSortKey;
  const sessionTabKey = getSession().roiTabKey || 'top';
  const [sortKey, setSortKey] = useState(sessionSortKey || 'profit-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(sessionTabKey);
  const gridRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: cards, isLoading, error } = useRoiCards('All');
  usePrefetchRoiEbayListings(cards, 10);

  const handleSortChange = (key: string) => {
    setSortKey(key);
    setSession({ roiSortKey: key });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSession({ roiTabKey: tab });
  };

  const activeSort = SORT_OPTIONS.find(o => o.key === sortKey) ?? SORT_OPTIONS[0];

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, sortKey]);

  const filteredAndSorted = useMemo(() => {
    if (!cards) return [];
    let result = cards;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.card_name.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      const aVal = a[activeSort.field] ?? -Infinity;
      const bVal = b[activeSort.field] ?? -Infinity;
      return activeSort.dir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [cards, searchQuery, sortKey]);

  const visibleCards = useMemo(() => filteredAndSorted.slice(0, visibleCount), [filteredAndSorted, visibleCount]);
  const hasMore = visibleCount < filteredAndSorted.length;

  const getRoiSnapshotState = useCallback(() => ({
    searchInputs: { searchQuery },
    filters: { sortKey, activeTab },
    pagination: { visibleCount, total: filteredAndSorted.length },
    loadingFlags: { isLoading },
    errorState: error ? { message: String(error) } : null,
    resultsSchema: { itemKeys: cards?.[0] ? Object.keys(cards[0]) : [], count: filteredAndSorted.length },
    layoutMode: {},
  }), [searchQuery, sortKey, activeTab, visibleCount, filteredAndSorted.length, isLoading, error, cards]);

  return (
    <div className="om-page-bg pb-24 md:pb-8 relative">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8 pt-6 md:pt-8">
        <PageHeader
          title="Top ROI Cards"
          subtitle={`PSA grading profit analysis across ${cards?.length ?? '...'} cards`}
          rightSlot={<CaptureSnapshotButton appId="roi" getState={getRoiSnapshotState} />}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4 h-9" style={{ background: 'var(--om-bg-2)', borderRadius: '0.75rem' }}>
            <TabsTrigger value="top" className="text-xs font-medium rounded-lg px-4">Top ROI</TabsTrigger>
            <TabsTrigger value="live" className="text-xs font-medium rounded-lg px-4">Live Auctions</TabsTrigger>
          </TabsList>

          <TabsContent value="top">
            {/* Search + sort toolbar */}
            <div className="om-toolbar flex items-center gap-3 px-3 h-10 mb-4 overflow-x-auto">
              <div className="relative shrink-0" style={{ maxWidth: '200px', width: '100%' }}>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--om-text-3)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="om-input w-full h-7 pl-8 pr-7 text-xs font-mono"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
                  </button>
                )}
              </div>
              <div className="border-l h-5 shrink-0" style={{ borderColor: 'var(--om-border)' }} />
              <div className="flex items-center gap-1 shrink-0">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => handleSortChange(opt.key)}
                    className={`om-pill font-mono text-[10px] px-2 py-0.5 whitespace-nowrap ${sortKey === opt.key ? 'om-pill-active' : ''}`}
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
            <div ref={gridRef}>
              {isLoading ? (
                <SkeletonGrid />
              ) : error ? (
                <UnifiedErrorState message="Failed to load cards" />
              ) : filteredAndSorted.length === 0 ? (
                <UnifiedEmptyState
                  variant="no-results"
                  title={searchQuery ? 'No cards match' : 'No cards found'}
                  message={searchQuery ? `No cards matching "${searchQuery}"` : 'No ROI data available.'}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
          </TabsContent>

          <TabsContent value="live">
            <LiveRoiAuctions cards={cards} isLoadingRoi={isLoading} roiError={error} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
