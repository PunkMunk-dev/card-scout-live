/**
 * Gem Rate Service
 * 
 * Uses historical population data and QC trends to estimate
 * PSA 10 gem rates for trading cards.
 */

import { supabase } from '@/integrations/supabase/client';
import type { GemRateResult } from '@/types/gemScore';

// Keywords that indicate non-single cards (lots, boxes, packs, etc.)
const EXCLUDED_KEYWORDS = [
  'lot', 'lots', 'box', 'pack', 'sealed', 'case', 
  'blaster', 'hobby box', 'break', 'bundle', 'set'
];

// Keywords indicating already graded cards
const GRADED_KEYWORDS = [
  'psa 10', 'psa 9', 'psa 8', 'psa 7', 'psa 6', 'psa 5',
  'bgs 10', 'bgs 9.5', 'bgs 9', 'bgs 8.5', 'bgs 8',
  'sgc 10', 'sgc 9.5', 'sgc 9', 'sgc 8.5', 'sgc 8',
  'cgc 10', 'cgc 9.5', 'cgc 9',
  'gem mint', 'pristine', 'black label',
  'psa:', 'bgs:', 'sgc:', 'cgc:'
];

// Regex patterns for extracting grades
const GRADE_PATTERNS = [
  /\bpsa\s*(\d+(?:\.\d+)?)\b/i,
  /\bbgs\s*(\d+(?:\.\d+)?)\b/i,
  /\bsgc\s*(\d+(?:\.\d+)?)\b/i,
  /\bcgc\s*(\d+(?:\.\d+)?)\b/i,
];

// In-memory cache to prevent duplicate API calls during session
const rateCache = new Map<string, GemRateResult>();

/**
 * Check if a listing title indicates a non-single card product
 */
export function shouldSkipListing(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Check if a card is already graded and extract the grade
 */
function extractCertifiedGrade(title: string): { company: string; grade: number } | null {
  const lowerTitle = title.toLowerCase();
  
  for (const pattern of GRADE_PATTERNS) {
    const match = title.match(pattern);
    if (match) {
      const grade = parseFloat(match[1]);
      if (grade >= 1 && grade <= 10) {
        const company = pattern.source.match(/\\b(\w+)\\s/)?.[1]?.toUpperCase() || 'PSA';
        return { company, grade };
      }
    }
  }
  
  return null;
}

/**
 * Generate cache key from listing ID
 */
function getCacheKey(listingId: string): string {
  return listingId;
}

/**
 * Get Gem Rate for a listing by calling the edge function
 */
export async function getGemRate({
  listingId,
  title,
  force = false
}: {
  listingId: string;
  title: string;
  force?: boolean;
}): Promise<GemRateResult> {
  // Check if should skip based on title (client-side optimization)
  if (shouldSkipListing(title)) {
    return {
      listingId,
      gemRate: null,
      psa10Likelihood: 'Low',
      confidence: 0,
      dataPoints: 0,
      qcRating: 'average',
      qcNotes: '',
      source: '',
      matchType: 'default',
      modifiersApplied: [],
      analysisMethod: 'failed',
      error: 'Not a single card listing'
    };
  }
  
  // Check for already graded cards (client-side extraction)
  const certifiedGrade = extractCertifiedGrade(title);
  if (certifiedGrade) {
    const result: GemRateResult = {
      listingId,
      gemRate: certifiedGrade.grade * 10, // Convert to percentage-like scale
      psa10Likelihood: 'Certified',
      confidence: 1.0,
      dataPoints: 0,
      qcRating: 'excellent',
      qcNotes: `Already graded by ${certifiedGrade.company}`,
      source: 'Title Extraction',
      matchType: 'exact',
      modifiersApplied: [],
      certifiedGrade,
      analysisMethod: 'certified_extraction'
    };
    rateCache.set(getCacheKey(listingId), result);
    return result;
  }
  
  // Check session cache first (unless force refresh)
  const cacheKey = getCacheKey(listingId);
  if (!force) {
    const cached = rateCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('gem-rate', {
      body: { listingId, title }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      const result: GemRateResult = {
        listingId,
        gemRate: null,
        psa10Likelihood: 'Low',
        confidence: 0,
        dataPoints: 0,
        qcRating: 'average',
        qcNotes: '',
        source: '',
        matchType: 'default',
        modifiersApplied: [],
        analysisMethod: 'failed',
        error: error.message || 'Edge function error'
      };
      rateCache.set(cacheKey, result);
      return result;
    }
    
    // Map edge function response to GemRateResult
    const result: GemRateResult = {
      listingId: data.listingId,
      gemRate: data.gemRate,
      psa10Likelihood: data.psa10Likelihood || 'Low',
      psa9Rate: data.psa9Rate,
      confidence: data.confidence || 0,
      dataPoints: data.dataPoints || 0,
      qcRating: data.qcRating || 'average',
      qcNotes: data.qcNotes || '',
      source: data.source || '',
      matchType: data.matchType || 'default',
      baseRate: data.baseRate,
      modifiersApplied: data.modifiersApplied || [],
      cardMetadata: data.cardMetadata,
      analysisMethod: data.analysisMethod || 'historical_data',
      error: data.error
    };
    
    // Cache the result
    rateCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Gem rate fetch error:', error);
    const result: GemRateResult = {
      listingId,
      gemRate: null,
      psa10Likelihood: 'Low',
      confidence: 0,
      dataPoints: 0,
      qcRating: 'average',
      qcNotes: '',
      source: '',
      matchType: 'default',
      modifiersApplied: [],
      analysisMethod: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    rateCache.set(cacheKey, result);
    return result;
  }
}

/**
 * Clear the rate cache (useful for testing or manual refresh)
 */
export function clearGemRateCache(): void {
  rateCache.clear();
}

/**
 * Check if the Gem Rate feature is configured (always true - no external API needed)
 */
export function isGemRateConfigured(): boolean {
  return true;
}
