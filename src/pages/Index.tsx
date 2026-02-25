import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/components/SearchFilters";
import { ListingGrid } from "@/components/ListingGrid";
import { LoadingGrid } from "@/components/LoadingGrid";
import { EmptyState } from "@/components/EmptyState";
import { ResultsHeader } from "@/components/ResultsHeader";
import { WatchlistDropdown } from "@/components/WatchlistDropdown";
import { searchEbay } from "@/lib/ebay-api";
import { useSharedWatchlist } from "@/contexts/WatchlistContext";
import type { EbayItem, SortOption } from "@/types/ebay";

function deriveBuyingOptions(sort: SortOption): 'ALL' | 'AUCTION' | 'FIXED_PRICE' {
  if (sort === 'auction_only') return 'AUCTION';
  if (sort === 'buy_now_only') return 'FIXED_PRICE';
  return 'ALL';
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [externalQuery, setExternalQuery] = useState<string | undefined>(undefined);
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

  // Search when URL query changes (handles both mount and header-nav)
  useEffect(() => {
    if (urlQuery && urlQuery !== lastSearchedRef.current) {
      lastSearchedRef.current = urlQuery;
      setQuery(urlQuery);
      setExternalQuery(urlQuery);
      setItems([]);
      setError(null);
      performSearch(urlQuery, 1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  const { watchlist, isInWatchlist, toggleWatchlist } = useSharedWatchlist();

  const performSearch = useCallback(async (
    searchQuery: string, 
    page: number = 1, 
    append: boolean = false,
    overrideSort?: SortOption
  ) => {
    if (!searchQuery.trim()) return;

    // Abort previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    if (page === 1) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    const activeSort = overrideSort ?? sort;

    try {
      const response = await searchEbay({
        query: searchQuery,
        page,
        limit: 24,
        sort: activeSort,
        buyingOptions: deriveBuyingOptions(activeSort),
      });

      if (ac.signal.aborted) return;

      if (append) {
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.itemId));
          const newItems = response.items.filter(item => !existingIds.has(item.itemId));
          return [...prev, ...newItems];
        });
      } else {
        setItems(response.items);
      }
      
      // Only show total from items we actually have, not eBay's pre-filter total
      setTotal(response.total);
      setNextPage(response.items.length > 0 ? response.nextPage : null);
      setHasSearched(true);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Failed to search eBay';
      console.error('Search error:', err);
      setError(msg);
      if (!append) {
        setItems([]);
        setNextPage(null);
      }
      toast.error(msg);
    } finally {
      if (!ac.signal.aborted) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [sort]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setSearchParams(newQuery ? { q: newQuery } : {}, { replace: true });
    setItems([]);
    setError(null);
    performSearch(newQuery, 1, false);
  };

  const handleSearchFromWatchlist = (title: string) => {
    setExternalQuery(title);
    setQuery(title);
    setSearchParams(title ? { q: title } : {}, { replace: true });
    setItems([]);
    setError(null);
    performSearch(title, 1, false);
  };

  const handleClear = () => {
    setQuery("");
    setExternalQuery(undefined);
    setSearchParams({}, { replace: true });
    setItems([]);
    setTotal(0);
    setNextPage(null);
    setHasSearched(false);
    setError(null);
    if (abortRef.current) abortRef.current.abort();
  };

  const handleLoadMore = () => {
    if (nextPage && query && !isLoadingMore) {
      performSearch(query, nextPage, true);
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    if (query && hasSearched) {
      setItems([]);
      setError(null);
      performSearch(query, 1, false, newSort);
    }
  };

  const handleRetry = () => {
    if (query) {
      setError(null);
      performSearch(query, 1, false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-background pb-16 sm:pb-0">
      {/* Search Section */}
      <section className="bg-card border-b border-border">
        <div className="container py-6 flex items-center gap-2">
          <SearchBar 
            onSearch={handleSearch} 
            onClear={handleClear}
            isLoading={isLoading} 
            showClear={hasSearched}
            externalQuery={externalQuery}
          />
          <WatchlistDropdown onSearchItem={handleSearchFromWatchlist} />
        </div>
      </section>

      {/* Toolbar: sort + watchlist + results count */}
      {hasSearched && (
        <div className="border-b border-border bg-card/50">
          <div className="container flex items-center gap-4 h-11">
            <SearchFilters sort={sort} onSortChange={handleSortChange} />
            <ResultsHeader 
              query={query} 
              total={total} 
              showing={items.length}
              hasMore={!!nextPage}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container py-6">
        {isLoading ? (
          <LoadingGrid />
        ) : error && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-lg border shadow-sm bg-card px-10 py-12 max-w-md">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <button onClick={handleRetry} className="text-sm font-medium text-primary hover:underline">
                Retry Search
              </button>
            </div>
          </div>
        ) : hasSearched && items.length > 0 ? (
          <>
            <ListingGrid 
              items={items}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={toggleWatchlist}
            />
            {nextPage && (
              <div className="flex justify-center pt-6">
                <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading…</>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : hasSearched ? (
          <EmptyState query={query} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
