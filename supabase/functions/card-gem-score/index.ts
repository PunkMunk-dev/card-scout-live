import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keywords that indicate non-single cards (lots, boxes, packs, etc.)
const EXCLUDED_KEYWORDS = [
  'lot', 'lots', 'box', 'pack', 'sealed', 'case',
  'blaster', 'hobby box', 'break', 'bundle', 'set'
];

// Keywords that indicate card is in a holder/slab (affects grading accuracy)
const HOLDER_KEYWORDS = ['slab', 'slabbed', 'case', 'holder', 'one-touch', 'mag', 'magnetic'];

// Cache TTL in days
const CACHE_TTL_DAYS = 14;

/**
 * Check if a listing title indicates a non-single card product
 */
function shouldSkipListing(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Check if a listing title indicates card is in a holder
 */
function isCardInHolder(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return HOLDER_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Transform eBay image URL to high-resolution version (Phase 2)
 * eBay URLs use suffixes like s-l500, s-l1600 for different sizes
 */
function getHighResImageUrl(url: string): string {
  if (!url) return url;
  // Replace common eBay thumbnail sizes with full-size
  return url
    .replace(/s-l\d+\./, 's-l1600.')
    .replace(/s-l\d+_/, 's-l1600_');
}

/**
 * Calculate geometric mean (Phase 3)
 * More accurate than arithmetic mean for grading - penalizes single bad subgrade properly
 */
function geometricMean(values: number[]): number {
  if (values.length === 0) return 0;
  // Use log-based calculation to avoid overflow with large numbers
  const logSum = values.reduce((sum, val) => sum + Math.log(val), 0);
  return Math.exp(logSum / values.length);
}

interface GradeExtractionResult {
  grade: number | null;
  source: string;
}

/**
 * Extract final grade from Ximilar response with source tracking
 * Updated to use geometric mean for computed averages (Phase 3)
 */
function extractFinalGrade(record: any): GradeExtractionResult {
  const possibleFields = ['final', 'final_grade', 'grade', 'best_grade'];
  
  // Check top-level fields
  for (const field of possibleFields) {
    if (typeof record[field] === 'number') {
      return { grade: record[field], source: field };
    }
  }
  
  // Check nested grades object
  if (record.grades && typeof record.grades === 'object') {
    for (const field of possibleFields) {
      if (typeof record.grades[field] === 'number') {
        return { grade: record.grades[field], source: `grades.${field}` };
      }
    }
    
    // If subgrades exist, compute geometric mean as fallback (Phase 3)
    const subgradeFields = ['centering', 'corners', 'edges', 'surface'];
    const subgrades: number[] = [];
    for (const field of subgradeFields) {
      if (typeof record.grades[field] === 'number') {
        subgrades.push(record.grades[field]);
      }
    }
    if (subgrades.length > 0) {
      return { 
        grade: geometricMean(subgrades),
        source: 'computed_geometric_mean'
      };
    }
  }
  
  return { grade: null, source: 'none' };
}

/**
 * Extract subgrades from Ximilar response
 */
function extractSubgrades(record: any): Record<string, number> | null {
  const grades = record.grades || record;
  const subgrades: Record<string, number> = {};
  
  if (typeof grades.centering === 'number') subgrades.centering = grades.centering;
  if (typeof grades.corners === 'number') subgrades.corners = grades.corners;
  if (typeof grades.edges === 'number') subgrades.edges = grades.edges;
  if (typeof grades.surface === 'number') subgrades.surface = grades.surface;
  
  return Object.keys(subgrades).length > 0 ? subgrades : null;
}

/**
 * Extract confidence from Ximilar response
 * Updated to use lower default for uncertainty (Phase 5)
 */
function extractConfidence(record: any): number {
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
  // Lower default confidence when API doesn't provide one (Phase 5)
  return 0.50;
}

/**
 * Calculate PSA-10 likelihood with stricter thresholds (Phase 5)
 */
function calculatePSA10Likelihood(gemScore: number, confidence: number): 'High' | 'Medium' | 'Low' {
  // Stricter thresholds for more accurate predictions
  if (gemScore >= 92 && confidence >= 0.85) return 'High';
  if (gemScore >= 85 && confidence >= 0.70) return 'Medium';
  return 'Low';
}

/**
 * Combine grades from front and back images (Phase 1)
 * Uses 70% front / 30% back weighting as recommended by Ximilar
 */
function combineGrades(
  frontGrade: number,
  backGrade: number | null,
  frontSubgrades: Record<string, number> | null,
  backSubgrades: Record<string, number> | null
): { combinedGrade: number; combinedSubgrades: Record<string, number> | null } {
  if (backGrade === null) {
    return { combinedGrade: frontGrade, combinedSubgrades: frontSubgrades };
  }
  
  const FRONT_WEIGHT = 0.70;
  const BACK_WEIGHT = 0.30;
  
  const combinedGrade = (frontGrade * FRONT_WEIGHT) + (backGrade * BACK_WEIGHT);
  
  let combinedSubgrades: Record<string, number> | null = null;
  if (frontSubgrades) {
    combinedSubgrades = { ...frontSubgrades };
    if (backSubgrades) {
      for (const key of Object.keys(backSubgrades)) {
        if (frontSubgrades[key] !== undefined) {
          combinedSubgrades[key] = (frontSubgrades[key] * FRONT_WEIGHT) + (backSubgrades[key] * BACK_WEIGHT);
        }
      }
    }
  }
  
  return { combinedGrade, combinedSubgrades };
}

/**
 * Call Ximilar API for a single image
 */
async function gradeImage(
  ximilarToken: string,
  imageUrl: string
): Promise<{ grade: number | null; subgrades: Record<string, number> | null; confidence: number; rawResponse: any; source: string }> {
  const highResUrl = getHighResImageUrl(imageUrl);
  
  const response = await fetch('https://api.ximilar.com/card-grader/v2/grade', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${ximilarToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      records: [{ _url: highResUrl }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      grade: null,
      subgrades: null,
      confidence: 0,
      rawResponse: { status: response.status, body: errorText },
      source: 'api_error'
    };
  }

  const data = await response.json();
  const record = data.records?.[0] || data.record || data;
  const { grade, source } = extractFinalGrade(record);
  
  return {
    grade,
    subgrades: extractSubgrades(record),
    confidence: extractConfidence(record),
    rawResponse: data,
    source
  };
}

/**
 * Detect quality warnings (Phase 4)
 */
function detectQualityWarnings(
  title: string,
  imagesAnalyzed: number,
  confidence: number
): string[] {
  const warnings: string[] = [];
  
  if (isCardInHolder(title)) {
    warnings.push('card_in_holder');
  }
  
  if (imagesAnalyzed === 1) {
    warnings.push('single_image');
  }
  
  if (confidence < 0.60) {
    warnings.push('low_confidence');
  }
  
  return warnings;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      listingId, 
      imageUrl, 
      additionalImages = [], 
      title = '', 
      force = false 
    } = await req.json();

    if (!listingId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing listingId or imageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if should skip based on title
    if (shouldSkipListing(title)) {
      return new Response(
        JSON.stringify({
          listingId,
          gemScore: null,
          psa10Likelihood: 'Low',
          confidence: 0,
          subgrades: null,
          error: 'Not a single card listing',
          cached: false,
          qualityWarnings: [],
          imagesAnalyzed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for database writes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache unless force refresh requested
    if (!force) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - CACHE_TTL_DAYS);

      const { data: cached } = await supabase
        .from('gem_scores')
        .select('*')
        .eq('listing_id', listingId)
        .eq('image_url', imageUrl)
        .gte('updated_at', cutoffDate.toISOString())
        .single();

      if (cached) {
        // Extract rawGrade from raw_response if available
        let rawGrade: number | null = null;
        let gradeSource = 'cached';
        if (cached.raw_response && typeof cached.raw_response === 'object') {
          const rawResp = cached.raw_response as any;
          const record = rawResp.records?.[0] || rawResp.record || rawResp;
          const extracted = extractFinalGrade(record);
          rawGrade = extracted.grade;
          gradeSource = extracted.source;
        }
        
        return new Response(
          JSON.stringify({
            listingId: cached.listing_id,
            gemScore: cached.gem_score,
            psa10Likelihood: cached.psa10_likelihood,
            confidence: cached.confidence,
            subgrades: cached.subgrades,
            error: cached.error,
            cached: true,
            rawGrade,
            gradeSource,
            qualityWarnings: [],
            imagesAnalyzed: 1
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get Ximilar API token from secrets
    const ximilarToken = Deno.env.get('XIMILAR_API_TOKEN');
    if (!ximilarToken) {
      return new Response(
        JSON.stringify({ 
          listingId,
          gemScore: null,
          psa10Likelihood: 'Low',
          confidence: 0,
          subgrades: null,
          error: 'Ximilar API token not configured',
          cached: false,
          qualityWarnings: [],
          imagesAnalyzed: 0
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grade front image (primary)
    const frontResult = await gradeImage(ximilarToken, imageUrl);
    
    if (frontResult.grade === null) {
      const errorMsg = 'Could not determine grade from response';
      
      await supabase.from('gem_scores').upsert({
        listing_id: listingId,
        image_url: imageUrl,
        gem_score: null,
        psa10_likelihood: 'Low',
        confidence: 0,
        subgrades: null,
        error: errorMsg,
        raw_response: frontResult.rawResponse
      }, { onConflict: 'listing_id,image_url' });

      return new Response(
        JSON.stringify({
          listingId,
          gemScore: null,
          psa10Likelihood: 'Low',
          confidence: 0,
          subgrades: null,
          error: errorMsg,
          cached: false,
          rawGrade: null,
          gradeSource: 'none',
          qualityWarnings: detectQualityWarnings(title, 1, 0),
          imagesAnalyzed: 1
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grade back image if available (Phase 1: Multi-image support)
    let backResult: { grade: number | null; subgrades: Record<string, number> | null; confidence: number } | null = null;
    let imagesAnalyzed = 1;
    
    if (additionalImages.length > 0) {
      const backImageUrl = additionalImages[0];
      const backGradeResult = await gradeImage(ximilarToken, backImageUrl);
      if (backGradeResult.grade !== null) {
        backResult = backGradeResult;
        imagesAnalyzed = 2;
      }
    }

    // Combine front and back grades
    const { combinedGrade, combinedSubgrades } = combineGrades(
      frontResult.grade,
      backResult?.grade || null,
      frontResult.subgrades,
      backResult?.subgrades || null
    );

    // Average confidence if both images analyzed
    const combinedConfidence = backResult 
      ? (frontResult.confidence + backResult.confidence) / 2
      : frontResult.confidence;

    // Calculate scores
    const gemScore = clamp(Math.round(combinedGrade * 10), 0, 100);
    const psa10Likelihood = calculatePSA10Likelihood(gemScore, combinedConfidence);
    const qualityWarnings = detectQualityWarnings(title, imagesAnalyzed, combinedConfidence);

    // Store in cache
    await supabase.from('gem_scores').upsert({
      listing_id: listingId,
      image_url: imageUrl,
      gem_score: gemScore,
      psa10_likelihood: psa10Likelihood,
      confidence: combinedConfidence,
      subgrades: combinedSubgrades,
      error: null,
      raw_response: frontResult.rawResponse
    }, { onConflict: 'listing_id,image_url' });

    return new Response(
      JSON.stringify({
        listingId,
        gemScore,
        psa10Likelihood,
        confidence: combinedConfidence,
        subgrades: combinedSubgrades,
        error: null,
        cached: false,
        rawGrade: combinedGrade,
        gradeSource: backResult ? 'combined_front_back' : frontResult.source,
        qualityWarnings,
        imagesAnalyzed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        gemScore: null,
        psa10Likelihood: 'Low',
        confidence: 0,
        subgrades: null,
        cached: false,
        qualityWarnings: [],
        imagesAnalyzed: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
