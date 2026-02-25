import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowRight, ExternalLink, Search, ChevronRight } from "lucide-react";
import psaMosaic from "@/assets/psa-mosaic.jpg";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchFilters } from "@/components/SearchFilters";
import { ListingGrid } from "@/components/ListingGrid";
import { LoadingGrid } from "@/components/LoadingGrid";
import { EmptyState } from "@/components/EmptyState";
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

/* ── Hub cache helpers ── */
type HubPulse = { tcgTotal: number; sportsTotal: number; updatedAt: number };
const HUB_CACHE_KEY = "omni_hub_cache_v1";
const HUB_CACHE_TTL_MS = 60_000;

function readHubCache() {
  try {
    const raw = localStorage.getItem(HUB_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > HUB_CACHE_TTL_MS) return null;
    return parsed as { ts: number; pulse: HubPulse; featured: EbayItem[] };
  } catch {
    return null;
  }
}

function writeHubCache(pulse: HubPulse, featured: EbayItem[]) {
  try {
    localStorage.setItem(HUB_CACHE_KEY, JSON.stringify({ ts: Date.now(), pulse, featured }));
  } catch {}
}

function minutesAgo(ts: number) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  return m <= 1 ? "Just now" : `${m}m ago`;
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  /* ── Hub state ── */
  const [hubPulse, setHubPulse] = useState<HubPulse | null>(null);
  const [hubFeatured, setHubFeatured] = useState<EbayItem[]>([]);
  const [hubLoading, setHubLoading] = useState(false);
  const [hubError, setHubError] = useState<string | null>(null);

  // Search when URL query changes (handles both mount and header-nav)
  useEffect(() => {
    if (urlQuery && urlQuery !== lastSearchedRef.current) {
      lastSearchedRef.current = urlQuery;
      setQuery(urlQuery);
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

  const handleClear = () => {
    setQuery("");
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

  /* ── Hub data loader ── */
  const loadHubData = useCallback(async () => {
    setHubLoading(true);
    setHubError(null);
    try {
      const [tcgRes, sportsRes, featuredRes] = await Promise.all([
        searchEbay({ query: 'pokemon cards', limit: 1 }),
        searchEbay({ query: 'topps chrome', limit: 1 }),
        searchEbay({ query: 'rookie card', limit: 6 }),
      ]);

      const pulse: HubPulse = {
        tcgTotal: tcgRes.total ?? 0,
        sportsTotal: sportsRes.total ?? 0,
        updatedAt: Date.now(),
      };
      const featured = featuredRes.items ?? [];

      setHubPulse(pulse);
      setHubFeatured(featured);
      writeHubCache(pulse, featured);
    } catch {
      setHubError("Live preview unavailable.");
      setHubFeatured([]);
    } finally {
      setHubLoading(false);
    }
  }, []);

  /* ── Trigger hub load only when idle ── */
  const hubLoadedRef = useRef(false);
  useEffect(() => {
    const isIdleHub = !isLoading && !error && items.length === 0 && !query;
    if (!isIdleHub) return;

    const cached = readHubCache();
    if (cached?.pulse && cached?.featured) {
      setHubPulse(cached.pulse);
      setHubFeatured(cached.featured);
      return;
    }

    if (hubLoadedRef.current) return;
    hubLoadedRef.current = true;
    loadHubData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, items.length, query]);

  const formatPrice = (value: string, currency: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  };

  

  const marketTilesRef = useRef<HTMLDivElement>(null);
  const handleFocusSearch = () => document.querySelector<HTMLInputElement>('input')?.focus();
  const handleExploreMarkets = () => marketTilesRef.current?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div className="min-h-[calc(100vh-48px)] bg-background pb-16 sm:pb-0">
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
          <div className="relative overflow-hidden bg-om-bg-0 bg-gradient-to-b from-om-bg-0 via-om-bg-1 to-om-bg-0 text-om-text-0">
            {/* Grid texture */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            {/* PSA mosaic blurred texture */}
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
            {/* Cyan glow top-left */}
            <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px]" />
            {/* Blue glow bottom-right */}
            <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />

            <div className="relative mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
              {/* ── Hero 12-column grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center min-h-[85vh] py-12 md:py-0">
                {/* Left column */}
                <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
                  <span className="text-[11px] font-medium uppercase tracking-[0.30em] text-om-text-1">OmniMarket Cards</span>

                  <h1 className="mt-6 text-[36px] md:text-[48px] font-semibold tracking-[-0.03em] leading-[1.08] text-om-text-0 max-w-[540px]">
                    Discover the market before it moves.
                  </h1>
                  <p className="mt-4 max-w-[480px] text-[14px] leading-[1.55] text-om-text-2">
                    Search live eBay listings instantly—or jump into a market view built for finding undervalued cards fast.
                  </p>

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={handleFocusSearch}
                      className="inline-flex items-center justify-center bg-white text-om-bg-0 rounded-xl h-11 px-6 text-sm font-medium hover:-translate-y-px hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                    >
                      Start Searching
                    </button>
                    <button
                      onClick={handleExploreMarkets}
                      className="inline-flex items-center justify-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] text-om-text-0 rounded-xl h-11 px-6 text-sm font-medium hover:bg-[rgba(255,255,255,0.10)] hover:-translate-y-px active:scale-[0.98] transition-all duration-200"
                      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                    >
                      Explore Markets <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right column — Live Surface glass card */}
                <div className="lg:col-span-6">
                  <div className="glass-panel p-8 relative overflow-hidden">
                    {/* Live Stats */}
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.30em] text-om-text-2 mb-3">Live Market Pulse</p>
                      {hubLoading ? (
                        <div className="grid grid-cols-3 gap-3">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-2xl bg-om-bg-1/60 border border-[rgba(255,255,255,0.10)] p-4 h-[72px] animate-pulse" />
                          ))}
                        </div>
                      ) : hubError ? (
                        <p className="text-[11px] italic text-om-text-3">{hubError}</p>
                      ) : hubPulse ? (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-om-bg-1/60 border border-[rgba(255,255,255,0.10)] p-4 text-center">
                            <p className="text-[24px] font-semibold text-om-text-0 tabular-nums">{hubPulse.tcgTotal.toLocaleString()}</p>
                            <p className="text-[11px] uppercase tracking-[0.30em] text-om-text-2">TCG Listings</p>
                          </div>
                          <div className="rounded-2xl bg-om-bg-1/60 border border-[rgba(255,255,255,0.10)] p-4 text-center">
                            <p className="text-[24px] font-semibold text-om-text-0 tabular-nums">{hubPulse.sportsTotal.toLocaleString()}</p>
                            <p className="text-[11px] uppercase tracking-[0.30em] text-om-text-2">Sports Listings</p>
                          </div>
                          <div className="rounded-2xl bg-om-bg-1/60 border border-[rgba(255,255,255,0.10)] p-4 text-center">
                            <p className="text-[24px] font-semibold text-om-text-0 tabular-nums">{minutesAgo(hubPulse.updatedAt)}</p>
                            <p className="text-[11px] uppercase tracking-[0.30em] text-om-text-2">Updated</p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* C) Featured (3 cards max) */}
                    <div className="mt-6">
                      <p className="text-[11px] uppercase tracking-[0.30em] text-om-text-2 mb-3">Featured Listings</p>
                      {hubLoading ? (
                        <div className="grid grid-cols-3 gap-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-xl bg-om-bg-1/70 border border-[rgba(255,255,255,0.10)] overflow-hidden">
                              <div className="aspect-square bg-om-bg-2 animate-pulse" />
                              <div className="p-2 space-y-1.5">
                                <div className="h-3 w-3/4 bg-om-bg-2 rounded animate-pulse" />
                                <div className="h-3.5 w-12 bg-om-bg-2 rounded animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : hubFeatured.length > 0 ? (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            {hubFeatured.slice(0, 3).map((item) => (
                              <a
                                key={item.itemId}
                                href={item.itemUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="group/card rounded-xl bg-om-bg-1/70 border border-[rgba(255,255,255,0.10)] overflow-hidden hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.20)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-200"
                                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                              >
                                <div className="aspect-square bg-om-bg-2 overflow-hidden">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain group-hover/card:scale-[1.03] transition-transform duration-300" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-om-text-3 text-[10px]">No Image</div>
                                  )}
                                </div>
                                <div className="p-2 space-y-0.5">
                                  <p className="text-[11px] leading-tight line-clamp-2 text-om-text-2">{item.title}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[14px] font-semibold text-om-text-0 tabular-nums">{formatPrice(item.price.value, item.price.currency)}</span>
                                    <ExternalLink className="h-2.5 w-2.5 text-om-text-3" />
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                          <p className="mt-3 text-[11px] text-om-text-2 hover:text-om-text-0 text-center cursor-default transition">View all live listings →</p>
                        </>
                      ) : (
                        <p className="text-[11px] italic text-om-text-3">No featured listings available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Market Tiles ── */}
              <div ref={marketTilesRef} className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                <Link
                  to="/tcg"
                  className="group rounded-3xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] p-10 hover:bg-[rgba(255,255,255,0.10)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <h3 className="text-[16px] font-semibold text-om-text-0">TCG Market</h3>
                  <p className="mt-1 text-[14px] text-om-text-2">Search Pokémon &amp; One Piece cards by chase, set, and more.</p>
                  <span className="mt-4 inline-flex items-center justify-center bg-white text-om-bg-0 rounded-xl h-10 px-5 text-sm font-medium w-fit hover:-translate-y-px active:scale-[0.98] transition-all duration-200">
                    Explore TCG Market <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </span>
                </Link>
                <Link
                  to="/sports"
                  className="group rounded-3xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] p-10 hover:bg-[rgba(255,255,255,0.10)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <h3 className="text-[16px] font-semibold text-om-text-0">Sports Market</h3>
                  <p className="mt-1 text-[14px] text-om-text-2">Search sports cards by player, brand, and traits.</p>
                  <span className="mt-4 inline-flex items-center justify-center bg-white text-om-bg-0 rounded-xl h-10 px-5 text-sm font-medium w-fit hover:-translate-y-px active:scale-[0.98] transition-all duration-200">
                    Explore Sports Market <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
