import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const QUERY_VERSION = 1;
const CACHE_TTL_MINUTES = 20;
const LOCK_SECONDS = 30;
const MIN_STRICT_RESULTS = 6;
const RESULT_LIMIT = 8;
const EBAY_FETCH_LIMIT = 25;

// ── Module-level token cache ──────────────────────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getEbayToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
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
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
  };
  return data.access_token;
}

// ── SHA-256 hashing ───────────────────────────────────────────────────
async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Query builder ─────────────────────────────────────────────────────
interface ParsedCard {
  nameCore: string;
  setCore: string;
  cardNumber: string;
  variant: string;
}

const RARITY_KEYWORDS = [
  'special illustration rare', 'illustration rare', 'ultra rare', 'hyper rare',
  'secret rare', 'double rare', 'full art', 'holo', 'reverse holo',
  'mega hyper rare', 'super rare', 'shiny rare',
  'alternate full art', 'trainer gallery', 'galarian gallery',
];

function parseCardName(cardName: string): ParsedCard {
  let remaining = cardName.trim();

  // Extract parenthetical content (set info or variant like "(Horizontal)")
  const parens: string[] = [];
  remaining = remaining.replace(/\(([^)]+)\)/g, (_m, p1) => {
    parens.push(p1.trim());
    return '';
  });

  // Extract card number (#xxx or #xxx/yyy)
  let cardNumber = '';
  remaining = remaining.replace(/#([A-Za-z0-9\-/]+)/g, (_m, p1) => {
    if (!cardNumber) cardNumber = p1;
    return '';
  });

  // Remove rarity keywords from remaining (case-insensitive)
  let variant = '';
  const lowerRemaining = remaining.toLowerCase();
  for (const kw of RARITY_KEYWORDS) {
    const idx = lowerRemaining.indexOf(kw);
    if (idx !== -1) {
      variant = remaining.substring(idx, idx + kw.length).trim();
      remaining = remaining.substring(0, idx) + remaining.substring(idx + kw.length);
      break;
    }
  }

  // Clean up whitespace
  remaining = remaining.replace(/\s{2,}/g, ' ').trim();

  // Try to split into nameCore and setCore
  // Pattern: "Name YYYY Product Line" e.g. "Cooper Flagg 2025 Topps Chrome"
  // or "Name YYYY Series: SubSeries" e.g. "Umbreon ex 2025 Scarlet & Violet: Prismatic Evolutions"
  const yearMatch = remaining.match(/^(.+?)\s+((?:19|20)\d{2})\s+(.+)$/);
  let nameCore: string;
  let setCore: string;

  if (yearMatch) {
    nameCore = yearMatch[1].trim();
    const year = yearMatch[2];
    const productLine = yearMatch[3].trim();
    setCore = `${year} ${productLine}`;
  } else {
    // No year pattern — use parenthetical as setCore if available
    nameCore = remaining;
    setCore = parens.length > 0 ? parens[0] : '';
  }

  // Clean up nameCore — remove trailing colons, extra spaces
  nameCore = nameCore.replace(/:$/, '').replace(/\s{2,}/g, ' ').trim();
  // Clean up setCore — remove trailing noise
  setCore = setCore.replace(/\s{2,}/g, ' ').trim();

  // If there's remaining variant info after card number extraction
  // check parens for variant-like info (e.g. "Horizontal")
  if (!variant && parens.length > 0) {
    const nonSetParens = yearMatch ? parens : parens.slice(1);
    if (nonSetParens.length > 0) {
      variant = nonSetParens[0];
    }
  }

  return { nameCore, setCore, cardNumber, variant };
}

function buildEbayQueries(cardName: string): { strictQueryText: string; fallbackQueryText: string; parsed: ParsedCard } {
  const parsed = parseCardName(cardName);
  const { nameCore, setCore, cardNumber } = parsed;

  // Strict: nameCore + setCore + cardNumber (most specific)
  const strictParts = [nameCore, setCore, cardNumber].filter(Boolean);
  const strictQueryText = strictParts.join(' ').replace(/\s{2,}/g, ' ').trim();

  // Fallback: nameCore + setCore only
  const fallbackParts = [nameCore, setCore].filter(Boolean);
  const fallbackQueryText = fallbackParts.join(' ').replace(/\s{2,}/g, ' ').trim();

  return { strictQueryText, fallbackQueryText, parsed };
}

// ── Post-filtering ────────────────────────────────────────────────────
const REJECT_PATTERNS = new RegExp(
  '\\b(' +
  // Graded
  'psa|bgs|sgc|cgc|graded|slab' +
  // Sealed/product
  '|pack|packs|booster|elite trainer box|etb|case|tin|sealed' +
  // Junk
  '|lot|lots|bundle|break|random' +
  // Fake
  '|proxy|reprint|custom' +
  ')\\b', 'i'
);

// "box" as standalone word but not inside card names like "Trainer Box"
const REJECT_BOX = /\bbox\b/i;

interface EbayListing {
  itemId: string;
  title: string;
  price: string;
  currency: string;
  imageUrl: string;
  itemUrl: string;
  condition: string;
}

function filterListings(items: EbayListing[]): EbayListing[] {
  return items.filter(item => {
    if (!item.price || !item.itemUrl || parseFloat(item.price) <= 0) return false;
    const title = item.title;
    if (REJECT_PATTERNS.test(title)) return false;
    // Reject standalone "box" but not if it's part of a card name context
    if (REJECT_BOX.test(title) && !/\b(pokemon center)\b/i.test(title)) return false;
    return true;
  });
}

// ── Ranking ───────────────────────────────────────────────────────────
function scoreItem(item: EbayListing, parsed: ParsedCard): number {
  const lower = item.title.toLowerCase();
  let score = 0;
  if (parsed.nameCore && lower.includes(parsed.nameCore.toLowerCase())) score += 10;
  if (parsed.setCore && lower.includes(parsed.setCore.toLowerCase())) score += 5;
  if (parsed.cardNumber) {
    // Try exact card number match
    if (lower.includes(parsed.cardNumber.toLowerCase())) score += 8;
    // Try numeric-only match (strip leading zeros)
    const numOnly = parsed.cardNumber.replace(/^0+/, '').split('/')[0];
    if (numOnly && lower.includes(`#${numOnly}`)) score += 3;
  }
  return score;
}

function rankAndTake(items: EbayListing[], parsed: ParsedCard, limit: number): EbayListing[] {
  return items
    .map(item => ({ item, score: scoreItem(item, parsed) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return parseFloat(a.item.price) - parseFloat(b.item.price);
    })
    .slice(0, limit)
    .map(x => x.item);
}

// ── eBay search helper ────────────────────────────────────────────────
async function searchEbay(queryText: string, token: string): Promise<EbayListing[]> {
  const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
  url.searchParams.set('q', queryText);
  url.searchParams.set('limit', String(EBAY_FETCH_LIMIT));
  url.searchParams.set('category_ids', '183050');
  url.searchParams.set('filter', 'conditionIds:{1000|1500|2000|2500|3000|4000|5000}');

  const resp = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
  });

  const data = await resp.json();
  return (data.itemSummaries || []).map((item: any) => ({
    itemId: item.itemId,
    title: item.title,
    price: item.price?.value || '0',
    currency: item.price?.currency || 'USD',
    imageUrl: item.thumbnailImages?.[0]?.imageUrl || item.image?.imageUrl || '',
    itemUrl: item.itemWebUrl || '',
    condition: item.condition || '',
  }));
}

// ── Main handler ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cardName } = await req.json();
    if (!cardName) {
      return new Response(JSON.stringify({ error: 'cardName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Build queries
    const { strictQueryText, fallbackQueryText, parsed } = buildEbayQueries(cardName);
    const queryText = strictQueryText;
    const hashInput = `${QUERY_VERSION}|${queryText}|category=183050|limit=${EBAY_FETCH_LIMIT}|conditionIds:1000-5000`;
    const queryHash = await sha256(hashInput);

    // Check cache
    const { data: cached } = await supabase
      .from('roi_ebay_cache')
      .select('listings, expires_at, refreshing_until')
      .eq('query_hash', queryHash)
      .single();

    const now = new Date();

    if (cached) {
      const expiresAt = new Date(cached.expires_at);
      if (expiresAt > now) {
        return new Response(JSON.stringify({
          listings: cached.listings, cached: true, queryText, queryHash,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Expired — check thundering herd lock
      if (cached.refreshing_until && new Date(cached.refreshing_until) > now) {
        return new Response(JSON.stringify({
          listings: cached.listings, cached: true, stale: true, queryText, queryHash,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Set lock
      await supabase
        .from('roi_ebay_cache')
        .update({ refreshing_until: new Date(now.getTime() + LOCK_SECONDS * 1000).toISOString() })
        .eq('query_hash', queryHash);
    }

    // Fetch from eBay
    const token = await getEbayToken();

    // Strict search
    let rawItems = await searchEbay(strictQueryText, token);
    let filtered = filterListings(rawItems);
    let ranked = rankAndTake(filtered, parsed, RESULT_LIMIT);

    // Fallback if strict < MIN_STRICT_RESULTS
    if (ranked.length < MIN_STRICT_RESULTS && fallbackQueryText !== strictQueryText) {
      const fallbackRaw = await searchEbay(fallbackQueryText, token);
      const fallbackFiltered = filterListings(fallbackRaw);
      // Merge, dedupe by itemId
      const seenIds = new Set(ranked.map(r => r.itemId));
      for (const item of fallbackFiltered) {
        if (!seenIds.has(item.itemId)) {
          ranked.push(item);
          seenIds.add(item.itemId);
        }
      }
      ranked = rankAndTake(ranked, parsed, RESULT_LIMIT);
    }

    // Upsert cache
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    await supabase
      .from('roi_ebay_cache')
      .upsert({
        query_hash: queryHash,
        query_text: queryText,
        query_version: QUERY_VERSION,
        card_name: cardName,
        listings: ranked,
        fetched_at: now.toISOString(),
        expires_at: expiresAt,
        refreshing_until: null,
      }, { onConflict: 'query_hash' });

    return new Response(JSON.stringify({
      listings: ranked, cached: false, queryText, queryHash,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
