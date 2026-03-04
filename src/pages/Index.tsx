import { useState, useCallback, useEffect, useRef } from "react";
import { CaptureSnapshotButton } from '@/components/ui-audit/CaptureSnapshotButton';
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Star, X, Search, Layers, Trophy, TrendingUp, Sun, Moon, Camera, Clock, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
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

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]") as string[];
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const { theme, setTheme } = useTheme();

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
  const handleSortChange = (newSort: SortOption) => { setSort(newSort); if (query && hasSearched) { setError(null); performSearch(query, 1, false, newSort); } };
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
    { icon: Search, title: "Live eBay Search", desc: "Search any card across eBay in real time.", action: () => { const input = document.querySelector<HTMLInputElement>('header input[type="text"]'); if (input) { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => input.focus(), 300); } } },
    { icon: Layers, title: "TCG Market", desc: "Pokémon & One Piece card explorer.", to: "/tcg" },
    { icon: Trophy, title: "Sports Market", desc: "Sports cards by player, brand & trait.", to: "/sports" },
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
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-6 md:py-10">
          {/* Compact header */}
          <div className="mb-8">
            <h1 className="text-[28px] md:text-[36px] font-semibold tracking-tight" style={{ color: 'var(--om-text-0)' }}>
              OmniMarket Cards
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--om-text-2)' }}>
              Find underpriced listings fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* ── Left column (8/12) ── */}
            <div className="md:col-span-8 space-y-8">
              {/* Quick Start cards */}
              <section>
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--om-text-3)' }}>Quick Start</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {quickStartCards.map((card) => {
                    const inner = (
                      <div
                        key={card.title}
                        className="om-card rounded-2xl p-5 flex flex-col gap-2 cursor-pointer hover:-translate-y-px transition-all duration-200"
                        style={{ border: '1px solid var(--om-border-0)' }}
                      >
                        <card.icon className="h-5 w-5" style={{ color: 'var(--om-accent)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--om-text-0)' }}>{card.title}</span>
                        <span className="text-[12px] leading-relaxed" style={{ color: 'var(--om-text-2)' }}>{card.desc}</span>
                      </div>
                    );
                    if (card.to) return <Link key={card.title} to={card.to}>{inner}</Link>;
                    return <div key={card.title} onClick={card.action}>{inner}</div>;
                  })}
                </div>
              </section>

              {/* Recent Searches */}
              <section>
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5" style={{ color: 'var(--om-text-3)' }}>
                  <Clock className="h-3.5 w-3.5" /> Recent Searches
                </h2>
                {recentSearches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 8).map((term) => (
                      <button
                        key={term}
                        onClick={() => navigate(`/?q=${encodeURIComponent(term)}`)}
                        className="om-pill rounded-xl px-3 py-1.5 text-xs font-medium hover:-translate-y-px transition-all duration-150 cursor-pointer"
                        style={{ background: 'var(--om-bg-2)', color: 'var(--om-text-1)', border: '1px solid var(--om-border-0)' }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--om-text-3)' }}>No recent searches yet. Try searching for a card above.</p>
                )}
              </section>

              {/* Suggested Searches */}
              <section>
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5" style={{ color: 'var(--om-text-3)' }}>
                  <Sparkles className="h-3.5 w-3.5" /> Suggested Searches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => navigate(`/?q=${encodeURIComponent(term)}`)}
                      className="rounded-xl px-3 py-1.5 text-xs font-medium hover:-translate-y-px transition-all duration-150 cursor-pointer"
                      style={{ background: 'var(--om-accent)', color: '#fff', opacity: 0.85 }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* ── Right column (4/12) ── */}
            <div className="md:col-span-4 space-y-4">
              {/* System card */}
              <div className="om-card rounded-2xl p-5 space-y-4" style={{ border: '1px solid var(--om-border-0)' }}>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--om-text-3)' }}>System</h3>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors hover:opacity-80"
                    style={{ background: 'var(--om-bg-2)', color: 'var(--om-text-1)', border: '1px solid var(--om-border-0)' }}
                  >
                    {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <CaptureSnapshotButton appId="search" getState={getSearchSnapshotState} />
                  <Link
                    to="/ui-audit"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors hover:opacity-80"
                    style={{ background: 'var(--om-bg-2)', color: 'var(--om-text-1)', border: '1px solid var(--om-border-0)' }}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    UI Audit
                  </Link>
                </div>
              </div>

              {/* Top ROI card */}
              <Link to="/roi" className="block">
                <div className="om-card rounded-2xl p-5 hover:-translate-y-px transition-all duration-200 cursor-pointer" style={{ border: '1px solid var(--om-border-0)' }}>
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="h-5 w-5" style={{ color: 'var(--om-accent)' }} />
                    <div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--om-text-0)' }}>Top ROI Cards</span>
                      <p className="text-[12px]" style={{ color: 'var(--om-text-2)' }}>See the best grading value plays.</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Search hint */}
          <p className="mt-8 text-center text-[12px]" style={{ color: 'var(--om-text-3)' }}>
            Tip: Try searching "<button onClick={() => navigate('/?q=Wembanyama+Prizm+Silver')} className="underline hover:opacity-80 cursor-pointer" style={{ color: 'var(--om-accent)' }}>Wembanyama Prizm Silver</button>"
          </p>
        </div>
      )}
    </div>
  );
}
