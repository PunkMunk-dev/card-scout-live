import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function getEbayToken(): Promise<string> {
  const clientId = Deno.env.get('EBAY_CLIENT_ID')!;
  const clientSecret = Deno.env.get('EBAY_CLIENT_SECRET')!;
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const resp = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  const data = await resp.json();
  return data.access_token;
}

function cleanCardName(name: string): string {
  return name
    .replace(/\([^)]*\)/g, '')
    .replace(/#[A-Za-z0-9/]+/g, '')
    .replace(/:/g, '')
    .replace(/\b(scarlet|violet|black\s+star|obsidian\s+flames|sword|shield|sun|moon|brilliant\s+stars|astral\s+radiance|paldea\s+evolved|temporal\s+forces|surging\s+sparks|twilight\s+masquerade|shrouded\s+fable|stellar\s+crown|prismatic\s+evolutions|lost\s+origin|silver\s+tempest|crown\s+zenith|mega\s+evolution|phantasmal\s+flames|destined\s+rivals|journey\s+together|black\s+bolt|white\s+flare|paldean\s+fates)\b/gi, '')
    .replace(/\b(promo|promos|base|holo|reverse\s+holo|illustration\s+rare|special\s+illustration\s+rare|ultra\s+rare|hyper\s+rare|secret|full\s+art|trainer\s+gallery|galarian\s+gallery|shiny\s+rare|double\s+rare)\b/gi, '')
    .replace(/\b(elite\s+trainer\s+box|premium\s+collection|ultra-premium\s+collection|pokemon\s+center)\b/gi, '')
    .replace(/\b\d{4}\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface EbayListing {
  itemId: string;
  title: string;
  price: string;
  currency: string;
  imageUrl: string;
  itemUrl: string;
  condition: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cardName } = await req.json();
    if (!cardName) {
      return new Response(JSON.stringify({ error: 'cardName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check cache
    const { data: cached } = await supabase
      .from('roi_ebay_cache')
      .select('listings, fetched_at')
      .eq('card_name', cardName)
      .single();

    if (cached && (Date.now() - new Date(cached.fetched_at).getTime()) < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ listings: cached.listings, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Search eBay
    const token = await getEbayToken();
    const cleaned = cleanCardName(cardName);
    const searchWords = cleaned.split(/\s+/).filter(w => w.length > 1).slice(0, 8);
    const query = searchWords.join(' ');

    const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '8');
    url.searchParams.set('category_ids', '183050'); // Trading cards
    url.searchParams.set('filter', 'conditionIds:{1000|1500|2000|2500|3000|4000|5000}');

    const ebayResp = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' }
    });

    const ebayData = await ebayResp.json();
    const items: EbayListing[] = (ebayData.itemSummaries || []).slice(0, 8).map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      price: item.price?.value || '0',
      currency: item.price?.currency || 'USD',
      imageUrl: item.thumbnailImages?.[0]?.imageUrl || item.image?.imageUrl || '',
      itemUrl: item.itemWebUrl || '',
      condition: item.condition || '',
    }));

    // Upsert cache
    await supabase
      .from('roi_ebay_cache')
      .upsert({
        card_name: cardName,
        listings: items,
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'card_name' });

    return new Response(JSON.stringify({ listings: items, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
