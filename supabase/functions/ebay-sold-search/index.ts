import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  limit?: number;
  includeLots?: boolean;
}

interface EbayItem {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  shipping?: { value: string; currency: string };
  condition: string;
  buyingOption: 'AUCTION' | 'FIXED_PRICE' | 'UNKNOWN';
  imageUrl?: string;
  itemUrl?: string;
  seller?: string;
  isSold: boolean;
  soldPrice: { value: string; currency: string };
  soldDate: string;
}

const JUNK_KEYWORDS = [
  'box', 'boxes', 'case', 'break', 'breaker', 'lot', 'lots', 
  'pack', 'packs', 'sealed', 'hobby box', 'blaster', 'mega', 'complete set'
];

function isJunkTitle(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return JUNK_KEYWORDS.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowerTitle);
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SearchRequest = await req.json();
    const {
      query,
      limit = 50,
      includeLots = false,
    } = body;

    if (!query || query.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    
    if (!rapidApiKey) {
      return new Response(
        JSON.stringify({ error: 'RapidAPI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build excluded keywords if not including lots
    const excludedKeywords = includeLots ? '' : JUNK_KEYWORDS.join(',');

    const params = new URLSearchParams({
      keywords: query,
      max_search_results: Math.min(limit, 100).toString(),
    });

    if (excludedKeywords) {
      params.append('excluded_keywords', excludedKeywords);
    }

    const url = `https://ebay-average-selling-price.p.rapidapi.com/findCompletedItems?${params}`;
    
    console.log('Searching RapidAPI for sold items:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'ebay-average-selling-price.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI error:', errorText);
      throw new Error(`RapidAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('RapidAPI response:', JSON.stringify(data).slice(0, 500));

    // Normalize the response items
    const rawItems = data.results || data.products || [];
    
    let normalizedItems: EbayItem[] = rawItems.map((item: any, index: number) => {
      const soldPrice = item.sale_price || item.sold_price || item.price || '0';
      const soldDate = item.date_sold || item.sold_date || item.end_date || new Date().toISOString();
      
      return {
        itemId: item.item_id || item.id || `sold-${index}`,
        title: item.title || 'Unknown Item',
        price: {
          value: String(soldPrice).replace(/[^0-9.]/g, ''),
          currency: 'USD',
        },
        condition: item.condition || 'Unknown',
        buyingOption: item.listing_type === 'Auction' ? 'AUCTION' : 'FIXED_PRICE',
        imageUrl: item.image_url || item.image || item.thumbnail,
        itemUrl: item.item_url || item.url || item.link,
        seller: item.seller,
        isSold: true,
        soldPrice: {
          value: String(soldPrice).replace(/[^0-9.]/g, ''),
          currency: 'USD',
        },
        soldDate: soldDate,
      };
    });

    // Filter junk titles if not including lots
    if (!includeLots) {
      normalizedItems = normalizedItems.filter(item => !isJunkTitle(item.title));
    }

    // Calculate price statistics
    const prices = normalizedItems.map(item => parseFloat(item.soldPrice.value)).filter(p => !isNaN(p) && p > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : undefined;
    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : undefined;

    return new Response(
      JSON.stringify({
        query,
        total: normalizedItems.length,
        items: normalizedItems,
        averagePrice,
        minPrice,
        maxPrice,
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
