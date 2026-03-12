import { useState, useEffect, useRef, useCallback } from 'react';
import type { NormalizedListing } from '@/types/scanner';
import { normalizeCardIdentity, buildPsa10Query } from '@/lib/normalizeCardIdentity';
import { scrape130point } from '@/lib/scrape130point';
import { parse130pointSales, filterCleanComps, type Psa10SoldRecord } from '@/lib/parse130pointSales';
import { computeSoldStats, type SoldStats } from '@/lib/computeRawToPsaMetrics';

export interface Psa10Data {
  stats: SoldStats;
  comps: Psa10SoldRecord[];
  query: string;
  isLoading: boolean;
  error: string | null;
}

// Dedupe by query to avoid redundant scrapes
const psaCache = new Map<string, { stats: SoldStats; comps: Psa10SoldRecord[] }>();

// Concurrency limiter — max 3 parallel scrapes
const MAX_CONCURRENT = 3;
let activeCount = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    queue.push(() => {
      activeCount++;
      resolve();
    });
  });
}

function releaseSlot() {
  activeCount--;
  if (queue.length > 0) {
    const next = queue.shift()!;
    next();
  }
}

export function useRawToPsa(listings: NormalizedListing[]) {
  const [psaMap, setPsaMap] = useState<Map<string, Psa10Data>>(new Map());
  const inflightRef = useRef<Set<string>>(new Set());

  const fetchPsaData = useCallback(async (queryKey: string, listingIds: string[]) => {
    if (inflightRef.current.has(queryKey) || psaCache.has(queryKey)) {
      if (psaCache.has(queryKey)) {
        const cached = psaCache.get(queryKey)!;
        setPsaMap(prev => {
          const next = new Map(prev);
          for (const id of listingIds) {
            next.set(id, { ...cached, query: queryKey, isLoading: false, error: null });
          }
          return next;
        });
      }
      return;
    }

    inflightRef.current.add(queryKey);

    // Set loading
    setPsaMap(prev => {
      const next = new Map(prev);
      for (const id of listingIds) {
        next.set(id, { stats: { avgSold: 0, medianSold: 0, salesCount: 0 }, comps: [], query: queryKey, isLoading: true, error: null });
      }
      return next;
    });

    // Wait for a concurrency slot
    await acquireSlot();

    try {
      const result = await scrape130point(queryKey);
      if (!result.success) throw new Error(result.error || 'Scrape failed');

      const allRecords = parse130pointSales(result.markdown);
      const cleanComps = filterCleanComps(allRecords);
      const stats = computeSoldStats(cleanComps);

      psaCache.set(queryKey, { stats, comps: cleanComps });

      setPsaMap(prev => {
        const next = new Map(prev);
        for (const id of listingIds) {
          next.set(id, { stats, comps: cleanComps, query: queryKey, isLoading: false, error: null });
        }
        return next;
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed';
      setPsaMap(prev => {
        const next = new Map(prev);
        for (const id of listingIds) {
          next.set(id, { stats: { avgSold: 0, medianSold: 0, salesCount: 0 }, comps: [], query: queryKey, isLoading: false, error });
        }
        return next;
      });
    } finally {
      releaseSlot();
      inflightRef.current.delete(queryKey);
    }
  }, []);

  useEffect(() => {
    if (listings.length === 0) return;

    // Group listings by PSA 10 query
    const queryGroups = new Map<string, string[]>();
    for (const listing of listings) {
      const identity = normalizeCardIdentity(listing.title);
      const query = buildPsa10Query(identity);
      if (!query || query === 'PSA 10') continue;

      const existing = queryGroups.get(query) || [];
      existing.push(listing.id);
      queryGroups.set(query, existing);
    }

    // Fire off scrapes (deduped, concurrency-limited)
    for (const [queryKey, ids] of queryGroups) {
      fetchPsaData(queryKey, ids);
    }
  }, [listings, fetchPsaData]);

  return psaMap;
}
