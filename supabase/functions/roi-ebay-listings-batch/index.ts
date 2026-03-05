import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const MAX_BATCH = 25;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const cards = body.cards || body.cardNames || null;
    if (!Array.isArray(cards) || cards.length === 0) {
      return new Response(JSON.stringify({ error: 'cards array required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const batch = cards.slice(0, MAX_BATCH);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Fan out individual calls to the single-card function
    const results: Record<string, { listings: any[]; cached: boolean }> = {};

    await Promise.allSettled(
      batch.map(async (item: { cardName: string }) => {
        try {
          const resp = await fetch(`${supabaseUrl}/functions/v1/roi-ebay-listings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ cardName: item.cardName }),
          });
          const data = await resp.json();
          results[item.cardName] = {
            listings: data.listings || [],
            cached: data.cached ?? false,
          };
        } catch {
          results[item.cardName] = { listings: [], cached: false };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
