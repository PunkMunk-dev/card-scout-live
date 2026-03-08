import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_CARDS_PER_RUN = 50;
const STALE_DAYS = 7;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Auth check — admin only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub as string;
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleCheck } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders });
    }

    // Get mapped cards that need sync
    const staleDate = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: mappings, error: mapErr } = await adminClient
      .from('psa_population_mapping')
      .select('*')
      .or(`last_synced_at.is.null,last_synced_at.lt.${staleDate}`)
      .limit(MAX_CARDS_PER_RUN);

    if (mapErr) {
      return new Response(JSON.stringify({ error: 'Failed to fetch mappings', detail: mapErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!mappings || mappings.length === 0) {
      return new Response(JSON.stringify({ message: 'No stale mappings to sync', synced: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: { card_identity_key: string; status: string }[] = [];

    for (const mapping of mappings) {
      try {
        // For now, sync from existing psa_population data (manual source)
        // Future: add PSA population API calls here
        const { data: popRows } = await adminClient
          .from('psa_population')
          .select('psa_grade, population_count')
          .eq('card_identity_key', mapping.card_identity_key);

        if (popRows && popRows.length > 0) {
          // Sum total population across all grades
          const totalPop = popRows.reduce((sum, r) => sum + (r.population_count ?? 0), 0);

          // Update card_market_metrics.population
          await adminClient
            .from('card_market_metrics')
            .update({ population: totalPop })
            .eq('card_identity_key', mapping.card_identity_key);

          // Mark mapping as synced
          await adminClient
            .from('psa_population_mapping')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', mapping.id);

          results.push({ card_identity_key: mapping.card_identity_key, status: 'synced' });
        } else {
          results.push({ card_identity_key: mapping.card_identity_key, status: 'no_population_data' });
        }
      } catch (e) {
        results.push({ card_identity_key: mapping.card_identity_key, status: 'error' });
      }
    }

    return new Response(JSON.stringify({ synced: results.filter(r => r.status === 'synced').length, total: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
