import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;
const EBAY_FETCH_LIMIT = 20;
const FRESH_MINUTES = 15;
const MIN_PROFIT = 20;

// ── eBay token cache ──────────────────────────────────────────────────
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

// ── Card name parsing ─────────────────────────────────────────────────
interface ParsedCard {
  nameCore: string;
  setCore: string;
  cardNumber: string;
  variant: string;
  baseBrand: string;
}

const RARITY_KEYWORDS = [
  'special illustration rare', 'illustration rare', 'ultra rare', 'hyper rare',
  'secret rare', 'double rare', 'full art', 'holo', 'reverse holo',
  'mega hyper rare', 'super rare', 'shiny rare',
  'alternate full art', 'trainer gallery', 'galarian gallery',
];

const INSERT_KEYWORDS = [
  'kaboom', 'downtown', 'helix', 'all kings', 'rookie autographs',
  'negative refractor', 'mojo refractor', 'cracked ice', 'gold vinyl',
  'shimmer', 'wave', 'scope', 'hyper', 'lazer', 'laser',
  'astro', 'cosmic', 'galactic', 'nebula', 'nova',
  'rated rookie', 'opti-chrome', 'pink velocity', 'red wave',
  'blue velocity', 'green velocity', 'gold wave', 'silver wave',
  'no huddle', 'press proof', 'disco', 'asia', 'genesis',
  'photon', 'concourse', 'velocity', 'fractal', 'mojo',
  'prizm', 'silver prizm', 'green prizm', 'blue prizm', 'red prizm',
  'gold prizm', 'black prizm', 'camo prizm', 'pink prizm',
  'snakeskin prizm', 'tiger prizm', 'leopard prizm',
  'fast break', 'neon green', 'neon orange', 'neon pink',
];

function parseCardName(cardName: string): ParsedCard {
  let remaining = cardName.trim();
  const parens: string[] = [];
  remaining = remaining.replace(/\(([^)]+)\)/g, (_m, p1) => {
    parens.push(p1.trim());
    return '';
  });

  let cardNumber = '';
  remaining = remaining.replace(/#([A-Za-z0-9\-/]+)/g, (_m, p1) => {
    if (!cardNumber) cardNumber = p1;
    return '';
  });

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

  remaining = remaining.replace(/\s{2,}/g, ' ').trim();

  const yearMatch = remaining.match(/^(.+?)\s+((?:19|20)\d{2})\s+(.+)$/);
  let nameCore: string;
  let setCore: string;

  if (yearMatch) {
    nameCore = yearMatch[1].trim();
    setCore = `${yearMatch[2]} ${yearMatch[3].trim()}`;
  } else {
    nameCore = remaining;
    setCore = parens.length > 0 ? parens[0] : '';
  }

  nameCore = nameCore.replace(/:$/, '').replace(/\s{2,}/g, ' ').trim();
  setCore = setCore.replace(/\s{2,}/g, ' ').trim();

  if (!variant && parens.length > 0) {
    const nonSetParens = yearMatch ? parens : parens.slice(1);
    if (nonSetParens.length > 0) variant = nonSetParens[0];
  }

  let baseBrand = setCore;
  const lowerSet = setCore.toLowerCase();
  for (const kw of INSERT_KEYWORDS) {
    const idx = lowerSet.indexOf(kw);
    if (idx !== -1) {
      if (!variant) variant = setCore.substring(idx, idx + kw.length).trim();
      baseBrand = (setCore.substring(0, idx) + setCore.substring(idx + kw.length)).trim();
      break;
    }
  }
  baseBrand = baseBrand.replace(/[!?]/g, '').replace(/\s{2,}/g, ' ').replace(/[:\-]$/, '').trim();

  return { nameCore, setCore, cardNumber, variant, baseBrand };
}

function buildBroadQuery(cardName: string): string {
  const { nameCore, baseBrand } = parseCardName(cardName);
  return [nameCore, baseBrand].filter(Boolean).join(' ').replace(/\s{2,}/g, ' ').trim();
}

// ── Post-filtering ────────────────────────────────────────────────────
const REJECT_PATTERNS = new RegExp(
  '\\b(' +
  'psa|bgs|sgc|cgc|graded|slab' +
  '|pack|packs|booster|elite trainer box|etb|case|tin|sealed' +
  '|lot|lots|bundle|break|random' +
  '|proxy|reprint|custom' +
  ')\\b', 'i'
);
const REJECT_BOX = /\bbox\b/i;

interface AuctionItem {
  itemId: string;
  title: string;
  currentBid: number;
  shipping: number;
  endTime: string | null;
  itemUrl: string;
  imageUrl: string;
}

function filterAndMapAuctions(items: any[]): AuctionItem[] {
  return items
    .filter((item: any) => {
      const title = item.title || '';
      if (REJECT_PATTERNS.test(title)) return false;
      if (REJECT_BOX.test(title) && !/\b(pokemon center)\b/i.test(title)) return false;
      return true;
    })
    .map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      currentBid: parseFloat(item.currentBidPrice?.value || item.price?.value || '0'),
      shipping: parseFloat(item.shippingOptions?.[0]?.shippingCost?.value || '0'),
      endTime: item.itemEndDate || null,
      itemUrl: item.itemWebUrl || '',
      imageUrl: item.thumbnailImages?.[0]?.imageUrl || item.image?.imageUrl || '',
    }));
}

// ── Title-match validation ────────────────────────────────────────────
function titleMatchesCard(title: string, parsed: ParsedCard): boolean {
  const lowerTitle = title.toLowerCase();
  // Must contain the player/character name (all words from nameCore)
  const nameWords = parsed.nameCore.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const nameMatched = nameWords.length > 0 && nameWords.every(w => lowerTitle.includes(w));
  if (!nameMatched) return false;

  // Bonus: check for at least one brand/set token match (relaxed — not required)
  // This is enough — the name match ensures it's the right card
  return true;
}

// ── eBay auction search ───────────────────────────────────────────────
async function searchEbayAuctions(queryText: string, token: string): Promise<AuctionItem[]> {
  const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
  url.searchParams.set('q', queryText);
  url.searchParams.set('limit', String(EBAY_FETCH_LIMIT));
  url.searchParams.set('filter', 'buyingOptions:{AUCTION},conditionIds:{1000|1500|2000|2500|3000|4000|5000}');

  const resp = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[EBAY] ${resp.status} for query="${queryText}": ${errText.slice(0, 200)}`);
    return [];
  }
  const data = await resp.json();
  return filterAndMapAuctions(data.itemSummaries || []);
}

// ── Helpers ───────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Main handler ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const limit = typeof body?.limit === 'number' ? body.limit : 0;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Fetch high-value ROI cards (paginated)
    const allCards: { id: string; card_name: string }[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('roi_cards')
        .select('id, card_name')
        .gt('psa10_profit', MIN_PROFIT)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allCards.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // 2. Get recently-scanned card IDs to skip
    const cutoff = new Date(Date.now() - FRESH_MINUTES * 60_000).toISOString();
    const { data: freshRows } = await supabase
      .from('roi_live_auctions')
      .select('roi_card_id')
      .gte('last_seen_at', cutoff);

    const freshCardIds = new Set((freshRows || []).map((r: any) => r.roi_card_id));
    const cardsToScan = allCards.filter(c => !freshCardIds.has(c.id));
    const toProcess = limit > 0 ? cardsToScan.slice(0, limit) : cardsToScan;

    console.log(`[SCANNER] total_eligible=${allCards.length} fresh_skip=${freshCardIds.size} to_scan=${toProcess.length}`);

    // 3. Get eBay token
    const token = await getEbayToken();

    // 4. Process in batches
    let scanned = 0;
    let found = 0;
    let upserted = 0;
    let matched = 0;

    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (card) => {
          const parsed = parseCardName(card.card_name);
          const query = buildBroadQuery(card.card_name);
          if (!query) {
            console.log(`[SCAN] "${card.card_name}" → SKIP (empty query)`);
            return { cardId: card.id, auctions: [] };
          }
          const rawAuctions = await searchEbayAuctions(query, token);
          // Title-match validation: only keep auctions that match the card
          const matchedAuctions = rawAuctions.filter(a => titleMatchesCard(a.title, parsed));
          console.log(`[SCAN] "${card.card_name}" → q="${query}" → raw=${rawAuctions.length} matched=${matchedAuctions.length}`);
          return { cardId: card.id, auctions: matchedAuctions };
        })
      );

      for (const result of results) {
        scanned++;
        if (result.status !== 'fulfilled') continue;
        const { cardId, auctions } = result.value;
        found += auctions.length;
        matched += auctions.length;

        for (const auction of auctions) {
          const { error } = await supabase
            .from('roi_live_auctions')
            .upsert({
              roi_card_id: cardId,
              item_id: auction.itemId,
              listing_url: auction.itemUrl,
              current_bid: auction.currentBid,
              shipping: auction.shipping,
              end_time: auction.endTime,
              image_url: auction.imageUrl || null,
              last_seen_at: new Date().toISOString(),
            }, { onConflict: 'item_id' });

          if (!error) upserted++;
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < toProcess.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    console.log(`[SCANNER] DONE scanned=${scanned} found=${found} matched=${matched} upserted=${upserted}`);

    return new Response(JSON.stringify({
      total_cards: allCards.length,
      skipped_fresh: freshCardIds.size,
      scanned,
      found,
      matched,
      upserted,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('roi-auction-scanner error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
