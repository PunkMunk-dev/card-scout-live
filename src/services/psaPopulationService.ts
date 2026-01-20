/**
 * PSA Population Service
 * 
 * Client-side service for fetching PSA population data.
 * Uses localStorage to enforce rate limits (1 call per card per 48hrs).
 * Never blocks UI, fails silently.
 * 
 * Trigger Points (ONLY):
 * - When card detail is opened
 * - When card is added to watchlist
 */

import { supabase } from '@/integrations/supabase/client';

const CACHE_PREFIX = 'psa_pop_';
const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export interface PopulationResult {
  psa10: number | null;
  total: number | null;
  gem_rate: number | null;
  source: 'firecrawl' | 'fallback' | 'cache';
  cached?: boolean;
}

/**
 * Generate a normalized card slug from item title
 */
export function generateCardSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

/**
 * Check if we've recently fetched population data for this card
 */
function hasRecentFetch(cardSlug: string): boolean {
  try {
    const lastFetch = localStorage.getItem(`${CACHE_PREFIX}${cardSlug}`);
    if (!lastFetch) return false;
    
    const timestamp = parseInt(lastFetch, 10);
    return Date.now() - timestamp < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Mark that we've fetched population data for this card
 */
function markFetched(cardSlug: string): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${cardSlug}`, Date.now().toString());
  } catch {
    // localStorage might be full or disabled, ignore
  }
}

/**
 * Fetch PSA population data for a card
 * 
 * Rate limited: only calls edge function if not fetched in last 48hrs
 * Never throws, always returns a result
 */
export async function fetchPsaPopulation(
  title: string,
  psaUrl?: string
): Promise<PopulationResult> {
  const cardSlug = generateCardSlug(title);
  
  // Check local rate limit
  if (hasRecentFetch(cardSlug)) {
    // Try to get from database cache instead
    return getCachedPopulation(cardSlug);
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('psa-population-extract', {
      body: { card_slug: cardSlug, psa_url: psaUrl }
    });
    
    if (error) {
      console.error('PSA population fetch error:', error);
      return { psa10: null, total: null, gem_rate: null, source: 'fallback' };
    }
    
    // Mark as fetched regardless of result
    markFetched(cardSlug);
    
    // Return the result
    return {
      psa10: data?.psa10 ?? null,
      total: data?.total ?? null,
      gem_rate: data?.gem_rate ?? null,
      source: data?.source || 'fallback',
      cached: data?.cached,
    };
  } catch (error) {
    console.error('PSA population service error:', error);
    return { psa10: null, total: null, gem_rate: null, source: 'fallback' };
  }
}

/**
 * Get cached population data from database
 * Used when local rate limit prevents new fetch
 */
async function getCachedPopulation(cardSlug: string): Promise<PopulationResult> {
  try {
    const { data, error } = await supabase
      .from('psa_population_cache')
      .select('psa10_count, total_count, gem_rate, source')
      .eq('card_slug', cardSlug)
      .single();
    
    if (error || !data) {
      return { psa10: null, total: null, gem_rate: null, source: 'fallback' };
    }
    
    return {
      psa10: data.psa10_count,
      total: data.total_count,
      gem_rate: data.gem_rate,
      source: 'cache',
      cached: true,
    };
  } catch {
    return { psa10: null, total: null, gem_rate: null, source: 'fallback' };
  }
}

/**
 * Check if population data is available for a card (from cache)
 * Non-blocking, returns immediately
 */
export async function hasPopulationData(title: string): Promise<boolean> {
  const cardSlug = generateCardSlug(title);
  
  try {
    const { count, error } = await supabase
      .from('psa_population_cache')
      .select('id', { count: 'exact', head: true })
      .eq('card_slug', cardSlug)
      .gt('expires_at', new Date().toISOString());
    
    return !error && (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Clear local rate limit cache (for testing)
 */
export function clearPopulationCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore
  }
}
