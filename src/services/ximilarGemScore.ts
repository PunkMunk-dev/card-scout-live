/**
 * Ximilar AI Card Grading Service
 * 
 * This service calls the card-gem-score edge function which securely
 * handles the Ximilar API token and caches results in the database.
 */

import { supabase } from '@/integrations/supabase/client';
import type { GemScoreResult } from '@/types/gemScore';

// Keywords that indicate non-single cards (lots, boxes, packs, etc.)
const EXCLUDED_KEYWORDS = [
  'lot', 'lots', 'box', 'pack', 'sealed', 'case', 
  'blaster', 'hobby box', 'break', 'bundle', 'set'
];

// In-memory cache to prevent duplicate API calls during session
const scoreCache = new Map<string, GemScoreResult>();

/**
 * Check if the Gem Score feature is configured
 * Always returns true since the token is now server-side
 */
export function isGemScoreConfigured(): boolean {
  return true;
}

/**
 * Check if a listing title indicates a non-single card product
 */
export function shouldSkipListing(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Generate cache key from listing ID and image URL
 */
function getCacheKey(listingId: string, imageUrl: string): string {
  return `${listingId}:${imageUrl}`;
}

/**
 * Get Gem Score for a listing by calling the edge function
 */
export async function getGemScore({
  listingId,
  imageUrl,
  title = '',
  force = false
}: {
  listingId: string;
  imageUrl: string;
  title?: string;
  force?: boolean;
}): Promise<GemScoreResult> {
  // Check if should skip based on title (client-side optimization)
  if (shouldSkipListing(title)) {
    return {
      listingId,
      gemScore: null,
      psa10Likelihood: 'Low',
      confidence: 0,
      subgrades: null,
      error: 'Not a single card listing'
    };
  }
  
  // Check session cache first (unless force refresh)
  const cacheKey = getCacheKey(listingId, imageUrl);
  if (!force) {
    const cached = scoreCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('card-gem-score', {
      body: { listingId, imageUrl, title, force }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      const result: GemScoreResult = {
        listingId,
        gemScore: null,
        psa10Likelihood: 'Low',
        confidence: 0,
        subgrades: null,
        error: error.message || 'Edge function error'
      };
      scoreCache.set(cacheKey, result);
      return result;
    }
    
    // Map edge function response to GemScoreResult
    const result: GemScoreResult = {
      listingId: data.listingId,
      gemScore: data.gemScore,
      psa10Likelihood: data.psa10Likelihood || 'Low',
      confidence: data.confidence || 0,
      subgrades: data.subgrades || null,
      error: data.error || undefined,
      rawGrade: data.rawGrade,
      cached: data.cached || false,
      gradeSource: data.gradeSource
    };
    
    // Cache the result
    scoreCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Gem score fetch error:', error);
    const result: GemScoreResult = {
      listingId,
      gemScore: null,
      psa10Likelihood: 'Low',
      confidence: 0,
      subgrades: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    scoreCache.set(cacheKey, result);
    return result;
  }
}

/**
 * Clear the score cache (useful for testing or manual refresh)
 */
export function clearGemScoreCache(): void {
  scoreCache.clear();
}
