import { useState, useCallback, useRef, useEffect } from 'react';
import type { EbayListing, EbaySearchParams, EbaySearchResponse, Psa10PriceResponse } from '@/types/sportsEbay';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function invokeEdgeFunction<T>(name: string, body: object): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Edge function error: ${res.status}`);
  return res.json();
}

interface UseSportsEbaySearchResult {
  listings: EbayListing[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingAll: boolean;
  error: string | null;
  hasMore: boolean;
  search: (params: EbaySearchParams) => void;
  loadMore: () => void;
  loadAll: (getFilteredCount?: () => number) => void;
  cancelLoadAll: () => void;
}

const DEBOUNCE_MS = 400;
const MAX_LOAD_ALL_PAGES = 10;
const LOAD_ALL_DELAY_MS = 200;
const MIN_FILTERED_TARGET = 200;

export function useSportsEbaySearch(): UseSportsEbaySearchResult {
  const [listings, setListings] = useState<EbayListing[]>([]);
  const listingsRef = useRef<EbayListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { listingsRef.current = listings; }, [listings]);

  const paginationRef = useRef<{ nextOffset?: number; nextPageNumber?: number; currentParams?: EbaySearchParams }>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadAllAbortRef = useRef<AbortController | null>(null);
  const hasMoreRef = useRef(false);
  const totalPagesLoadedRef = useRef(0);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const search = useCallback((params: EbaySearchParams) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    paginationRef.current = { currentParams: params };
    setHasMore(false);
    hasMoreRef.current = false;
    totalPagesLoadedRef.current = 0;
    setError(null);

    debounceTimerRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      try {
        console.log('[SportsSearch] Fetching:', params.playerName);
        const data = await invokeEdgeFunction<EbaySearchResponse>('sports-ebay-search', params);
        if (abortControllerRef.current?.signal.aborted) return;
        if (!data?.success) throw new Error(data?.error || 'Search failed');
        console.log('[SportsSearch] Got', data.listings.length, 'listings');

        paginationRef.current = { currentParams: params, nextOffset: data.nextOffset, nextPageNumber: data.nextPageNumber };
        setHasMore(data.hasMore ?? false);
        hasMoreRef.current = data.hasMore ?? false;

        const enriched = data.listings.map(l => ({ ...l, searchContext: { playerName: params.playerName, brand: params.brand, year: params.year, traits: params.traits } }));
        const seen = new Set<string>();
        const deduped = enriched.filter(l => { if (seen.has(l.itemId)) return false; seen.add(l.itemId); return true; });
        setListings(deduped);
        setError(null);
        setIsLoading(false);
        fetchPsa10Price(params);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to search eBay');
        setListings([]);
        setIsLoading(false);
        setHasMore(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const loadMore = useCallback(async () => {
    const { currentParams, nextOffset, nextPageNumber } = paginationRef.current;
    if (!currentParams || isLoadingMore || (!nextOffset && !nextPageNumber)) return;
    if ((nextOffset && nextOffset > 2000) || (nextPageNumber && nextPageNumber > 20)) { setHasMore(false); return; }

    setIsLoadingMore(true);
    try {
      const data = await invokeEdgeFunction<EbaySearchResponse>('sports-ebay-search', {
        ...currentParams, offset: nextOffset, pageNumber: nextPageNumber,
      });
      if (!data?.success) throw new Error('Failed to load more');

      paginationRef.current = { currentParams, nextOffset: data.nextOffset, nextPageNumber: data.nextPageNumber };
      setHasMore(data.hasMore ?? false);
      hasMoreRef.current = data.hasMore ?? false;

      const enriched = data.listings.map(l => ({ ...l, searchContext: { playerName: currentParams.playerName, brand: currentParams.brand, year: currentParams.year, traits: currentParams.traits } }));
      setListings(prev => {
        const ids = new Set(prev.map(l => l.itemId));
        return [...prev, ...enriched.filter(l => !ids.has(l.itemId))];
      });
    } catch { setHasMore(false); }
    finally { setIsLoadingMore(false); }
  }, [isLoadingMore]);

  const loadAll = useCallback(async (getFilteredCount?: () => number) => {
    const { currentParams } = paginationRef.current;
    if (!currentParams || isLoadingAll || !hasMoreRef.current) return;
    if (totalPagesLoadedRef.current >= MAX_LOAD_ALL_PAGES) { setHasMore(false); return; }

    loadAllAbortRef.current = new AbortController();
    setIsLoadingAll(true);
    let pagesLoaded = 0;
    let moreAvailable = true;
    const maxPages = MAX_LOAD_ALL_PAGES - totalPagesLoadedRef.current;
    const seenIds = new Set<string>(listingsRef.current.map(l => l.itemId));

    try {
      while (moreAvailable && pagesLoaded < maxPages) {
        if (loadAllAbortRef.current?.signal.aborted) break;
        if (getFilteredCount && getFilteredCount() >= MIN_FILTERED_TARGET) break;
        const { nextOffset, nextPageNumber } = paginationRef.current;
        if ((nextOffset && nextOffset > 2000) || (nextPageNumber && nextPageNumber > 20)) break;
        if (!nextOffset && !nextPageNumber) break;

        const data = await invokeEdgeFunction<EbaySearchResponse>('sports-ebay-search', {
          ...currentParams, offset: nextOffset, pageNumber: nextPageNumber,
        });
        if (loadAllAbortRef.current?.signal.aborted) break;
        if (!data?.success) break;

        moreAvailable = data.hasMore ?? false;
        paginationRef.current = { currentParams, nextOffset: data.nextOffset, nextPageNumber: data.nextPageNumber };
        setHasMore(moreAvailable);
        hasMoreRef.current = moreAvailable;

        const enriched = data.listings.map(l => ({ ...l, searchContext: { playerName: currentParams.playerName, brand: currentParams.brand, year: currentParams.year, traits: currentParams.traits } }));
        const unique = enriched.filter(l => !seenIds.has(l.itemId));
        unique.forEach(l => seenIds.add(l.itemId));
        if (unique.length > 0) setListings(prev => [...prev, ...unique]);

        pagesLoaded++;
        totalPagesLoadedRef.current++;
        if (!moreAvailable) break;
        await new Promise(r => setTimeout(r, LOAD_ALL_DELAY_MS));
      }
      if (moreAvailable) { setHasMore(false); hasMoreRef.current = false; }
    } catch {} finally { setIsLoadingAll(false); loadAllAbortRef.current = null; }
  }, [isLoadingAll]);

  const cancelLoadAll = useCallback(() => {
    if (loadAllAbortRef.current) { loadAllAbortRef.current.abort(); setIsLoadingAll(false); }
  }, []);

  const fetchPsa10Price = async (params: EbaySearchParams) => {
    try {
      const data = await invokeEdgeFunction<Psa10PriceResponse>('sports-ebay-sold-psa', {
        playerName: params.playerName, brand: params.brand,
      });
      if (!data?.success || data.marketValue === null) return;
      setListings(prev => prev.map(l => ({ ...l, psa10MarketValue: data.marketValue, psa10MarketValueConfidence: data.marketValueConfidence, psa10SoldComps: data.soldComps })));
    } catch {}
  };

  return { listings, isLoading, isLoadingMore, isLoadingAll, error, hasMore, search, loadMore, loadAll, cancelLoadAll };
}
