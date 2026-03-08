import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Brand synonyms
const BRAND_SYNONYMS: Record<string, string> = {
  'tc': 'Topps Chrome', 'topps chrome': 'Topps Chrome',
  'prizm': 'Panini Prizm', 'panini prizm': 'Panini Prizm',
  'optic': 'Donruss Optic', 'donruss optic': 'Donruss Optic',
  'select': 'Panini Select', 'mosaic': 'Panini Mosaic',
  'bowman chrome': 'Bowman Chrome', 'bowman': 'Bowman',
  'topps': 'Topps', 'donruss': 'Donruss', 'upper deck': 'Upper Deck',
  'hoops': 'NBA Hoops', 'contenders': 'Panini Contenders',
  'national treasures': 'National Treasures', 'immaculate': 'Panini Immaculate',
};

const GRADER_PATTERNS = [
  { regex: /\bPSA\s*(?:GEM\s*(?:MT|MINT)\s*)?(\d+\.?\d*)\b/i, grader: 'PSA' },
  { regex: /\bBGS\s*(\d+\.?\d*)\b/i, grader: 'BGS' },
  { regex: /\bSGC\s*(\d+\.?\d*)\b/i, grader: 'SGC' },
  { regex: /\bCGC\s*(\d+\.?\d*)\b/i, grader: 'CGC' },
];

const EXCLUDE_TERMS = ['lot', 'bundle', 'reprint', 'custom', 'proxy', 'fake', 'replica', 'digital', 'mystery', 'break', 'random', 'mixed', 'grab bag'];

function extractYear(title: string): string | null {
  const m = title.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  return m ? m[1] : null;
}

function extractBrand(title: string): string | null {
  const tl = title.toLowerCase();
  const keys = Object.keys(BRAND_SYNONYMS).sort((a, b) => b.length - a.length);
  for (const k of keys) { if (tl.includes(k)) return BRAND_SYNONYMS[k]; }
  return null;
}

function extractCardNumber(title: string): string | null {
  const patterns = [/#\s*([A-Z]*-?\d+[A-Z]*)/i, /\bNo\.?\s*([A-Z]*-?\d+[A-Z]*)/i, /\b([A-Z]{1,4}-\d+[A-Z]?)\b/];
  for (const p of patterns) {
    const m = title.match(p);
    if (m?.[1]) {
      const before = title.substring(0, m.index || 0);
      if (/\b(?:PSA|BGS|SGC|CGC)\s*$/i.test(before)) continue;
      return m[1].toUpperCase();
    }
  }
  return null;
}

function extractGrading(title: string): { grader: string | null; grade: string | null; raw_or_graded: string } {
  for (const p of GRADER_PATTERNS) {
    const m = title.match(p.regex);
    if (m) return { grader: p.grader, grade: m[1], raw_or_graded: 'graded' };
  }
  if (/\b(?:graded|slab|slabbed)\b/i.test(title)) return { grader: null, grade: null, raw_or_graded: 'graded' };
  return { grader: null, grade: null, raw_or_graded: 'raw' };
}

function extractParallel(title: string): string | null {
  const m = title.toLowerCase().match(/\/(\d+)\b/);
  return m ? `/${m[1]}` : null;
}

function sanitize(s: string | null): string {
  if (!s) return '';
  return s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function buildKey(year: string | null, player: string | null, brand: string | null, cardNum: string | null, parallel: string | null): string {
  return [year || 'unknown', sanitize(player) || 'unknown', sanitize(brand) || 'unknown', sanitize(brand) || 'base', sanitize(cardNum) || 'nonum', sanitize(parallel) || 'base'].join('_');
}

function shouldExclude(title: string): boolean {
  const tl = title.toLowerCase();
  if (EXCLUDE_TERMS.some(t => tl.includes(t))) return true;
  if (/\b\d+\s*cards?\b/i.test(title)) return true;
  if (/\b(?:damaged|poor|creased|torn|water\s*damage|bent)\b/i.test(title)) return true;
  return false;
}

function computeConfidence(player: string | null, year: string | null, brand: string | null, cardNum: string | null): string {
  let score = 0;
  if (player) score += 2;
  if (year) score += 1;
  if (brand) score += 1;
  if (cardNum) score += 2;
  if (score >= 6) return 'exact';
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const EBAY_CLIENT_ID = Deno.env.get('EBAY_CLIENT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!EBAY_CLIENT_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing required env vars');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const playerName = body.playerName || body.query || null;
    const brand = body.brand || null;
    const year = body.year || null;
    const sport = body.sport || 'sports';
    if (!playerName) throw new Error('playerName is required');

    // Search eBay for sold items (raw + PSA 10)
    const queries = [
      { label: 'raw', keywords: [playerName, brand, year, 'card', '-PSA', '-BGS', '-SGC', '-graded', '-slab'].filter(Boolean).join(' ') },
      { label: 'psa10', keywords: [playerName, brand, year, 'PSA 10', 'card'].filter(Boolean).join(' ') },
    ];

    const allComps: any[] = [];

    for (const q of queries) {
      const url = new URL('https://svcs.ebay.com/services/search/FindingService/v1');
      url.searchParams.set('OPERATION-NAME', 'findCompletedItems');
      url.searchParams.set('SERVICE-VERSION', '1.0.0');
      url.searchParams.set('SECURITY-APPNAME', EBAY_CLIENT_ID);
      url.searchParams.set('RESPONSE-DATA-FORMAT', 'JSON');
      url.searchParams.set('REST-PAYLOAD', '');
      url.searchParams.set('keywords', q.keywords);
      url.searchParams.set('categoryId', '212');
      url.searchParams.set('paginationInput.entriesPerPage', '50');
      url.searchParams.set('sortOrder', 'EndTimeSoonest');
      url.searchParams.set('itemFilter(0).name', 'SoldItemsOnly');
      url.searchParams.set('itemFilter(0).value', 'true');

      try {
        const res = await fetch(url.toString(), { headers: { 'X-EBAY-SOA-SECURITY-APPNAME': EBAY_CLIENT_ID } });
        if (!res.ok) { await res.text(); continue; }
        const data = await res.json();
        const searchResult = data.findCompletedItemsResponse?.[0];
        if (searchResult?.ack?.[0] !== 'Success') continue;

        const items = searchResult?.searchResult?.[0]?.item || [];
        for (const item of items) {
          const title = item.title?.[0] || '';
          const sellingState = item.sellingStatus?.[0]?.sellingState?.[0];
          if (sellingState !== 'EndedWithSales') continue;
          if (shouldExclude(title)) continue;

          const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0');
          if (price <= 0) continue;

          const shipping = parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || '0');
          const grading = extractGrading(title);
          const itemYear = year || extractYear(title);
          const itemBrand = brand ? (BRAND_SYNONYMS[brand.toLowerCase()] || brand) : extractBrand(title);
          const cardNum = extractCardNumber(title);
          const parallel = extractParallel(title);
          const key = buildKey(itemYear, playerName, itemBrand, cardNum, parallel);
          const confidence = computeConfidence(playerName, itemYear, itemBrand, cardNum);

          allComps.push({
            card_identity_key: key,
            source: 'ebay',
            source_sale_id: item.itemId?.[0] || null,
            title,
            url: item.viewItemURL?.[0] || '',
            image_url: item.galleryURL?.[0] || null,
            sold_price: price,
            shipping_price: shipping,
            total_price: price + shipping,
            sold_at: item.listingInfo?.[0]?.endTime?.[0] || null,
            raw_or_graded: grading.raw_or_graded,
            grader: grading.grader,
            grade: grading.grade,
            confidence_score: confidence,
            // For upserting the normalized card
            _year: itemYear,
            _brand: itemBrand,
            _cardNum: cardNum,
            _parallel: parallel,
          });
        }
      } catch { /* skip failed query */ }
    }

    // Only process exact + high confidence comps
    const goodComps = allComps.filter(c => c.confidence_score === 'exact' || c.confidence_score === 'high');
    const allValidComps = allComps.filter(c => c.confidence_score !== 'low');

    // Upsert normalized cards
    const uniqueKeys = [...new Set(allValidComps.map(c => c.card_identity_key))];
    for (const key of uniqueKeys) {
      const rep = allValidComps.find(c => c.card_identity_key === key)!;
      const rookieFlag = /\b(?:rc|rookie)\b/i.test(rep.title);
      const autoFlag = /\b(?:auto|autograph)\b/i.test(rep.title);
      const memFlag = /\b(?:patch|jersey|relic|memorabilia)\b/i.test(rep.title);

      await supabase.from('cards_normalized').upsert({
        card_identity_key: key,
        sport,
        player_name: playerName,
        year: rep._year,
        brand: rep._brand,
        set_name: rep._brand,
        card_number: rep._cardNum,
        parallel: rep._parallel,
        rookie_flag: rookieFlag,
        autograph_flag: autoFlag,
        memorabilia_flag: memFlag,
      }, { onConflict: 'card_identity_key' });
    }

    // Insert sales history (upsert on source + source_sale_id)
    let insertedCount = 0;
    for (const comp of allValidComps) {
      const { _year, _brand, _cardNum, _parallel, ...saleData } = comp;
      if (!saleData.source_sale_id) continue;

      const { error } = await supabase.from('sales_history').upsert(saleData, {
        onConflict: 'source,source_sale_id',
        ignoreDuplicates: true,
      });
      if (!error) insertedCount++;
    }

    // Compute metrics for each unique card_identity_key
    const metricsResults: any[] = [];
    for (const key of uniqueKeys) {
      const compsForKey = goodComps.filter(c => c.card_identity_key === key);
      const rawComps = compsForKey.filter(c => c.raw_or_graded === 'raw');
      const psa10Comps = compsForKey.filter(c => c.raw_or_graded === 'graded' && c.grader === 'PSA' && c.grade === '10');

      const rawPrices = rawComps.map(c => c.total_price);
      const psa10Prices = psa10Comps.map(c => c.total_price);

      const rawMedian = rawPrices.length > 0 ? calculateMedian(rawPrices) : null;
      const psa10Median = psa10Prices.length > 0 ? calculateMedian(psa10Prices) : null;

      const spreadAmount = (rawMedian !== null && psa10Median !== null) ? psa10Median - rawMedian : null;
      const spreadPercent = (spreadAmount !== null && rawMedian && rawMedian > 0) ? (spreadAmount / rawMedian) * 100 : null;

      const metrics = {
        card_identity_key: key,
        raw_median_price: rawMedian ? Math.round(rawMedian * 100) / 100 : null,
        raw_comp_count: rawComps.length,
        psa10_median_price: psa10Median ? Math.round(psa10Median * 100) / 100 : null,
        psa10_comp_count: psa10Comps.length,
        spread_amount: spreadAmount ? Math.round(spreadAmount * 100) / 100 : null,
        spread_percent: spreadPercent ? Math.round(spreadPercent * 100) / 100 : null,
        population: null, // Will be populated when PSA sync is implemented
      };

      await supabase.from('card_market_metrics').upsert(metrics, { onConflict: 'card_identity_key' });
      metricsResults.push(metrics);
    }

    return new Response(JSON.stringify({
      success: true,
      totalCompsFound: allComps.length,
      validCompsInserted: insertedCount,
      normalizedCards: uniqueKeys.length,
      metrics: metricsResults,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
