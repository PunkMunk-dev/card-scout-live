import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowRight, ExternalLink } from "lucide-react";
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

function getTrendingLabels() {
  const curated = [
    "Wembanyama Chrome — Moving",
    "Ja'Marr Chase RC — Hot",
    "Pikachu SIR — Trending",
    "One Piece OP-05 — Up",
    "Prizm Rookie QBs — Active",
    "PSA 10 spreads — Watch",
  ];
  try {
    const recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]") as string[];
    const recentPills = recent.slice(0, 6).map((t) => `${t} — Recent`);
    return [...recentPills, ...curated].slice(0, 10);
  } catch {
    return curated;
  }
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
        searchEbay({ query: 'pokemon OR "one piece"', limit: 1 }),
        searchEbay({ query: 'panini OR topps', limit: 1 }),
        searchEbay({ query: 'rookie OR chrome OR holo', limit: 6 }),
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
  useEffect(() => {
    const isIdleHub = !isLoading && !error && items.length === 0 && !query;
    if (!isIdleHub) return;

    const cached = readHubCache();
    if (cached?.pulse && cached?.featured) {
      setHubPulse(cached.pulse);
      setHubFeatured(cached.featured);
      return;
    }

    loadHubData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, items.length, query]);

  const formatPrice = (value: string, currency: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  };

  const trending = getTrendingLabels();

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
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50">
            {/* glow accents */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
            {/* subtle grid */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] [background-size:24px_24px]" />

            <div className="relative px-6 py-12 md:px-10 md:py-16">
              {/* Wordmark */}
              <div className="flex flex-col items-center text-center select-none">
                <div className="flex flex-col leading-none">
                  <span className="text-[28px] md:text-[34px] font-semibold tracking-tight text-slate-900">
                    OMNIMARKET
                  </span>
                  <span className="mt-1 text-[12px] tracking-[0.35em] uppercase text-slate-500">
                    Cards
                  </span>
                </div>
              </div>

              {/* Hero copy */}
              <div className="mt-5 flex flex-col items-center text-center">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                  Discover the market before it moves.
                </h1>
                <p className="mt-3 max-w-xl text-sm md:text-base text-slate-600">
                  Search live eBay listings instantly—or jump into a market view built for finding undervalued cards fast.
                </p>
              </div>

              {/* Value chips */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">Live Listings</div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">Undervalued Finds</div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">Clean Results</div>
              </div>

              {/* ── A) Live Market Pulse ── */}
              <div className="mt-8">
                <div className="mb-3 text-xs font-semibold tracking-[0.28em] uppercase text-slate-500">
                  Live Market Pulse
                </div>
                {hubLoading ? (
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                  </div>
                ) : hubError ? (
                  <p className="text-xs italic text-muted-foreground text-center">{hubError}</p>
                ) : hubPulse ? (
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm p-4 text-center">
                      <p className="text-lg font-bold text-slate-900 tabular-nums">{hubPulse.tcgTotal.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500">TCG Listings</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm p-4 text-center">
                      <p className="text-lg font-bold text-slate-900 tabular-nums">{hubPulse.sportsTotal.toLocaleString()}</p>
                      <p className="text-[11px] text-slate-500">Sports Listings</p>
                    </div>
                    <p className="col-span-2 text-center text-[10px] text-slate-400 mt-1">
                      Updated {minutesAgo(hubPulse.updatedAt)}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Market tiles */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
                <Link
                  to="/tcg"
                  className="group rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-6 md:p-7 flex flex-col"
                >
                  <h3 className="font-semibold text-slate-900 mb-1">TCG Market</h3>
                  <p className="text-xs text-slate-500 mb-4">Search Pokémon &amp; One Piece cards by chase, set, and more.</p>
                  <span className="mt-auto inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition">
                    Explore TCG Market <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </span>
                </Link>
                <Link
                  to="/sports"
                  className="group rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-6 md:p-7 flex flex-col"
                >
                  <h3 className="font-semibold text-slate-900 mb-1">Sports Market</h3>
                  <p className="text-xs text-slate-500 mb-4">Search sports cards by player, brand, and traits.</p>
                  <span className="mt-auto inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition">
                    Explore Sports Market <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>

              {/* ── B) Featured Live Listings ── */}
              <div className="mt-10">
                <div className="mb-3 text-xs font-semibold tracking-[0.28em] uppercase text-slate-500">
                  Featured Live Listings
                </div>
                {hubLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 bg-white/70 overflow-hidden">
                        <Skeleton className="aspect-square w-full rounded-none" />
                        <div className="p-2.5 space-y-2">
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hubFeatured.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {hubFeatured.map((item) => (
                      <a
                        key={item.itemId}
                        href={item.itemUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group/card rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <div className="aspect-square bg-slate-100 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-contain group-hover/card:scale-[1.03] transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 space-y-1">
                          <p className="text-[11px] leading-tight line-clamp-2 text-slate-700">{item.title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900 tabular-nums">
                              {formatPrice(item.price.value, item.price.currency)}
                            </span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground text-center">No featured listings available.</p>
                )}
              </div>

              {/* Trending Now */}
              <div className="mt-10">
                <div className="mb-3 text-xs font-semibold tracking-[0.28em] uppercase text-slate-500">
                  Trending Now
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {trending.map((t) => (
                    <div
                      key={t}
                      className="whitespace-nowrap rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs text-slate-700 hover:bg-white transition"
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
