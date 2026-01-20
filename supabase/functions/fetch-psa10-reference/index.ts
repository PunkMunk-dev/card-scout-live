import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache TTL in days
const CACHE_TTL_DAYS = 30;

/**
 * Extract card identifier from title for searching PSA 10 references
 * Removes common noise words and keeps core card identification
 */
function extractCardIdentifier(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  // Remove common noise words and characters
  const noiseWords = [
    'card', 'cards', 'mint', 'nm', 'near', 'ex', 'excellent', 'good', 'fair', 'poor',
    'raw', 'ungraded', 'base', 'common', 'uncommon', 'rare', 'ultra', 'super',
    'holo', 'holographic', 'foil', 'parallel', 'refractor', 'prizm', 'optic',
    'rc', 'rookie', 'sp', 'ssp', 'insert', 'auto', 'autograph', 'relic', 'patch',
    'numbered', '/10', '/25', '/50', '/75', '/99', '/100', '/199', '/299', '/499',
    'free', 'ship', 'shipping', 'fast', 'look', 'wow', 'hot', 'invest',
    'beautiful', 'nice', 'clean', 'sharp', 'gem', 'potential'
  ];
  
  let cleaned = lowerTitle
    // Remove hashtags and special chars
    .replace(/#\w+/g, '')
    .replace(/[^\w\s]/g, ' ')
    // Remove year patterns at start (keep for searching)
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split and filter noise words
  const words = cleaned.split(' ').filter(word => 
    word.length > 1 && !noiseWords.includes(word) && !/^\d+$/.test(word)
  );
  
  // Take first 6-8 meaningful words for the search
  return words.slice(0, 8).join(' ');
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
 * Get eBay OAuth token
 */
async function getEbayToken(): Promise<string> {
  const clientId = Deno.env.get('EBAY_CLIENT_ID');
  const clientSecret = Deno.env.get('EBAY_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('eBay credentials not configured');
  }
  
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
  });

  if (!response.ok) {
    throw new Error(`eBay auth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Search eBay for PSA 10 examples of the card
 */
async function searchPSA10Examples(
  token: string,
  cardIdentifier: string
): Promise<string[]> {
  const searchQuery = `PSA 10 ${cardIdentifier}`;
  const encodedQuery = encodeURIComponent(searchQuery);
  
  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodedQuery}&limit=10&filter=conditionIds:{2000|2500|3000}&sort=price`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
    }
  });

  if (!response.ok) {
    console.error('eBay search failed:', response.status);
    return [];
  }

  const data = await response.json();
  const items = data.itemSummaries || [];
  
  // Extract high-res image URLs from PSA 10 listings
  const imageUrls: string[] = [];
  
  for (const item of items) {
    const title = (item.title || '').toLowerCase();
    
    // Verify it's actually a PSA 10
    if (title.includes('psa 10') || title.includes('psa10')) {
      if (item.image?.imageUrl) {
        imageUrls.push(getHighResImageUrl(item.image.imageUrl));
      }
      if (item.additionalImages) {
        for (const img of item.additionalImages.slice(0, 2)) {
          if (img.imageUrl) {
            imageUrls.push(getHighResImageUrl(img.imageUrl));
          }
        }
      }
    }
    
    // Limit to 5 reference images
    if (imageUrls.length >= 5) break;
  }
  
  return imageUrls;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, force = false } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Missing title parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cardIdentifier = extractCardIdentifier(title);
    
    if (!cardIdentifier || cardIdentifier.length < 5) {
      return new Response(
        JSON.stringify({ 
          cardIdentifier: null,
          imageUrls: [],
          error: 'Could not extract card identifier from title'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache unless force refresh
    if (!force) {
      const { data: cached } = await supabase
        .from('psa10_references')
        .select('*')
        .eq('card_identifier', cardIdentifier)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached) {
        return new Response(
          JSON.stringify({
            cardIdentifier,
            imageUrls: cached.image_urls,
            searchQuery: cached.search_query,
            cached: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch fresh PSA 10 examples from eBay
    const ebayToken = await getEbayToken();
    const imageUrls = await searchPSA10Examples(ebayToken, cardIdentifier);
    
    const searchQuery = `PSA 10 ${cardIdentifier}`;

    // Cache the results
    if (imageUrls.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);
      
      await supabase.from('psa10_references').upsert({
        card_identifier: cardIdentifier,
        search_query: searchQuery,
        image_urls: imageUrls,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'card_identifier' });
    }

    return new Response(
      JSON.stringify({
        cardIdentifier,
        imageUrls,
        searchQuery,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('fetch-psa10-reference error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        imageUrls: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
