/**
 * Ximilar AI Card Grading Service
 * 
 * ⚠️ SECURITY WARNING: This implementation uses a client-side API token.
 * DO NOT ship to production with the token exposed in the client bundle.
 * For production, use a backend proxy (Supabase Edge Function recommended).
 */

import type { GemScoreResult } from '@/types/gemScore';

// Token handling - prefer environment variable, fallback to placeholder
const XIMILAR_API_TOKEN = import.meta.env.VITE_XIMILAR_API_TOKEN || '<PASTE_TOKEN_HERE>';

// Keywords that indicate non-single cards (lots, boxes, packs, etc.)
const EXCLUDED_KEYWORDS = [
  'lot', 'lots', 'box', 'pack', 'sealed', 'case', 
  'blaster', 'hobby box', 'break', 'bundle', 'set'
];

// In-memory cache to prevent duplicate API calls during session
const scoreCache = new Map<string, GemScoreResult>();

/**
 * Check if the Ximilar token is configured
 */
export function isGemScoreConfigured(): boolean {
  return XIMILAR_API_TOKEN !== '<PASTE_TOKEN_HERE>' && XIMILAR_API_TOKEN.length > 0;
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
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Extract final grade from Ximilar response
 * Robustly handles various response structures
 */
function extractFinalGrade(record: any): number | null {
  // Check various possible field names for the final grade
  const possibleFields = ['final', 'final_grade', 'grade', 'best_grade'];
  
  // Check top-level fields
  for (const field of possibleFields) {
    if (typeof record[field] === 'number') {
      return record[field];
    }
  }
  
  // Check nested grades object
  if (record.grades && typeof record.grades === 'object') {
    for (const field of possibleFields) {
      if (typeof record.grades[field] === 'number') {
        return record.grades[field];
      }
    }
    
    // If subgrades exist, compute average as fallback
    const subgradeFields = ['centering', 'corners', 'edges', 'surface'];
    const subgrades: number[] = [];
    for (const field of subgradeFields) {
      if (typeof record.grades[field] === 'number') {
        subgrades.push(record.grades[field]);
      }
    }
    if (subgrades.length > 0) {
      return subgrades.reduce((a, b) => a + b, 0) / subgrades.length;
    }
  }
  
  return null;
}

/**
 * Extract subgrades from Ximilar response
 */
function extractSubgrades(record: any): GemScoreResult['subgrades'] {
  const grades = record.grades || record;
  const subgrades: GemScoreResult['subgrades'] = {};
  
  if (typeof grades.centering === 'number') subgrades.centering = grades.centering;
  if (typeof grades.corners === 'number') subgrades.corners = grades.corners;
  if (typeof grades.edges === 'number') subgrades.edges = grades.edges;
  if (typeof grades.surface === 'number') subgrades.surface = grades.surface;
  
  return Object.keys(subgrades).length > 0 ? subgrades : null;
}

/**
 * Extract confidence from Ximilar response
 */
function extractConfidence(record: any): number {
  // Check various possible locations for confidence/probability
  if (typeof record.confidence === 'number') {
    return clamp(record.confidence, 0, 1);
  }
  if (typeof record.probability === 'number') {
    return clamp(record.probability, 0, 1);
  }
  if (record._objects && record._objects[0]) {
    if (typeof record._objects[0].prob === 'number') {
      return clamp(record._objects[0].prob, 0, 1);
    }
    if (typeof record._objects[0].confidence === 'number') {
      return clamp(record._objects[0].confidence, 0, 1);
    }
  }
  
  // Default confidence if not found
  return 0.65;
}

/**
 * Calculate PSA-10 likelihood based on gem score and confidence
 */
function calculatePSA10Likelihood(gemScore: number, confidence: number): 'High' | 'Medium' | 'Low' {
  if (gemScore >= 90 && confidence >= 0.80) return 'High';
  if (gemScore >= 80 && confidence >= 0.65) return 'Medium';
  return 'Low';
}

/**
 * Get Gem Score for a listing by calling Ximilar API
 */
export async function getGemScore({
  listingId,
  imageUrl,
  title = ''
}: {
  listingId: string;
  imageUrl: string;
  title?: string;
}): Promise<GemScoreResult> {
  // Check if should skip based on title
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
  
  // Check cache first
  const cacheKey = getCacheKey(listingId, imageUrl);
  const cached = scoreCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Verify token is configured
  if (!isGemScoreConfigured()) {
    return {
      listingId,
      gemScore: null,
      psa10Likelihood: 'Low',
      confidence: 0,
      subgrades: null,
      error: 'Ximilar token not configured'
    };
  }
  
  try {
    const response = await fetch('https://api.ximilar.com/card-grader/v2/grade', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${XIMILAR_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{ _url: imageUrl }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the record from response
    const record = data.records?.[0] || data.record || data;
    
    // Extract final grade
    const finalGrade = extractFinalGrade(record);
    
    if (finalGrade === null) {
      const result: GemScoreResult = {
        listingId,
        gemScore: null,
        psa10Likelihood: 'Low',
        confidence: 0,
        subgrades: null,
        error: 'Could not determine grade from response'
      };
      scoreCache.set(cacheKey, result);
      return result;
    }
    
    // Calculate gem score (0-100)
    const gemScore = clamp(Math.round(finalGrade * 10), 0, 100);
    
    // Extract confidence and subgrades
    const confidence = extractConfidence(record);
    const subgrades = extractSubgrades(record);
    
    // Calculate PSA-10 likelihood
    const psa10Likelihood = calculatePSA10Likelihood(gemScore, confidence);
    
    const result: GemScoreResult = {
      listingId,
      gemScore,
      psa10Likelihood,
      confidence,
      subgrades
    };
    
    // Cache the result
    scoreCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Ximilar API error:', error);
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
