/**
 * Graded Population Lookup Service
 * 
 * Client-side service for fetching PSA population data from graded listings.
 * Used to enrich raw/ungraded cards with real population data.
 */

import { supabase } from '@/integrations/supabase/client';

export interface GradedPopResult {
  psa10: number | null;
  total: number | null;
  gemRate: number | null;
  source: 'graded_lookup';
}

interface GradedPopResponse {
  query: string;
  popData: {
    psa10: number | null;
    total: number | null;
    gemRate: number | null;
  } | null;
  matchCount: number;
  source: 'graded_lookup';
  error?: string;
}

// In-memory cache for graded pop lookups (session-only)
const popCache = new Map<string, GradedPopResult | null>();

/**
 * Generate a cache key from title
 */
function getCacheKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

/**
 * Lookup graded population data for a raw card listing
 * 
 * @param title - The raw listing title
 * @returns Population data from matching graded listings, or null if not found
 */
export async function lookupGradedPop(title: string): Promise<GradedPopResult | null> {
  const cacheKey = getCacheKey(title);
  
  // Check cache first
  if (popCache.has(cacheKey)) {
    return popCache.get(cacheKey) || null;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke<GradedPopResponse>('graded-pop-lookup', {
      body: { title }
    });
    
    if (error) {
      console.error('Graded pop lookup error:', error);
      popCache.set(cacheKey, null);
      return null;
    }
    
    if (!data?.popData?.psa10) {
      popCache.set(cacheKey, null);
      return null;
    }
    
    const result: GradedPopResult = {
      psa10: data.popData.psa10,
      total: data.popData.total,
      gemRate: data.popData.gemRate,
      source: 'graded_lookup',
    };
    
    popCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Graded pop service error:', error);
    popCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Batch lookup for multiple titles
 * Runs in parallel with rate limiting
 */
export async function lookupGradedPopBatch(
  titles: string[],
  maxConcurrent: number = 3
): Promise<Map<string, GradedPopResult | null>> {
  const results = new Map<string, GradedPopResult | null>();
  
  // Process in batches
  for (let i = 0; i < titles.length; i += maxConcurrent) {
    const batch = titles.slice(i, i + maxConcurrent);
    const promises = batch.map(async (title) => {
      const result = await lookupGradedPop(title);
      return { title, result };
    });
    
    const batchResults = await Promise.all(promises);
    for (const { title, result } of batchResults) {
      results.set(title, result);
    }
    
    // Small delay between batches to avoid overwhelming the API
    if (i + maxConcurrent < titles.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Clear the in-memory cache
 */
export function clearGradedPopCache(): void {
  popCache.clear();
}
