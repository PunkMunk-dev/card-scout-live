import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PopData {
  psa10: number | null;
  total: number | null;
  gemRate: number | null;
}

interface GradedPopResponse {
  query: string;
  popData: PopData | null;
  matchCount: number;
  source: 'graded_lookup';
}

/**
 * Extract PSA population data from listing title and description
 * Same patterns as ebay-search but optimized for graded listings
 */
function extractPopulationFromListing(
  title: string, 
  shortDescription?: string
): { psa10: number; total: number | null } | null {
  const text = `${title} ${shortDescription || ''}`;
  
  // Two-value patterns (most specific)
  const twoValuePatterns = [
    /PSA\s*10\s+Pop[:\s]*(\d{1,5})[,\s]+Total\s+Pop[:\s]*(\d{1,6})/i,
    /\bPOP[:\s]*(\d{1,5})[,\s\/]+Total[:\s]*(\d{1,6})\b/i,
    /\bPOP[:\s]*(\d{1,5})\s+out\s+of\s+(\d{1,6})\b/i,
    /\bPOP[:\s]*(\d{1,5})\s*[\/]\s*(\d{1,6})\b/i,
    /\bPOP[:\s]*(\d{1,5})\s+of\s+(\d{1,6})\b/i,
    /PSA\s*10\s+Pop[:\s]*(\d{1,5})\s*[\/]\s*(\d{1,6})/i,
    /PSA\s*10\s+Pop[:\s]*(\d{1,5})\s+of\s+(\d{1,6})/i,
    /Population[:\s]*(\d{1,5})\s*[\/]\s*(\d{1,6})/i,
    /Population[:\s]*(\d{1,5})\s+of\s+(\d{1,6})/i,
    /Pop\s+Count[:\s]*(\d{1,5})\s*[\/]\s*(\d{1,6})/i,
    /\bPOP[:\s]*(\d{1,5})\s*\(\s*(\d{1,6})\s*total\s*\)/i,
    /PSA\s+Pop[:\s]*(\d{1,5})\s*\(\s*(\d{1,6})\s*total\s*\)/i,
  ];

  for (const pattern of twoValuePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[2]) {
      const psa10 = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (psa10 > 0 && psa10 < 50000 && total > 0 && total < 500000 && psa10 <= total) {
        return { psa10, total };
      }
    }
  }
  
  // Single-value patterns
  const singleValuePatterns = [
    /PSA\s*10\s+Pop[:\s]*(\d{1,5})/i,
    /Pop\s+Count[:\s]*(\d{1,5})/i,
    /Low\s+Pop[:\s]*(\d{1,5})/i,
    /Population[:\s]*(\d{1,5})/i,
    /\bPOP[:\s]*(\d{1,5})\b/i,
  ];

  for (const pattern of singleValuePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1], 10);
      if (count > 0 && count < 50000) {
        return { psa10: count, total: null };
      }
    }
  }

  return null;
}

async function getEbayToken(): Promise<string> {
  const clientId = Deno.env.get('EBAY_CLIENT_ID');
  const clientSecret = Deno.env.get('EBAY_CLIENT_SECRET');
  const oauthBase = Deno.env.get('EBAY_OAUTH_BASE') || 'https://api.ebay.com';

  if (!clientId || !clientSecret) {
    throw new Error('Missing eBay API credentials');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${oauthBase}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('eBay OAuth error:', errorText);
    throw new Error(`Failed to get eBay token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function searchEbayGraded(
  token: string,
  query: string,
  limit: number = 10
): Promise<any[]> {
  const browseBase = Deno.env.get('EBAY_BROWSE_BASE') || 'https://api.ebay.com';
  const marketplaceId = Deno.env.get('EBAY_MARKETPLACE_ID') || 'EBAY_US';

  // Add PSA 10 to query for graded lookup
  const gradedQuery = `${query} PSA 10`;
  
  const params = new URLSearchParams({
    q: gradedQuery,
    limit: limit.toString(),
    offset: '0',
    sort: 'bestMatch',
  });

  const url = `${browseBase}/buy/browse/v1/item_summary/search?${params}`;
  
  console.log('Searching eBay for graded:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('eBay Browse API error:', errorText);
    throw new Error(`eBay search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.itemSummaries || [];
}

/**
 * Build a focused search query from raw listing title
 * Extracts key identifiers: player name, year, product, parallel
 */
function buildGradedQuery(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  // Extract year
  const yearMatch = title.match(/\b(20[0-2][0-9])\b/);
  const year = yearMatch ? yearMatch[1] : '';
  
  // Extract player name (usually first 2-3 words before year or product keywords)
  const productKeywords = ['prizm', 'chrome', 'select', 'optic', 'mosaic', 'bowman', 'topps', 'panini', 'donruss', 'contenders', 'national treasures'];
  const words = title.split(/\s+/);
  
  let nameWords: string[] = [];
  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-z]/g, '');
    // Stop at year, product keywords, or card number
    if (/^\d{4}$/.test(word) || productKeywords.some(pk => lower.includes(pk)) || /^#?\d+$/.test(word)) {
      break;
    }
    if (word.length > 1 && !/^(rc|rookie|auto|psa|bgs|sgc)$/i.test(word)) {
      nameWords.push(word);
    }
    // Limit to first 3 name words
    if (nameWords.length >= 3) break;
  }
  
  const playerName = nameWords.join(' ');
  
  // Extract product (Prizm, Chrome, etc.)
  let product = '';
  for (const pk of productKeywords) {
    if (lowerTitle.includes(pk)) {
      product = pk.charAt(0).toUpperCase() + pk.slice(1);
      break;
    }
  }
  
  // Extract parallel/variant (Silver, Gold, etc.)
  const parallelKeywords = ['silver', 'gold', 'blue', 'red', 'green', 'orange', 'purple', 'pink', 'black', 'white', 'refractor', 'holo', 'shimmer'];
  let parallel = '';
  for (const pk of parallelKeywords) {
    if (lowerTitle.includes(pk)) {
      parallel = pk.charAt(0).toUpperCase() + pk.slice(1);
      break;
    }
  }
  
  // Build query: "Player Name Year Product Parallel"
  const parts = [playerName, year, product, parallel].filter(Boolean);
  const query = parts.join(' ').trim();
  
  console.log(`Built graded query: "${query}" from title: "${title}"`);
  return query || title.split(/\s+/).slice(0, 4).join(' '); // Fallback to first 4 words
}

/**
 * Aggregate population data from multiple listings
 * Takes the most complete (has both psa10 and total) or most common value
 */
function aggregatePopData(popDataArray: Array<{ psa10: number; total: number | null }>): PopData | null {
  if (popDataArray.length === 0) return null;
  
  // Prefer entries with both psa10 and total
  const withTotal = popDataArray.filter(p => p.total !== null);
  
  if (withTotal.length > 0) {
    // Use the one with highest total (most complete data)
    const best = withTotal.reduce((a, b) => (b.total! > a.total!) ? b : a);
    return {
      psa10: best.psa10,
      total: best.total,
      gemRate: best.total ? Math.round((best.psa10 / best.total) * 100) : null,
    };
  }
  
  // Only have psa10 counts - use the most common value
  const counts: Record<number, number> = {};
  for (const p of popDataArray) {
    counts[p.psa10] = (counts[p.psa10] || 0) + 1;
  }
  
  let mostCommon = popDataArray[0].psa10;
  let maxCount = 0;
  for (const [val, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = parseInt(val);
    }
  }
  
  return {
    psa10: mostCommon,
    total: null,
    gemRate: null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, title } = await req.json();
    
    // Use provided query or build from title
    const searchQuery = query || (title ? buildGradedQuery(title) : null);
    
    if (!searchQuery) {
      return new Response(
        JSON.stringify({ error: 'Query or title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = await getEbayToken();
    const items = await searchEbayGraded(token, searchQuery, 10);
    
    // Filter to only PSA 10 items
    const psa10Items = items.filter(item => 
      /\bPSA\s*10\b/i.test(item.title)
    );
    
    console.log(`Found ${psa10Items.length} PSA 10 items for query: ${searchQuery}`);
    
    // Extract pop data from each listing
    const popDataArray: Array<{ psa10: number; total: number | null }> = [];
    for (const item of psa10Items) {
      const popExtracted = extractPopulationFromListing(item.title, item.shortDescription);
      if (popExtracted) {
        popDataArray.push(popExtracted);
        console.log(`Extracted pop from "${item.title}":`, popExtracted);
      }
    }
    
    // Aggregate the results
    const aggregatedPop = aggregatePopData(popDataArray);
    
    const response: GradedPopResponse = {
      query: searchQuery,
      popData: aggregatedPop,
      matchCount: popDataArray.length,
      source: 'graded_lookup',
    };
    
    console.log('Graded pop lookup result:', response);
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Graded pop lookup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
