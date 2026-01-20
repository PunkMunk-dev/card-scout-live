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

// Keywords that indicate professionally graded cards
const GRADED_KEYWORDS = ['psa', 'bgs', 'sgc', 'cgc', 'hga', 'csg', 'ksa', 'gem mint', 'gem-mint'];

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
 * Check if a listing is a professionally graded card
 */
function isGradedCard(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return GRADED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Extract grade from title for already-graded cards
 */
function extractGradeFromTitle(title: string): { company: string; grade: number; gemScore: number } | null {
  const patterns = [
    // "PSA 10", "BGS 9.5", "SGC 10"
    /\b(psa|bgs|sgc|cgc|hga|csg|ksa)\s*(\d+(?:\.\d+)?)\b/i,
    // "PSA GEM MINT 10"
    /\b(psa|bgs|sgc|cgc|hga|csg|ksa)\s*gem\s*mint\s*(\d+(?:\.\d+)?)\b/i,
    // "PSA10", "BGS9.5" (no space)
    /\b(psa|bgs|sgc|cgc|hga|csg|ksa)(\d+(?:\.\d+)?)\b/i,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const company = match[1].toUpperCase();
      const grade = parseFloat(match[2]);
      
      // Validate grade range (1-10)
      if (grade >= 1 && grade <= 10) {
        // Convert to Gem Score (0-100 scale)
        const gemScore = Math.round(grade * 10);
        return { company, grade, gemScore };
      }
    }
  }
  
  return null;
}

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Transform eBay image URL to high-resolution version
 */
function getHighResImageUrl(url: string): string {
  if (!url) return url;
  return url
    .replace(/s-l\d+\./, 's-l1600.')
    .replace(/s-l\d+_/, 's-l1600_');
}

/**
 * Calculate geometric mean
 */
function geometricMean(values: number[]): number {
  if (values.length === 0) return 0;
  const logSum = values.reduce((sum, val) => sum + Math.log(val), 0);
  return Math.exp(logSum / values.length);
}

interface GradeExtractionResult {
  grade: number | null;
  source: string;
}

/**
 * Extract final grade from Ximilar response
 */
function extractFinalGrade(record: any): GradeExtractionResult {
  const possibleFields = ['final', 'final_grade', 'grade', 'best_grade', 'overall_grade'];
  
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
  
  // Check _objects array (common Ximilar format)
  if (record._objects && Array.isArray(record._objects)) {
    for (const obj of record._objects) {
      for (const field of possibleFields) {
        if (typeof obj[field] === 'number') {
          return { grade: obj[field], source: `_objects.${field}` };
        }
      }
      // Check nested grades in _objects
      if (obj.grades && typeof obj.grades === 'object') {
        for (const field of possibleFields) {
          if (typeof obj.grades[field] === 'number') {
            return { grade: obj.grades[field], source: `_objects.grades.${field}` };
          }
        }
      }
    }
  }
  
  // Log for debugging
  console.log('Grade extraction failed - response keys:', Object.keys(record));
  
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
  return 0.50;
}

/**
 * Calculate PSA-10 likelihood
 */
function calculatePSA10Likelihood(gemScore: number, confidence: number): 'High' | 'Medium' | 'Low' {
  if (gemScore >= 92 && confidence >= 0.85) return 'High';
  if (gemScore >= 85 && confidence >= 0.70) return 'Medium';
  return 'Low';
}

/**
 * Combine grades from front and back images
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
 * Fetch PSA 10 reference images for comparison
 */
async function fetchPSA10References(
  supabaseUrl: string,
  title: string
): Promise<string[]> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-psa10-reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    
    if (!response.ok) {
      console.error('Failed to fetch PSA 10 references:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.imageUrls || [];
  } catch (error) {
    console.error('Error fetching PSA 10 references:', error);
    return [];
  }
}

interface ComparisonResult {
  centeringMatch: number;
  cornersMatch: number;
  edgesMatch: number;
  surfaceMatch: number;
  defectsFound: string[];
  psa10Probability: number;
  reasoning: string;
}

/**
 * Compare raw card to PSA 10 references using Gemini Vision
 */
async function compareToReferences(
  rawCardUrl: string,
  referenceUrls: string[],
  lovableApiKey: string
): Promise<ComparisonResult | null> {
  if (referenceUrls.length === 0) return null;
  
  const referenceUrl = referenceUrls[0]; // Use first reference for comparison
  
  const comparisonPrompt = `You are an expert sports card grader with 20+ years of experience. Compare the FIRST image (an ungraded raw card) against the SECOND image (a PSA 10 Gem Mint example of a similar card).

Analyze these specific aspects and rate 1-10 how closely the raw card matches the PSA 10 standard:

1. CENTERING: Is the raw card as well-centered as the PSA 10? Note any left/right or top/bottom shifts.
2. CORNERS: Are corners as sharp as the PSA 10? Note any softness, whitening, or damage.
3. EDGES: Are edges as clean as the PSA 10? Note any chipping, wear, or roughness.
4. SURFACE: Is the surface as pristine as the PSA 10? Note scratches, print lines, staining, fingerprints.

Be critical and specific. A 10 means perfect match to PSA 10 standard. 8-9 means minor issues. 6-7 means noticeable issues. Below 6 means significant problems.

List specific defects that would prevent a PSA 10 grade.
Estimate the percentage likelihood (0-100) this card would receive a PSA 10 if submitted.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: comparisonPrompt },
            { type: "image_url", image_url: { url: getHighResImageUrl(rawCardUrl) } },
            { type: "image_url", image_url: { url: referenceUrl } }
          ]
        }],
        tools: [{
          type: "function",
          function: {
            name: "grade_comparison",
            description: "Return the grading comparison result with scores and defects",
            parameters: {
              type: "object",
              properties: {
                centering_match: { type: "number", minimum: 1, maximum: 10, description: "How well centering matches PSA 10 (1-10)" },
                corners_match: { type: "number", minimum: 1, maximum: 10, description: "How well corners match PSA 10 (1-10)" },
                edges_match: { type: "number", minimum: 1, maximum: 10, description: "How well edges match PSA 10 (1-10)" },
                surface_match: { type: "number", minimum: 1, maximum: 10, description: "How well surface matches PSA 10 (1-10)" },
                defects_found: { type: "array", items: { type: "string" }, description: "List of specific defects found" },
                psa10_likelihood_percent: { type: "number", minimum: 0, maximum: 100, description: "Estimated percentage chance of PSA 10 grade" },
                reasoning: { type: "string", description: "Brief explanation of the analysis" }
              },
              required: ["centering_match", "corners_match", "edges_match", "surface_match", "defects_found", "psa10_likelihood_percent", "reasoning"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "grade_comparison" } }
      }),
    });

    if (!response.ok) {
      console.error('Gemini Vision comparison failed:', response.status);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return {
        centeringMatch: clamp(args.centering_match || 5, 1, 10),
        cornersMatch: clamp(args.corners_match || 5, 1, 10),
        edgesMatch: clamp(args.edges_match || 5, 1, 10),
        surfaceMatch: clamp(args.surface_match || 5, 1, 10),
        defectsFound: args.defects_found || [],
        psa10Probability: clamp(args.psa10_likelihood_percent || 50, 0, 100),
        reasoning: args.reasoning || ''
      };
    }
    
    return null;
  } catch (error) {
    console.error('Gemini Vision comparison error:', error);
    return null;
  }
}

/**
 * Calculate hybrid score combining Ximilar and Vision comparison
 */
function calculateHybridScore(
  ximilarGrade: number | null,
  ximilarConfidence: number,
  comparisonResult: ComparisonResult | null
): { hybridScore: number; hybridConfidence: number; analysisMethod: string } {
  // If Ximilar failed but we have Vision comparison, use Vision-only
  if (ximilarGrade === null && comparisonResult) {
    const visionScore = geometricMean([
      comparisonResult.centeringMatch,
      comparisonResult.cornersMatch,
      comparisonResult.edgesMatch,
      comparisonResult.surfaceMatch
    ]);
    return {
      hybridScore: clamp(Math.round(visionScore * 10), 0, 100),
      hybridConfidence: clamp(comparisonResult.psa10Probability / 100, 0, 1),
      analysisMethod: 'vision_only'
    };
  }
  
  // If no Ximilar and no Vision, return null-equivalent
  if (ximilarGrade === null) {
    return {
      hybridScore: 0,
      hybridConfidence: 0,
      analysisMethod: 'failed'
    };
  }
  
  if (!comparisonResult) {
    return {
      hybridScore: Math.round(ximilarGrade * 10),
      hybridConfidence: ximilarConfidence,
      analysisMethod: 'ximilar_only'
    };
  }
  
  // Vision comparison score from geometric mean of subgrades
  const visionScore = geometricMean([
    comparisonResult.centeringMatch,
    comparisonResult.cornersMatch,
    comparisonResult.edgesMatch,
    comparisonResult.surfaceMatch
  ]);
  
  // Weight: 40% Ximilar (technical), 60% Vision comparison (contextual)
  const XIMILAR_WEIGHT = 0.40;
  const VISION_WEIGHT = 0.60;
  
  const hybridGrade = (ximilarGrade * XIMILAR_WEIGHT) + (visionScore * VISION_WEIGHT);
  const hybridScore = clamp(Math.round(hybridGrade * 10), 0, 100);
  
  // Boost confidence if both methods agree
  const ximilarScoreNormalized = ximilarGrade / 10;
  const visionScoreNormalized = visionScore / 10;
  const agreement = 1 - Math.abs(ximilarScoreNormalized - visionScoreNormalized);
  const hybridConfidence = clamp((ximilarConfidence + (comparisonResult.psa10Probability / 100)) / 2 * (0.8 + 0.2 * agreement), 0, 1);
  
  return {
    hybridScore,
    hybridConfidence,
    analysisMethod: 'hybrid'
  };
}

/**
 * Vision-only grading using Gemini to compare against PSA 10 references
 */
async function gradeWithVisionOnly(
  rawCardUrl: string,
  lovableApiKey: string
): Promise<{ grade: number | null; subgrades: Record<string, number> | null; confidence: number; reasoning: string }> {
  const prompt = `You are an expert sports card grader with 20+ years of experience grading raw cards for PSA, BGS, and SGC.

Analyze this ungraded raw trading card image and estimate its likely PSA grade (1-10 scale).

Evaluate these four key areas and rate each 1-10:
1. CENTERING: How well-centered is the card? Look for left/right and top/bottom alignment.
2. CORNERS: How sharp are the corners? Look for wear, softness, or damage.
3. EDGES: How clean are the edges? Look for chips, whitening, or roughness.
4. SURFACE: How pristine is the surface? Look for scratches, print lines, creases, stains.

Be critical and specific. A 10 means PSA Gem Mint quality. 8-9 is excellent with minor issues. 6-7 has noticeable issues.

Consider:
- Image quality may limit accuracy
- Cards in holders/sleeves are harder to assess
- This is an estimate, not a guaranteed grade`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: getHighResImageUrl(rawCardUrl) } }
          ]
        }],
        tools: [{
          type: "function",
          function: {
            name: "grade_card",
            description: "Return the card grading analysis with scores",
            parameters: {
              type: "object",
              properties: {
                centering: { type: "number", minimum: 1, maximum: 10, description: "Centering grade 1-10" },
                corners: { type: "number", minimum: 1, maximum: 10, description: "Corners grade 1-10" },
                edges: { type: "number", minimum: 1, maximum: 10, description: "Edges grade 1-10" },
                surface: { type: "number", minimum: 1, maximum: 10, description: "Surface grade 1-10" },
                overall_grade: { type: "number", minimum: 1, maximum: 10, description: "Estimated overall PSA grade" },
                confidence_percent: { type: "number", minimum: 0, maximum: 100, description: "Confidence in this assessment" },
                reasoning: { type: "string", description: "Brief explanation of the analysis" }
              },
              required: ["centering", "corners", "edges", "surface", "overall_grade", "confidence_percent", "reasoning"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "grade_card" } }
      }),
    });

    if (!response.ok) {
      console.error('Vision-only grading failed:', response.status);
      return { grade: null, subgrades: null, confidence: 0, reasoning: 'Vision grading failed' };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return {
        grade: clamp(args.overall_grade || 5, 1, 10),
        subgrades: {
          centering: clamp(args.centering || 5, 1, 10),
          corners: clamp(args.corners || 5, 1, 10),
          edges: clamp(args.edges || 5, 1, 10),
          surface: clamp(args.surface || 5, 1, 10)
        },
        confidence: clamp((args.confidence_percent || 50) / 100, 0, 1),
        reasoning: args.reasoning || ''
      };
    }
    
    return { grade: null, subgrades: null, confidence: 0, reasoning: 'Failed to parse response' };
  } catch (error) {
    console.error('Vision-only grading error:', error);
    return { grade: null, subgrades: null, confidence: 0, reasoning: String(error) };
  }
}

/**
 * Detect quality warnings
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
          imagesAnalyzed: 0,
          analysisMethod: 'skipped'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already graded - extract certified grade from title
    if (isGradedCard(title)) {
      const extractedGrade = extractGradeFromTitle(title);
      if (extractedGrade) {
        return new Response(
          JSON.stringify({
            listingId,
            gemScore: extractedGrade.gemScore,
            psa10Likelihood: extractedGrade.grade >= 10 ? 'Certified' : (extractedGrade.grade >= 9 ? 'High' : 'Medium'),
            confidence: 1.0,
            subgrades: null,
            error: null,
            cached: false,
            rawGrade: extractedGrade.grade,
            gradeSource: 'title_extraction',
            certifiedGrade: {
              company: extractedGrade.company,
              grade: extractedGrade.grade
            },
            qualityWarnings: [],
            imagesAnalyzed: 0,
            analysisMethod: 'certified_extraction'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache unless force refresh
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
            imagesAnalyzed: 1,
            analysisMethod: 'cached'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const ximilarToken = Deno.env.get('XIMILAR_API_TOKEN');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    let ximilarAvailable = !!ximilarToken;
    let frontResult: { grade: number | null; subgrades: Record<string, number> | null; confidence: number; rawResponse: any; source: string } | null = null;
    let ximilarError: string | null = null;
    
    // Try Ximilar first if token is configured
    if (ximilarAvailable) {
      frontResult = await gradeImage(ximilarToken!, imageUrl);
      
      // Check if Ximilar returned an API error (401, 403, etc.)
      if (frontResult.source === 'api_error') {
        const status = frontResult.rawResponse?.status;
        if (status === 401 || status === 403) {
          console.warn('Ximilar API authentication failed, falling back to Vision-only grading');
          ximilarError = `Ximilar API error: ${status}`;
          ximilarAvailable = false;
          frontResult = null;
        }
      }
      
      // If Ximilar returned no grade, log and continue to fallback
      if (frontResult && frontResult.grade === null && frontResult.source !== 'api_error') {
        console.error('Ximilar grade extraction failed:', {
          listingId,
          imageUrl,
          rawResponse: JSON.stringify(frontResult.rawResponse, null, 2)
        });
        ximilarError = 'Could not extract grade from Ximilar response';
        ximilarAvailable = false;
      }
    }
    
    // FALLBACK: If Ximilar failed/unavailable, try Vision-only grading
    if (!ximilarAvailable && lovableApiKey) {
      console.log('Using Vision-only fallback grading for:', listingId);
      
      const visionResult = await gradeWithVisionOnly(imageUrl, lovableApiKey);
      
      if (visionResult.grade !== null) {
        const gemScore = clamp(Math.round(visionResult.grade * 10), 0, 100);
        const psa10Likelihood = calculatePSA10Likelihood(gemScore, visionResult.confidence);
        const qualityWarnings = detectQualityWarnings(title, 1, visionResult.confidence);
        qualityWarnings.push('ximilar_unavailable');
        
        // Cache the vision-only result
        await supabase.from('gem_scores').upsert({
          listing_id: listingId,
          image_url: imageUrl,
          gem_score: gemScore,
          psa10_likelihood: psa10Likelihood,
          confidence: visionResult.confidence,
          subgrades: visionResult.subgrades,
          error: null,
          raw_response: { vision_only: true, reasoning: visionResult.reasoning }
        }, { onConflict: 'listing_id,image_url' });
        
        return new Response(
          JSON.stringify({
            listingId,
            gemScore,
            psa10Likelihood,
            confidence: visionResult.confidence,
            subgrades: visionResult.subgrades,
            error: null,
            cached: false,
            rawGrade: visionResult.grade,
            gradeSource: 'vision_only',
            qualityWarnings,
            imagesAnalyzed: 1,
            analysisMethod: 'vision_only',
            visionReasoning: visionResult.reasoning
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Vision also failed - return error
      const errorMsg = ximilarError || 'Both Ximilar and Vision grading failed';
      return new Response(
        JSON.stringify({
          listingId,
          gemScore: null,
          psa10Likelihood: 'Low',
          confidence: 0,
          subgrades: null,
          error: errorMsg,
          cached: false,
          qualityWarnings: ['grading_unavailable'],
          imagesAnalyzed: 0,
          analysisMethod: 'failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If no Ximilar and no Lovable API key, we can't grade
    if (!ximilarAvailable && !lovableApiKey) {
      return new Response(
        JSON.stringify({ 
          listingId,
          gemScore: null,
          psa10Likelihood: 'Low',
          confidence: 0,
          subgrades: null,
          error: 'No grading service available',
          cached: false,
          qualityWarnings: ['grading_unavailable'],
          imagesAnalyzed: 0,
          analysisMethod: 'failed'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // At this point, Ximilar worked - continue with hybrid grading
    if (!frontResult || frontResult.grade === null) {
      // Shouldn't reach here, but safety check
      return new Response(
        JSON.stringify({
          listingId,
          gemScore: null,
          psa10Likelihood: 'Low',
          confidence: 0,
          subgrades: null,
          error: 'Unexpected grading state',
          cached: false,
          qualityWarnings: [],
          imagesAnalyzed: 0,
          analysisMethod: 'failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grade back image if available
    let backResult: { grade: number | null; subgrades: Record<string, number> | null; confidence: number } | null = null;
    let imagesAnalyzed = 1;
    
    if (additionalImages.length > 0 && ximilarToken) {
      const backImageUrl = additionalImages[0];
      const backGradeResult = await gradeImage(ximilarToken, backImageUrl);
      if (backGradeResult.grade !== null) {
        backResult = backGradeResult;
        imagesAnalyzed = 2;
      }
    }

    // Combine front and back Ximilar grades
    const { combinedGrade, combinedSubgrades } = combineGrades(
      frontResult.grade,
      backResult?.grade || null,
      frontResult.subgrades,
      backResult?.subgrades || null
    );

    const combinedXimilarConfidence = backResult 
      ? (frontResult.confidence + backResult.confidence) / 2
      : frontResult.confidence;

    // Fetch PSA 10 references and compare using Gemini Vision
    let comparisonResult: ComparisonResult | null = null;
    let referenceImagesUsed = 0;
    
    if (lovableApiKey && title) {
      const referenceUrls = await fetchPSA10References(supabaseUrl, title);
      referenceImagesUsed = referenceUrls.length;
      
      if (referenceUrls.length > 0) {
        comparisonResult = await compareToReferences(imageUrl, referenceUrls, lovableApiKey);
      }
    }

    // Calculate hybrid score
    const { hybridScore, hybridConfidence, analysisMethod } = calculateHybridScore(
      combinedGrade,
      combinedXimilarConfidence,
      comparisonResult
    );

    const psa10Likelihood = calculatePSA10Likelihood(hybridScore, hybridConfidence);
    const qualityWarnings = detectQualityWarnings(title, imagesAnalyzed, hybridConfidence);
    
    // Add warning if no references were found
    if (referenceImagesUsed === 0 && lovableApiKey) {
      qualityWarnings.push('no_psa10_reference');
    }

    // Store in cache
    await supabase.from('gem_scores').upsert({
      listing_id: listingId,
      image_url: imageUrl,
      gem_score: hybridScore,
      psa10_likelihood: psa10Likelihood,
      confidence: hybridConfidence,
      subgrades: combinedSubgrades,
      error: null,
      raw_response: frontResult.rawResponse
    }, { onConflict: 'listing_id,image_url' });

    return new Response(
      JSON.stringify({
        listingId,
        gemScore: hybridScore,
        psa10Likelihood,
        confidence: hybridConfidence,
        subgrades: combinedSubgrades,
        error: null,
        cached: false,
        rawGrade: combinedGrade,
        gradeSource: backResult ? 'combined_front_back' : frontResult.source,
        qualityWarnings,
        imagesAnalyzed,
        analysisMethod,
        comparisonResult,
        referenceImagesUsed
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
