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
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface GradeExtractionResult {
  grade: number | null;
  source: string;
}

/**
 * Extract final grade from Ximilar response with source tracking
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
    
    // If subgrades exist, compute average as fallback
    const subgradeFields = ['centering', 'corners', 'edges', 'surface'];
    const subgrades: number[] = [];
    for (const field of subgradeFields) {
      if (typeof record.grades[field] === 'number') {
        subgrades.push(record.grades[field]);
      }
    }
    if (subgrades.length > 0) {
      return { 
        grade: subgrades.reduce((a, b) => a + b, 0) / subgrades.length,
        source: 'computed_average'
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listingId, imageUrl, title = '', force = false } = await req.json();

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
          cached: false
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
            gradeSource
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
          cached: false
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Ximilar API
    const ximilarResponse = await fetch('https://api.ximilar.com/card-grader/v2/grade', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${ximilarToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{ _url: imageUrl }]
      })
    });

    if (!ximilarResponse.ok) {
      const errorText = await ximilarResponse.text();
      const errorMsg = `Ximilar API error: ${ximilarResponse.status}`;
      
      // Store error in cache
      await supabase.from('gem_scores').upsert({
        listing_id: listingId,
        image_url: imageUrl,
        gem_score: null,
        psa10_likelihood: 'Low',
        confidence: 0,
        subgrades: null,
        error: errorMsg,
        raw_response: { status: ximilarResponse.status, body: errorText }
      }, { onConflict: 'listing_id,image_url' });

      return new Response(
        JSON.stringify({
          listingId,
          gemScore: null,
          psa10Likelihood: 'Low',
          confidence: 0,
          subgrades: null,
          error: errorMsg,
          cached: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await ximilarResponse.json();
    const record = data.records?.[0] || data.record || data;

    // Extract final grade with source tracking
    const { grade: finalGrade, source: gradeSource } = extractFinalGrade(record);

    if (finalGrade === null) {
      const result = {
        listing_id: listingId,
        image_url: imageUrl,
        gem_score: null,
        psa10_likelihood: 'Low',
        confidence: 0,
        subgrades: null,
        error: 'Could not determine grade from response',
        raw_response: data
      };

      await supabase.from('gem_scores').upsert(result, { onConflict: 'listing_id,image_url' });

      return new Response(
        JSON.stringify({
          listingId,
          gemScore: null,
          psa10Likelihood: 'Low',
          confidence: 0,
          subgrades: null,
          error: 'Could not determine grade from response',
          cached: false,
          rawGrade: null,
          gradeSource: 'none'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate scores
    const gemScore = clamp(Math.round(finalGrade * 10), 0, 100);
    const confidence = extractConfidence(record);
    const subgrades = extractSubgrades(record);
    const psa10Likelihood = calculatePSA10Likelihood(gemScore, confidence);

    // Store in cache
    await supabase.from('gem_scores').upsert({
      listing_id: listingId,
      image_url: imageUrl,
      gem_score: gemScore,
      psa10_likelihood: psa10Likelihood,
      confidence,
      subgrades,
      error: null,
      raw_response: data
    }, { onConflict: 'listing_id,image_url' });

    return new Response(
      JSON.stringify({
        listingId,
        gemScore,
        psa10Likelihood,
        confidence,
        subgrades,
        error: null,
        cached: false,
        rawGrade: finalGrade,
        gradeSource
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
        cached: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
