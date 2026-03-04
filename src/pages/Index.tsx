import { useState, useCallback, useEffect, useRef } from "react";
import { CaptureSnapshotButton } from '@/components/ui-audit/CaptureSnapshotButton';
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Star, X, Zap, Search, ArrowRight } from "lucide-react";
import psaMosaic from "@/assets/psa-mosaic.jpg";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/components/SearchFilters";
import { ListingGrid } from "@/components/ListingGrid";
import { LoadingGrid } from "@/components/LoadingGrid";
import { UnifiedEmptyState } from "@/components/shared/UnifiedEmptyState";
import { UnifiedErrorState } from "@/components/shared/UnifiedErrorState";
import { ResultsHeader } from "@/components/ResultsHeader";
import { searchEbay } from "@/lib/ebay-api";
import { useSharedWatchlist } from "@/contexts/WatchlistContext";
import type { EbayItem, SortOption } from "@/types/ebay";

function deriveBuyingOptions(sort: SortOption): 'ALL' | 'AUCTION' | 'FIXED_PRICE' {
  if (sort === 'auction_only') return 'AUCTION';
  if (sort === 'buy_now_only') return 'FIXED_PRICE';
  return 'ALL';
}

/* ── Recent-searches helpers ── */
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
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const urlSrc = searchParams.get('src') || '';
  const [query, setQuery] = useState(urlQuery);
  const [items, setItems] = useState<EbayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!urlQuery);
  const [sort, setSort] = useState<SortOption>("best");
  const [error, setError] = useState<string | null>(null);
  const [fromWatchlist, setFromWatchlist] = useState(urlSrc === 'wl');
  const abortRef = useRef<AbortController | null>(null);
  const lastSearchedRef = useRef<string>('');

  // Search when URL query changes (handles both mount and header-nav)
  useEffect(() => {
    if (urlQuery && urlQuery !== lastSearchedRef.current) {
      lastSearchedRef.current = urlQuery;
      setQuery(urlQuery);
      setError(null);
      setFromWatchlist(urlSrc === 'wl');
      performSearch(urlQuery, 1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, urlSrc]);

  const { watchlist, isInWatchlist, toggleWatchlist } = useSharedWatchlist();

  const performSearch = useCallback(async (
    searchQuery: string, 
    page: number = 1, 
    append: boolean = false,
    overrideSort?: SortOption
  ) => {
    if (!searchQuery.trim()) return;

    pushRecentSearch(searchQuery);

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
        limit: 48,
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

  const handleLoadMore = () => {
    if (nextPage && query && !isLoadingMore) {
      performSearch(query, nextPage, true);
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    if (query && hasSearched) {
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

  const heroInputRef = useRef<HTMLInputElement>(null);
  const [heroQuery, setHeroQuery] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    if (!q) return;
    setSearchParams({ q });
  };

  const getSearchSnapshotState = useCallback(() => ({
    searchInputs: { query },
    filters: { sort },
    pagination: { nextPage, total },
    loadingFlags: { isLoading, isLoadingMore },
    errorState: error ? { message: error } : null,
    resultsSchema: { itemKeys: items[0] ? Object.keys(items[0]) : [], count: items.length },
    layoutMode: { hasSearched, fromWatchlist },
  }), [query, sort, nextPage, total, isLoading, isLoadingMore, error, items, hasSearched, fromWatchlist]);

  return (
    <div className="min-h-[calc(100vh-48px)] bg-background pb-16 sm:pb-0 relative">
      <div className="absolute top-3 right-4 z-20">
        <CaptureSnapshotButton appId="search" getState={getSearchSnapshotState} />
      </div>
      {/* Toolbar: sort + results count */}
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
          {fromWatchlist && (
            <div className="container flex items-center gap-2 pb-2">
              <div className="inline-flex items-center gap-1.5 bg-secondary/60 text-secondary-foreground px-3 py-1 rounded-full text-xs">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span>Showing results for "<strong>{query}</strong>" (from starred card)</span>
                <button
                  onClick={() => setFromWatchlist(false)}
                  className="ml-1 rounded-full p-0.5 hover:bg-secondary transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {hasSearched ? (
        <main className="container py-6">
          {isLoading && items.length === 0 ? (
            <LoadingGrid />
          ) : error && items.length === 0 ? (
            <UnifiedErrorState message={error} onRetry={handleRetry} />
          ) : items.length > 0 ? (
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className={isLoading ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
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
              </div>
            </div>
          ) : (
            <UnifiedEmptyState variant="no-results" title="No results found" message={query ? `No listings found for "${query}". Try adjusting your search.` : 'Enter a card name to start searching.'} />
          )}
        </main>
      ) : (
        <section
          className="relative w-full min-h-[calc(100vh-48px)] flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(180deg, var(--om-bg-0) 0%, var(--om-bg-1) 50%, var(--om-bg-0) 100%)', color: 'var(--om-text-0)' }}
        >
          <div className="omni-hero-spotlight" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div
            className="pointer-events-none absolute inset-0 scale-110 blur-[28px] opacity-[0.07]"
            style={{
              backgroundImage: `url(${psaMosaic})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
            }}
          />
          <div className="pointer-events-none absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-[160px]" style={{ background: 'rgba(10,132,255,0.10)' }} />
          <div className="pointer-events-none absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-[160px]" style={{ background: 'rgba(10,132,255,0.08)' }} />

          <div className="relative z-10 mx-auto w-full max-w-3xl px-6 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-8" style={{ borderColor: 'rgba(10,132,255,0.3)', background: 'rgba(10,132,255,0.08)', color: 'var(--om-accent)' }}>
              <Zap className="h-3.5 w-3.5" />
              Universal Card Intelligence
            </div>

            <h1 className="text-[clamp(3rem,8vw,6rem)] font-bold tracking-[-0.04em] leading-none mb-4">
              <span style={{ color: 'var(--om-text-0)' }}>Omni</span>
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Market</span>
            </h1>

            <p className="text-sm max-w-md mb-10" style={{ color: 'var(--om-text-2)' }}>
              Search live eBay listings instantly—find undervalued cards before the market moves.
            </p>

            <form onSubmit={handleHeroSearch} className="flex w-full max-w-xl items-center gap-2 rounded-2xl p-2" style={{ background: 'var(--om-bg-2)', border: '1px solid var(--om-border-0)', boxShadow: '0 20px 60px var(--glass-shadow)' }}>
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--om-text-2)' }} />
                <input
                  ref={heroInputRef}
                  type="text"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Search any card… Charizard, Jordan, Ohtani"
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                  style={{ color: 'var(--om-text-0)' }}
                />
              </div>
              <button
                type="submit"
                disabled={!heroQuery.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-px active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                style={{ background: 'var(--om-accent)', color: '#fff', boxShadow: '0 10px 30px rgba(10,132,255,0.20)' }}
              >
                Search <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
