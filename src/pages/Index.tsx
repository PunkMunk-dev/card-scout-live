import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { CaptureSnapshotButton } from '@/components/ui-audit/CaptureSnapshotButton';
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Star, X, Search, Layers, Trophy, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/components/SearchFilters";
import { ListingGrid } from "@/components/ListingGrid";
import { LoadingGrid } from "@/components/LoadingGrid";
import { UnifiedEmptyState } from "@/components/shared/UnifiedEmptyState";
import { UnifiedErrorState } from "@/components/shared/UnifiedErrorState";
import { ResultsHeader } from "@/components/ResultsHeader";
import { PageHeader } from "@/components/shared/PageHeader";
import { searchEbay } from "@/lib/ebay-api";
import { useSharedWatchlist } from "@/contexts/WatchlistContext";
import { getSession, setSession, pushRecentSearch } from "@/lib/sessionStore";
import type { EbayItem, SortOption } from "@/types/ebay";

function deriveBuyingOptions(sort: SortOption): 'ALL' | 'AUCTION' | 'FIXED_PRICE' {
  if (sort === 'auction_only' || sort === 'ending_soonest') return 'AUCTION';
  if (sort === 'buy_now_only') return 'FIXED_PRICE';
  return 'ALL';
}

/* ── Recent-searches helpers (localStorage backward compat) ── */
const RECENT_SEARCHES_KEY = "omni_recent_searches_v1";

function getRecentSearches(): string[] {
  // Merge sessionStore + localStorage for backward compat
  try {
    const session = getSession();
    const local = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]") as string[];
    const merged = [...session.recentSearches.map(s => s.term), ...local];
    return [...new Set(merged)].slice(0, 12);
  } catch {
    return [];
  }
}

const SUGGESTED_SEARCHES = [
  "Wembanyama Prizm Silver",
  "Charizard VMAX",
  "Shohei Ohtani Topps Chrome",
  "Luka Doncic Mosaic",
  "Pikachu VMAX Alt Art",
  "Patrick Mahomes Prizm",
  "Luffy Alt Art",
  "Jaylen Brown Rookie",
];

export default function Index() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlQuery = searchParams.get('q') || '';
  const urlSrc = searchParams.get('src') || '';

  // Restore sort from session
  const sessionSort = getSession().indexSortKey as SortOption;
  const [query, setQuery] = useState(urlQuery);
  const [items, setItems] = useState<EbayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasSearched = useMemo(() => !!urlQuery, [urlQuery]);
  const [sort, setSort] = useState<SortOption>(sessionSort || "best");
  const [error, setError] = useState<string | null>(null);
  const [fromWatchlist, setFromWatchlist] = useState(urlSrc === 'wl');
  const abortRef = useRef<AbortController | null>(null);
  const lastSearchedRef = useRef<string>('');


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

  const { isInWatchlist, toggleWatchlist } = useSharedWatchlist();

  const performSearch = useCallback(async (
    searchQuery: string,
    page: number = 1,
    append: boolean = false,
    overrideSort?: SortOption
  ) => {
    if (!searchQuery.trim()) return;
    // Persist to both localStorage and sessionStore
    try {
      const existing = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]") as string[];
      const next = [searchQuery.trim(), ...existing.filter((x) => x !== searchQuery.trim())].slice(0, 12);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {}
    pushRecentSearch(searchQuery, '/');

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
  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setSession({ indexSortKey: newSort });
    if (query && hasSearched) { setError(null); performSearch(query, 1, false, newSort); }
  };
  const handleRetry = () => { if (query) { setError(null); performSearch(query, 1, false); } };

  const getSearchSnapshotState = useCallback(() => ({
    searchInputs: { query },
    filters: { sort },
    pagination: { nextPage, total },
    loadingFlags: { isLoading, isLoadingMore },
    errorState: error ? { message: error } : null,
    resultsSchema: { itemKeys: items[0] ? Object.keys(items[0]) : [], count: items.length },
    layoutMode: { hasSearched, fromWatchlist },
  }), [query, sort, nextPage, total, isLoading, isLoadingMore, error, items, hasSearched, fromWatchlist]);

  const recentSearches = getRecentSearches();

  const quickStartCards = [
    { icon: Layers, title: "TCG Market", desc: "Pokémon & One Piece card explorer.", to: "/tcg" },
    { icon: Trophy, title: "Sports Market", desc: "Sports cards by player, brand & trait.", to: "/sports" },
    { icon: TrendingUp, title: "Top ROI Cards", desc: "See the best grading value plays.", to: "/roi" },
  ];

  // Merge recent + suggested into one list, recents first
  const searchIdeas = [
    ...recentSearches.slice(0, 6).map(t => ({ term: t, isRecent: true })),
    ...SUGGESTED_SEARCHES.filter(t => !recentSearches.includes(t)).map(t => ({ term: t, isRecent: false })),
  ];

  return (
    <div className="min-h-[calc(100vh-48px)] bg-background pb-16 sm:pb-0 relative">
      {/* Toolbar: sort + results count */}
      {hasSearched && (
        <div className="border-b border-border bg-card/50">
          <div className="container flex items-center gap-4 h-11">
            <SearchFilters sort={sort} onSortChange={handleSortChange} />
            <ResultsHeader query={query} total={total} showing={items.length} hasMore={!!nextPage} isLoadingMore={isLoadingMore} onLoadMore={handleLoadMore} />
          </div>
          {fromWatchlist && (
            <div className="container flex items-center gap-2 pb-2">
              <div className="inline-flex items-center gap-1.5 bg-secondary/60 text-secondary-foreground px-3 py-1 rounded-full text-xs">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span>Showing results for "<strong>{query}</strong>" (from starred card)</span>
                <button onClick={() => setFromWatchlist(false)} className="ml-1 rounded-full p-0.5 hover:bg-secondary transition-colors"><X className="h-3 w-3" /></button>
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
                <ListingGrid items={items} isInWatchlist={isInWatchlist} onToggleWatchlist={toggleWatchlist} />
                {nextPage && (
                  <div className="flex justify-center pt-6">
                    <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoadingMore}>
                      {isLoadingMore ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading…</> : 'Load more'}
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
        /* ── App Dashboard ── */
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-4 md:py-6">
          <PageHeader
            title="OmniMarket Cards"
            subtitle="Find underpriced listings fast."
            rightSlot={<CaptureSnapshotButton appId="search" getState={getSearchSnapshotState} />}
          />

          <div className="space-y-6">
            {/* Quick Start cards */}
            {/* Search CTA */}
            <button
              onClick={() => window.dispatchEvent(new Event("omni:focus-search"))}
              className="om-card rounded-2xl px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:-translate-y-px transition-all duration-200 w-full sm:w-auto"
              style={{ border: '1px solid var(--om-border-0)' }}
            >
              <Search className="h-4 w-4" style={{ color: 'var(--om-accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--om-text-1)' }}>Search any card on eBay</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickStartCards.map((card) => (
                <Link key={card.title} to={card.to}>
                  <div
                    className="om-card rounded-2xl p-4 flex flex-col gap-1.5 cursor-pointer hover:-translate-y-px transition-all duration-200"
                    style={{ border: '1px solid var(--om-border-0)' }}
                  >
                    <card.icon className="h-5 w-5" style={{ color: 'var(--om-accent)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--om-text-0)' }}>{card.title}</span>
                    <span className="text-[12px] leading-relaxed" style={{ color: 'var(--om-text-2)' }}>{card.desc}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Search Ideas — merged recent + suggested */}
            <section>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5" style={{ color: 'var(--om-text-3)' }}>
                <Sparkles className="h-3.5 w-3.5" /> Trending
              </h2>
              <div className="flex flex-wrap gap-2">
                {searchIdeas.map(({ term, isRecent }) => (
                  <button
                    key={term}
                    onClick={() => navigate(`/?q=${encodeURIComponent(term)}`)}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium hover:-translate-y-px transition-all duration-150 cursor-pointer"
                    style={{ background: 'var(--om-bg-2)', color: 'var(--om-text-1)', border: '1px solid var(--om-border-0)' }}
                  >
                    {isRecent && <span className="opacity-50">↺</span>}
                    {term}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
