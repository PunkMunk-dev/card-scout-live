import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingGrid } from "@/components/ListingGrid";
import { LoadingGrid } from "@/components/LoadingGrid";
import { EmptyState } from "@/components/EmptyState";
import { ResultsHeader } from "@/components/ResultsHeader";
import { SearchFilters } from "@/components/SearchFilters";
import { RecentSearches } from "@/components/RecentSearches";
import { QuickPresets } from "@/components/QuickPresets";
import { TcgModule } from "@/components/modules/TcgModule";
import { SportsModule } from "@/components/modules/SportsModule";
import { searchEbay } from "@/lib/ebay-api";
import { useSharedWatchlist } from "@/contexts/WatchlistContext";
import type { EbayItem, SortOption } from "@/types/ebay";

function deriveBuyingOptions(sort: SortOption): 'ALL' | 'AUCTION' | 'FIXED_PRICE' {
  if (sort === 'auction_only') return 'AUCTION';
  if (sort === 'buy_now_only') return 'FIXED_PRICE';
  return 'ALL';
}

const RECENT_SEARCHES_KEY = "omni_recent_searches_v1";

function pushRecentSearch(term: string) {
  const t = (term || "").trim();
  if (!t) return;
  try {
    const existing = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]") as string[];
    const next = [t, ...existing.filter((x) => x !== t)].slice(0, 12);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {}
}

export default function Index() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [items, setItems] = useState<EbayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!urlQuery);
  const [sort, setSort] = useState<SortOption>("best");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastSearchedRef = useRef<string>('');

  useEffect(() => {
    if (urlQuery && urlQuery !== lastSearchedRef.current) {
      lastSearchedRef.current = urlQuery;
      setQuery(urlQuery);
      setError(null);
      performSearch(urlQuery, 1, false);
    }
    if (!urlQuery && lastSearchedRef.current) {
      lastSearchedRef.current = '';
      setHasSearched(false);
      setItems([]);
      setTotal(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  const { isInWatchlist, toggleWatchlist } = useSharedWatchlist();

  const performSearch = useCallback(async (
    searchQuery: string, page: number = 1, append: boolean = false, overrideSort?: SortOption
  ) => {
    if (!searchQuery.trim()) return;
    pushRecentSearch(searchQuery);
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    if (page === 1) { setIsLoading(true); setError(null); } else { setIsLoadingMore(true); }
    const activeSort = overrideSort ?? sort;
    try {
      const response = await searchEbay({ query: searchQuery, page, limit: 48, sort: activeSort, buyingOptions: deriveBuyingOptions(activeSort) });
      if (ac.signal.aborted) return;
      if (append) {
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.itemId));
          return [...prev, ...response.items.filter(item => !existingIds.has(item.itemId))];
        });
      } else { setItems(response.items); }
      setTotal(response.total);
      setNextPage(response.items.length > 0 ? response.nextPage : null);
      setHasSearched(true);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Failed to search eBay';
      console.error('Search error:', err);
      setError(msg);
      if (!append) { setItems([]); setNextPage(null); }
      toast.error(msg);
    } finally {
      if (!ac.signal.aborted) { setIsLoading(false); setIsLoadingMore(false); }
    }
  }, [sort]);

  const handleLoadMore = () => { if (nextPage && query && !isLoadingMore) performSearch(query, nextPage, true); };
  const handleSortChange = (newSort: SortOption) => { setSort(newSort); if (query && hasSearched) performSearch(query, 1, false, newSort); };
  const handleRetry = () => { if (query) performSearch(query, 1, false); };

  // When global search is active, show eBay results + pass query to modules
  if (hasSearched && urlQuery) {
    return (
      <div className="min-h-[calc(100vh-48px)] pb-16 sm:pb-0" style={{ background: 'var(--om-bg-0)' }}>
        {/* eBay results toolbar */}
        <div style={{ borderBottom: '1px solid var(--om-border-0)', background: 'var(--om-bg-1)' }}>
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center gap-4 h-10">
            <SearchFilters sort={sort} onSortChange={handleSortChange} />
            <ResultsHeader query={query} total={total} showing={items.length} hasMore={!!nextPage} isLoadingMore={isLoadingMore} onLoadMore={handleLoadMore} />
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
          {isLoading && items.length === 0 ? (
            <LoadingGrid />
          ) : error && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--om-danger)' }}>{error}</p>
              <button onClick={handleRetry} className="text-sm font-medium hover:underline" style={{ color: 'var(--om-accent)' }}>Retry</button>
            </div>
          ) : items.length > 0 ? (
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg" style={{ background: 'rgba(var(--om-bg-0), 0.4)', backdropFilter: 'blur(1px)' }}>
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--om-text-3)' }} />
                </div>
              )}
              <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
                <ListingGrid items={items} isInWatchlist={isInWatchlist} onToggleWatchlist={toggleWatchlist} />
                {nextPage && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoadingMore}>
                      {isLoadingMore ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading…</> : 'Load more'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState query={query} />
          )}
        </div>
      </div>
    );
  }

  // Dashboard view — default state
  return (
    <div className="min-h-[calc(100vh-48px)] pb-16 sm:pb-0" style={{ background: 'var(--om-bg-0)' }}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 space-y-3">
        {/* Recent searches + quick presets */}
        <div className="space-y-2">
          <RecentSearches onSelect={(term) => {
            const params = new URLSearchParams();
            params.set('q', term);
            window.location.search = params.toString();
          }} />
          <QuickPresets onSelect={(query) => {
            const params = new URLSearchParams();
            params.set('q', query);
            window.location.search = params.toString();
          }} />
        </div>

        {/* Stacked market modules */}
        <TcgModule globalQuery={urlQuery || undefined} />
        <SportsModule globalQuery={urlQuery || undefined} />
      </div>
    </div>
  );
}
