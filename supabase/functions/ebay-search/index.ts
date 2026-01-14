import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  page?: number;
  limit?: number;
  sort?: 'best' | 'price_asc' | 'end_soonest' | 'graded' | 'raw';
  includeLots?: boolean;
  buyingOptions?: 'ALL' | 'AUCTION' | 'FIXED_PRICE';
}

interface EbayItem {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  shipping?: { value: string; currency: string };
  condition: string;
  buyingOption: 'AUCTION' | 'FIXED_PRICE' | 'UNKNOWN';
  endDate?: string;
  imageUrl?: string;
  itemUrl?: string;
  seller?: string;
}

const JUNK_KEYWORDS = [
  'box', 'boxes', 'case', 'cases', 'break', 'breaker', 'breakers',
  'lot', 'lots', 'pack', 'packs', 'sealed', 'hobby box',
  'blaster', 'mega', 'complete set', 'set break', 'random', 
  'mystery', 'repack', 'bundle', 'collection', 'bulk', 'mixer',
  'wax', 'cello', 'rack', 'jumbo', 'fat pack', 'hanger'
];

function extractCoreTerm(query: string): string {
  // Remove year patterns, card numbers, special characters
  // Keep the main subject (usually player/character name)
  const cleaned = query
    .replace(/\d{4}/g, '')  // Remove years
    .replace(/#\d+/g, '')   // Remove card numbers
    .replace(/[^\w\s]/g, ' ') // Remove special chars
    .split(/\s+/)
    .filter(term => term.length > 2)
    .slice(0, 2)  // Keep first 2 meaningful words (likely the name)
    .join(' ');
  
  return cleaned.trim() || query;
}

const GRADED_KEYWORDS = ['psa', 'bgs', 'sgc', 'cgc', 'beckett', 'graded'];

function isGradedItem(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return GRADED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

function isJunkTitle(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return JUNK_KEYWORDS.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowerTitle);
  });
}

function extractKeyTerms(query: string): string[] {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'of', 'in', 'for', 'to', 'with'];
  return query
    .toLowerCase()
    .replace(/[#\-]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 1 && !stopWords.includes(term));
}

function titleMatchesQuery(title: string, keyTerms: string[]): boolean {
  if (keyTerms.length === 0) return true;
  const lowerTitle = title.toLowerCase();
  
  // Separate terms into name terms (likely player name) and other terms
  const nameLikeTerms = keyTerms.filter(term => 
    term.length > 2 && !/^\d+$/.test(term) // Not a number
  );
  const otherTerms = keyTerms.filter(term => 
    term.length <= 2 || /^\d+$/.test(term)
  );
  
  // Require at least 70% of name-like terms to match (more flexible)
  const nameMatchCount = nameLikeTerms.filter(term => lowerTitle.includes(term)).length;
  const nameMatchRatio = nameLikeTerms.length === 0 ? 1 : nameMatchCount / nameLikeTerms.length;
  const nameTermsMatch = nameMatchRatio >= 0.7;
  
  // At least 50% of other terms (numbers, short words) should match
  const otherMatchCount = otherTerms.filter(term => lowerTitle.includes(term)).length;
  const otherTermsMatch = otherTerms.length === 0 || otherMatchCount >= Math.ceil(otherTerms.length * 0.5);
  
  return nameTermsMatch && otherTermsMatch;
}

function getSortParam(sort: string): string {
  switch (sort) {
    case 'price_asc':
      return 'price';
    case 'end_soonest':
    case 'raw':
      return 'endingSoonest'; // Raw cards sorted by ending soon
    case 'graded':
      return 'bestMatch'; // Use bestMatch, then filter for graded items
    case 'best':
    default:
      return 'bestMatch';
  }
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

async function searchEbay(
  token: string,
  query: string,
  limit: number,
  offset: number,
  sort: string
): Promise<{ items: any[]; total: number }> {
  const browseBase = Deno.env.get('EBAY_BROWSE_BASE') || 'https://api.ebay.com';
  const marketplaceId = Deno.env.get('EBAY_MARKETPLACE_ID') || 'EBAY_US';

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    offset: offset.toString(),
    sort: sort,
  });

  const url = `${browseBase}/buy/browse/v1/item_summary/search?${params}`;
  
  console.log('Searching eBay:', url);

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
  return {
    items: data.itemSummaries || [],
    total: data.total || 0,
  };
}

function normalizeItem(item: any): EbayItem {
  const buyingOptions = item.buyingOptions || [];
  let buyingOption: 'AUCTION' | 'FIXED_PRICE' | 'UNKNOWN' = 'UNKNOWN';
  
  if (buyingOptions.includes('AUCTION')) {
    buyingOption = 'AUCTION';
  } else if (buyingOptions.includes('FIXED_PRICE')) {
    buyingOption = 'FIXED_PRICE';
  }

  const price = item.price || {};
  const shippingCost = item.shippingOptions?.[0]?.shippingCost;

  return {
    itemId: item.itemId,
    title: item.title,
    price: {
      value: price.value || '0',
      currency: price.currency || 'USD',
    },
    shipping: shippingCost ? {
      value: shippingCost.value || '0',
      currency: shippingCost.currency || 'USD',
    } : undefined,
    condition: item.condition || 'Unknown',
    buyingOption,
    endDate: item.itemEndDate,
    imageUrl: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl,
    itemUrl: item.itemWebUrl,
    seller: item.seller?.username,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SearchRequest = await req.json();
    const {
      query,
      page = 1,
      limit = 24,
      sort = 'best',
      includeLots = false,
      buyingOptions = 'ALL',
    } = body;

    if (!query || query.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clampedLimit = Math.min(Math.max(limit, 1), 50);
    
    // Request more items to compensate for client-side filtering
    const requestLimit = Math.min(clampedLimit * 2, 50);
    
    // IMPORTANT: eBay requires offset to be a multiple of limit
    // So we must calculate offset using requestLimit, not clampedLimit
    const offset = (page - 1) * requestLimit;

    const token = await getEbayToken();
    const sortParam = getSortParam(sort);
    const { items: rawItems, total } = await searchEbay(token, query, requestLimit, offset, sortParam);

    let normalizedItems = rawItems.map(normalizeItem);

    // Filter items that don't match the search query well
    const keyTerms = extractKeyTerms(query);
    normalizedItems = normalizedItems.filter(item => 
      titleMatchesQuery(item.title, keyTerms)
    );

    // ALWAYS filter out junk titles (boxes, lots, packs, etc.) - no exceptions
    normalizedItems = normalizedItems.filter(item => !isJunkTitle(item.title));

    // Apply buying options filter
    if (buyingOptions !== 'ALL') {
      normalizedItems = normalizedItems.filter(item => item.buyingOption === buyingOptions);
    }

    // Filter graded vs raw cards based on sort option
    if (sort === 'graded') {
      // Show only graded cards when "Graded" sort is selected
      normalizedItems = normalizedItems.filter(item => isGradedItem(item.title));
      
      // Fallback: if no graded cards found for exact query, search for similar graded cards
      if (normalizedItems.length === 0) {
        const fallbackQuery = extractCoreTerm(query) + ' graded';
        console.log('No graded cards found, trying fallback query:', fallbackQuery);
        
        const { items: fallbackRaw } = await searchEbay(token, fallbackQuery, clampedLimit, 0, 'bestMatch');
        let fallbackItems = fallbackRaw.map(normalizeItem);
        
        // Apply same filters to fallback results
        fallbackItems = fallbackItems.filter(item => !isJunkTitle(item.title));
        fallbackItems = fallbackItems.filter(item => isGradedItem(item.title));
        
        // Apply buying options filter to fallback results
        if (buyingOptions !== 'ALL') {
          fallbackItems = fallbackItems.filter(item => item.buyingOption === buyingOptions);
        }
        
        normalizedItems = fallbackItems;
      }
    } else if (sort === 'raw') {
      // "Raw Cards - Ending Soon" - explicitly filter for ungraded cards only
      normalizedItems = normalizedItems.filter(item => !isGradedItem(item.title));
    } else {
      // For other sorts (best, price_asc, end_soonest), show only raw/ungraded cards by default
      normalizedItems = normalizedItems.filter(item => !isGradedItem(item.title));
    }
    
    // Limit results to the originally requested amount after all filtering
    normalizedItems = normalizedItems.slice(0, clampedLimit);

    const hasMore = offset + rawItems.length < total;

    return new Response(
      JSON.stringify({
        query,
        page,
        limit: clampedLimit,
        total,
        nextPage: hasMore ? page + 1 : null,
        items: normalizedItems,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
