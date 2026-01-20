/**
 * PSA Population Extract Edge Function
 * 
 * Uses Firecrawl EXTRACT endpoint to fetch PSA population data.
 * Caches results with 48hr TTL. Never blocks, fails silently.
 * 
 * Trigger Points (ONLY):
 * - When card detail is opened
 * - When card is added to watchlist
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PopulationResult {
  psa10: number | null;
  total: number | null;
  gem_rate: number | null;
  source: 'firecrawl' | 'fallback';
  cached?: boolean;
}

interface RequestBody {
  card_slug: string;
  psa_url?: string;
}

// Generate a normalized card slug from title
function normalizeCardSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

// Build GemRate.com search URL from card slug
function buildSearchUrl(cardSlug: string): string {
  const searchTerms = cardSlug.replace(/-/g, ' ');
  return `https://www.gemrate.com/search?q=${encodeURIComponent(searchTerms)}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { card_slug, psa_url }: RequestBody = await req.json();

    if (!card_slug) {
      return new Response(
        JSON.stringify({ source: 'fallback', error: 'card_slug is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return new Response(
        JSON.stringify({ source: 'fallback' } as PopulationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('psa_population_cache')
      .select('*')
      .eq('card_slug', card_slug)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached && !cacheError) {
      console.log(`Cache hit for ${card_slug}`);
      return new Response(
        JSON.stringify({
          psa10: cached.psa10_count,
          total: cached.total_count,
          gem_rate: cached.gem_rate,
          source: cached.source || 'firecrawl',
          cached: true,
        } as PopulationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Check Firecrawl API key
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.log('FIRECRAWL_API_KEY not configured - returning fallback');
      return new Response(
        JSON.stringify({ source: 'fallback' } as PopulationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Call Firecrawl EXTRACT endpoint
    const extractUrl = psa_url || buildSearchUrl(card_slug);
    console.log(`Extracting from: ${extractUrl}`);

    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: extractUrl,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Firecrawl API error:', response.status, errorData);
        return new Response(
          JSON.stringify({ source: 'fallback' } as PopulationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.data?.markdown || data.markdown || '';

      if (!content) {
        console.log('No content returned from Firecrawl');
        return new Response(
          JSON.stringify({ source: 'fallback' } as PopulationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 4: Parse PSA population data
      const { psa10, total } = parsePopulationData(content);

      if (psa10 === null || total === null || total === 0) {
        console.log('Could not parse population data');
        return new Response(
          JSON.stringify({ source: 'fallback' } as PopulationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 5: Calculate gem rate (round to 4 decimals)
      const gem_rate = Math.round((psa10 / total) * 10000) / 10000;

      // Step 6: Cache the result with 48hr TTL
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('psa_population_cache')
        .upsert({
          card_slug,
          psa_url: extractUrl,
          psa10_count: psa10,
          total_count: total,
          gem_rate,
          source: 'firecrawl',
          expires_at: expiresAt,
        }, {
          onConflict: 'card_slug',
        });

      console.log(`Cached population data for ${card_slug}: PSA10=${psa10}, Total=${total}, Rate=${gem_rate}`);

      // Step 7: Return normalized result
      return new Response(
        JSON.stringify({
          psa10,
          total,
          gem_rate,
          source: 'firecrawl',
        } as PopulationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (firecrawlError) {
      // Firecrawl failed - return fallback silently
      console.error('Firecrawl request failed:', firecrawlError);
      return new Response(
        JSON.stringify({ source: 'fallback' } as PopulationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    // Any error - return fallback silently, never throw
    console.error('PSA population extract error:', error);
    return new Response(
      JSON.stringify({ source: 'fallback' } as PopulationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Parse PSA population data from scraped content
 * Returns psa10 count and total graded count
 */
function parsePopulationData(content: string): { psa10: number | null; total: number | null } {
  let psa10: number | null = null;
  let total: number | null = null;

  // Pattern 1: Direct PSA 10 count patterns
  const psa10Patterns = [
    /(?:PSA\s*10|GEM[- ]?MT\s*10|10\s*GEM[- ]?MT)[:\s]*(\d{1,6})/i,
    /Grade\s*10[:\s]*(\d{1,6})/i,
    /GEM[- ]?MINT[:\s]*(\d{1,6})/i,
    /\|\s*10\s*\|\s*(\d+)\s*\|/i,
  ];

  // Pattern 2: Total graded patterns  
  const totalPatterns = [
    /Total[:\s]*(\d{1,7})/i,
    /Population[:\s]*(\d{1,7})/i,
    /(?:Total\s+)?Graded[:\s]*(\d{1,7})/i,
    /(?:All\s+)?(?:Grades?|Cards?)[:\s]*(\d{1,7})/i,
  ];

  // Extract PSA 10 count
  for (const pattern of psa10Patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1].replace(/,/g, ''), 10);
      if (count > 0) {
        psa10 = count;
        break;
      }
    }
  }

  // Extract total count
  for (const pattern of totalPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1].replace(/,/g, ''), 10);
      if (count > 0 && (psa10 === null || count >= psa10)) {
        total = count;
        break;
      }
    }
  }

  // If we have PSA 10 but no total, estimate (PSA 10s typically 30-60% of pop)
  if (psa10 !== null && total === null) {
    total = Math.round(psa10 / 0.45);
  }

  return { psa10, total };
}
