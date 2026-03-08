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
  'finest': 'Topps Finest', 'heritage': 'Topps Heritage',
  'revolution': 'Panini Revolution', 'chronicles': 'Panini Chronicles',
  'flux': 'Panini Flux', 'obsidian': 'Panini Obsidian',
  'phoenix': 'Panini Phoenix', 'spectra': 'Panini Spectra',
};

const GRADER_PATTERNS = [
  { regex: /\bPSA\s*GEM\s*(?:MT|MINT)\s*(\d+)\b/i, grader: 'PSA' },
  { regex: /\bPSA\s*(?:GEM\s*(?:MT|MINT)\s*)?(\d+\.?\d*)\b/i, grader: 'PSA' },
  { regex: /\bBGS\s*(\d+\.?\d*)\b/i, grader: 'BGS' },
  { regex: /\bSGC\s*(\d+\.?\d*)\b/i, grader: 'SGC' },
  { regex: /\bCGC\s*(\d+\.?\d*)\b/i, grader: 'CGC' },
  { regex: /\bGMA\s*(\d+\.?\d*)\b/i, grader: 'GMA' },
  { regex: /\bHGA\s*(\d+\.?\d*)\b/i, grader: 'HGA' },
  { regex: /\bCSG\s*(\d+\.?\d*)\b/i, grader: 'CSG' },
];

const EXCLUDE_TERMS = [
  'lot', 'bundle', 'reprint', 'custom', 'proxy', 'fake', 'replica',
  'digital', 'mystery', 'break', 'random', 'mixed', 'grab bag',
  'repack', 'repacks', 'pack rip', 'case break', 'group break',
  'spot', 'random team', 'random player',
  'not a card', 'non-card', 'sticker', 'magnet', 'poster',
  'pwe only', 'print', 'photo', 'art card', 'promo card',
  'test print', 'error card',
  'x2', 'x3', 'x4', 'x5', 'x10', 'playset',
];

// Multi-word parallels (longest match first)
const MULTI_WORD_PARALLELS = [
  'red ice', 'blue ice', 'green ice', 'cracked ice',
  'fast break exclusive', 'fast break', 'first off the line', 'fotl',
  'color blast', 'case hit', 'tie-dye',
  'courtside level', 'club level', 'field level', 'premier level',
  'concourse level', 'mezzanine level',
];

const SINGLE_WORD_PARALLELS = [
  'silver', 'gold', 'bronze', 'ruby', 'sapphire', 'emerald', 'diamond',
  'red', 'blue', 'green', 'orange', 'purple', 'pink', 'black', 'white',
  'ice', 'camo', 'holo', 'holographic', 'shimmer', 'scope', 'lazer', 'laser',
  'mojo', 'refractor', 'xfractor', 'wave', 'hyper', 'neon',
  'disco', 'galaxy', 'nebula', 'cosmic', 'atomic', 'sparkle',
  'peacock', 'tiger', 'leopard', 'zebra', 'snakeskin', 'marble',
  'pulsar', 'velocity', 'mega', 'retail', 'hobby', 'choice',
  'ssp', 'sp',
];

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
      if (m[1] === '10' && /PSA\s*$/i.test(before)) continue;
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
  const tl = title.toLowerCase();
  // Numbered with optional color prefix
  const nm = tl.match(/\/(\d+)\b/);
  if (nm) {
    const before = tl.substring(0, tl.indexOf('/' + nm[1]));
    const cm = before.match(/(\w+)\s*$/);
    if (cm && SINGLE_WORD_PARALLELS.includes(cm[1])) return `${cm[1]} /${nm[1]}`;
    return `/${nm[1]}`;
  }
  // Multi-word first
  for (const mw of MULTI_WORD_PARALLELS) { if (tl.includes(mw)) return mw; }
  // Single-word
  for (const sw of SINGLE_WORD_PARALLELS) { if (tl.includes(sw)) return sw; }
  return null;
}

function sanitize(s: string | null): string {
  if (!s) return '';
  return s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function buildKey(year: string | null, player: string | null, brand: string | null, cardNum: string | null, parallel: string | null): string {
  return [year || 'unknown', sanitize(player) || 'unknown', sanitize(brand) || 'unknown', sanitize(brand) || 'base', sanitize(cardNum) || 'nonum', sanitize(parallel) || 'base'].join('_');
}

function getExcludeReason(title: string): string | null {
  const tl = title.toLowerCase();
  for (const t of EXCLUDE_TERMS) { if (tl.includes(t)) return `title contains '${t}'`; }
  if (/\b\d+\s*cards?\b/i.test(title)) return 'multi-card listing';
  if (/\b(?:damaged|poor|creased|torn|water\s*damage|bent|trimmed|miscut|off[- ]?center)\b/i.test(title)) return 'damaged condition';
  if (/^\s*(card|trading card|sports card)\s*$/i.test(title.trim())) return 'generic title';
  return null;
}

function computeConfidence(player: string | null, year: string | null, brand: string | null, cardNum: string | null): string {
  let score = 0;
  if (player) score += 2;
  if (year) score += 1;
  if (brand) score += 1;
  if (cardNum) score += 3;
  if (score >= 7) return 'exact';
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function generateMatchReason(
  confidence: string,
  fields: { player: boolean; year: boolean; brand: boolean; cardNum: boolean },
  excluded: boolean,
  excludeReason?: string
): string {
  if (excluded && excludeReason) return `Excluded: ${excludeReason}`;
  if (excluded) return 'Excluded: filtered by junk rules';
  const matched: string[] = [];
  if (fields.player) matched.push('player');
  if (fields.year) matched.push('year');
  if (fields.brand) matched.push('brand');
  if (fields.cardNum) matched.push('card#');
  if (confidence === 'exact') return `Exact: ${matched.join(' + ')} match`;
  if (confidence === 'high') return `Broad: ${matched.join(' + ')} match${!fields.cardNum ? ', missing card#' : ''}`;
  if (confidence === 'medium') return `Low confidence: ${matched.join(' + ')} only`;
  return `Insufficient: only ${matched.join(' + ')} matched`;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

const FRESHNESS_MS = 2 * 60 * 60 * 1000;
const RAW_THRESHOLD = 3;
const PSA10_THRESHOLD = 2;

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

    const tentativeKey = buildKey(year || extractYear(playerName), playerName, brand, null, null);

    // Freshness check
    const { data: existingMetrics } = await supabase
      .from('card_market_metrics')
      .select('*')
      .eq('card_identity_key', tentativeKey)
      .maybeSingle();

    if (existingMetrics) {
      const updatedAt = new Date(existingMetrics.updated_at).getTime();
      if (Date.now() - updatedAt < FRESHNESS_MS) {
        const { data: comps } = await supabase
          .from('sales_history')
          .select('*')
          .eq('card_identity_key', tentativeKey)
          .order('sold_at', { ascending: false })
          .limit(50);

        return new Response(JSON.stringify({
          success: true,
          cached: true,
          metrics: [existingMetrics],
          comps: (comps || []).map((c: any) => ({
            ...c,
            excluded: c.confidence_score === 'excluded',
            match_reason: c.confidence_score === 'excluded' ? 'Excluded by admin' : undefined,
          })),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Search eBay for sold items
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

          const excludeReason = getExcludeReason(title);
          const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0');
          if (price <= 0) continue;

          const shipping = parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || '0');
          const grading = extractGrading(title);
          const itemYear = year || extractYear(title);
          const itemBrand = brand ? (BRAND_SYNONYMS[brand.toLowerCase()] || brand) : extractBrand(title);
          const cardNum = extractCardNumber(title);
          const parallel = extractParallel(title);
          const key = buildKey(itemYear, playerName, itemBrand, cardNum, parallel);
          const confidence = excludeReason ? 'excluded' : computeConfidence(playerName, itemYear, itemBrand, cardNum);

          const matchReason = generateMatchReason(
            confidence,
            { player: !!playerName, year: !!itemYear, brand: !!itemBrand, cardNum: !!cardNum },
            !!excludeReason,
            excludeReason || undefined,
          );

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
            match_reason: matchReason,
            _year: itemYear,
            _brand: itemBrand,
            _cardNum: cardNum,
            _parallel: parallel,
          });
        }
      } catch { /* skip failed query */ }
    }

    const allValidComps = allComps.filter(c => c.confidence_score !== 'low' && c.confidence_score !== 'excluded');

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

    // Insert sales history
    let insertedCount = 0;
    for (const comp of allValidComps) {
      const { _year, _brand, _cardNum, _parallel, match_reason, ...saleData } = comp;
      if (!saleData.source_sale_id) continue;

      const { error } = await supabase.from('sales_history').upsert(saleData, {
        onConflict: 'source,source_sale_id',
        ignoreDuplicates: true,
      });
      if (!error) insertedCount++;
    }

    // Compute metrics per unique key
    const metricsResults: any[] = [];
    for (const key of uniqueKeys) {
      const compsForKey = allValidComps.filter(c => c.card_identity_key === key);
      const exactComps = compsForKey.filter(c => c.confidence_score === 'exact');
      const broadComps = compsForKey.filter(c => c.confidence_score === 'high');

      const exactRaw = exactComps.filter(c => c.raw_or_graded === 'raw');
      const broadRaw = broadComps.filter(c => c.raw_or_graded === 'raw');
      const useRaw = exactRaw.length >= RAW_THRESHOLD ? exactRaw : [...exactRaw, ...broadRaw];

      const exactPsa10 = exactComps.filter(c => c.raw_or_graded === 'graded' && c.grader === 'PSA' && c.grade === '10');
      const broadPsa10 = broadComps.filter(c => c.raw_or_graded === 'graded' && c.grader === 'PSA' && c.grade === '10');
      const usePsa10 = exactPsa10.length >= PSA10_THRESHOLD ? exactPsa10 : [...exactPsa10, ...broadPsa10];

      const rawPrices = useRaw.map(c => c.total_price);
      const psa10Prices = usePsa10.map(c => c.total_price);

      const rawMedian = rawPrices.length >= RAW_THRESHOLD ? calculateMedian(rawPrices) : null;
      const psa10Median = psa10Prices.length >= PSA10_THRESHOLD ? calculateMedian(psa10Prices) : null;

      const spreadAmount = (rawMedian !== null && psa10Median !== null) ? psa10Median - rawMedian : null;
      const spreadPercent = (spreadAmount !== null && rawMedian && rawMedian > 0) ? (spreadAmount / rawMedian) * 100 : null;

      const metrics = {
        card_identity_key: key,
        raw_median_price: rawMedian ? Math.round(rawMedian * 100) / 100 : null,
        raw_comp_count: useRaw.length,
        psa10_median_price: psa10Median ? Math.round(psa10Median * 100) / 100 : null,
        psa10_comp_count: usePsa10.length,
        spread_amount: spreadAmount ? Math.round(spreadAmount * 100) / 100 : null,
        spread_percent: spreadPercent ? Math.round(spreadPercent * 100) / 100 : null,
        population: null,
      };

      await supabase.from('card_market_metrics').upsert(metrics, { onConflict: 'card_identity_key' });
      metricsResults.push(metrics);
    }

    // Return comps with match_reason
    const responseComps = allValidComps.map(c => ({
      title: c.title,
      sold_price: c.sold_price,
      shipping_price: c.shipping_price,
      total_price: c.total_price,
      sold_at: c.sold_at,
      raw_or_graded: c.raw_or_graded,
      grader: c.grader,
      grade: c.grade,
      confidence_score: c.confidence_score,
      card_identity_key: c.card_identity_key,
      url: c.url,
      excluded: false,
      match_reason: c.match_reason,
    }));

    const excludedComps = allComps
      .filter(c => c.confidence_score === 'low' || c.confidence_score === 'excluded')
      .map(c => ({
        title: c.title,
        sold_price: c.sold_price,
        total_price: c.total_price,
        sold_at: c.sold_at,
        raw_or_graded: c.raw_or_graded,
        confidence_score: c.confidence_score,
        excluded: true,
        url: c.url,
        match_reason: c.match_reason,
      }));

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      totalCompsFound: allComps.length,
      validCompsInserted: insertedCount,
      normalizedCards: uniqueKeys.length,
      metrics: metricsResults,
      comps: [...responseComps, ...excludedComps],
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
