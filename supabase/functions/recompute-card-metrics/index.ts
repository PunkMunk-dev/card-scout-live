import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

const RAW_THRESHOLD = 3;
const PSA10_THRESHOLD = 2;
const FRESHNESS_MS = 2 * 60 * 60 * 1000; // 2 hours

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing env vars');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const cardIdentityKey = body.card_identity_key || null;
    const forceRefresh = body.force === true;

    let keys: string[] = [];

    if (cardIdentityKey) {
      // Check freshness unless forced
      if (!forceRefresh) {
        const { data: existing } = await supabase
          .from('card_market_metrics')
          .select('updated_at')
          .eq('card_identity_key', cardIdentityKey)
          .maybeSingle();

        if (existing) {
          const updatedAt = new Date(existing.updated_at).getTime();
          if (Date.now() - updatedAt < FRESHNESS_MS) {
            return new Response(JSON.stringify({
              success: true,
              cached: true,
              recomputedCount: 0,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      }
      keys = [cardIdentityKey];
    } else {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentSales } = await supabase
        .from('sales_history')
        .select('card_identity_key')
        .gte('sold_at', thirtyDaysAgo)
        .in('confidence_score', ['exact', 'high']);
      
      keys = [...new Set((recentSales || []).map(s => s.card_identity_key))];
    }

    const results: any[] = [];

    for (const key of keys) {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: sales } = await supabase
        .from('sales_history')
        .select('*')
        .eq('card_identity_key', key)
        .gte('sold_at', ninetyDaysAgo);

      if (!sales || sales.length === 0) continue;

      // Exact comps first, broad as fallback
      const exactSales = sales.filter(s => s.confidence_score === 'exact');
      const highSales = sales.filter(s => s.confidence_score === 'high');

      const exactRaw = exactSales.filter(s => s.raw_or_graded === 'raw');
      const broadRaw = highSales.filter(s => s.raw_or_graded === 'raw');
      const useRaw = exactRaw.length >= RAW_THRESHOLD ? exactRaw : [...exactRaw, ...broadRaw];

      const exactPsa10 = exactSales.filter(s => s.raw_or_graded === 'graded' && s.grader === 'PSA' && s.grade === '10');
      const broadPsa10 = highSales.filter(s => s.raw_or_graded === 'graded' && s.grader === 'PSA' && s.grade === '10');
      const usePsa10 = exactPsa10.length >= PSA10_THRESHOLD ? exactPsa10 : [...exactPsa10, ...broadPsa10];

      const rawPrices = useRaw.map(s => s.total_price).filter(Boolean) as number[];
      const psa10Prices = usePsa10.map(s => s.total_price).filter(Boolean) as number[];

      const rawMedian = rawPrices.length >= RAW_THRESHOLD ? calculateMedian(rawPrices) : null;
      const psa10Median = psa10Prices.length >= PSA10_THRESHOLD ? calculateMedian(psa10Prices) : null;

      const spreadAmount = (rawMedian !== null && psa10Median !== null) ? psa10Median - rawMedian : null;
      const spreadPercent = (spreadAmount !== null && rawMedian && rawMedian > 0) ? (spreadAmount / rawMedian) * 100 : null;

      const { data: popData } = await supabase
        .from('psa_population')
        .select('population_count')
        .eq('card_identity_key', key)
        .eq('psa_grade', '10')
        .maybeSingle();

      const metrics = {
        card_identity_key: key,
        raw_median_price: rawMedian ? Math.round(rawMedian * 100) / 100 : null,
        raw_comp_count: useRaw.length,
        psa10_median_price: psa10Median ? Math.round(psa10Median * 100) / 100 : null,
        psa10_comp_count: usePsa10.length,
        spread_amount: spreadAmount ? Math.round(spreadAmount * 100) / 100 : null,
        spread_percent: spreadPercent ? Math.round(spreadPercent * 100) / 100 : null,
        population: popData?.population_count || null,
      };

      await supabase.from('card_market_metrics').upsert(metrics, { onConflict: 'card_identity_key' });
      results.push(metrics);
    }

    return new Response(JSON.stringify({
      success: true,
      recomputedCount: results.length,
      metrics: results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
