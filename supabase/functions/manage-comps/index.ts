import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;

    // Check admin role
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleCheck } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { action } = body;
    const keysToRecompute: string[] = [];

    switch (action) {
      case 'exclude_comp': {
        const { sale_id } = body;
        if (!sale_id) throw new Error('sale_id required');
        const { data } = await adminClient.from('sales_history').update({ confidence_score: 'excluded' }).eq('id', sale_id).select('card_identity_key').single();
        if (data) keysToRecompute.push(data.card_identity_key);
        break;
      }
      case 'approve_comp': {
        const { sale_id } = body;
        if (!sale_id) throw new Error('sale_id required');
        const { data } = await adminClient.from('sales_history').update({ confidence_score: 'exact' }).eq('id', sale_id).select('card_identity_key').single();
        if (data) keysToRecompute.push(data.card_identity_key);
        break;
      }
      case 'merge_cards': {
        const { source_key, target_key } = body;
        if (!source_key || !target_key) throw new Error('source_key and target_key required');
        await adminClient.from('sales_history').update({ card_identity_key: target_key }).eq('card_identity_key', source_key);
        await adminClient.from('card_market_metrics').delete().eq('card_identity_key', source_key);
        await adminClient.from('cards_normalized').delete().eq('card_identity_key', source_key);
        keysToRecompute.push(target_key);
        break;
      }
      case 'split_card': {
        const { sale_ids, new_key } = body;
        if (!sale_ids?.length || !new_key) throw new Error('sale_ids and new_key required');
        // Get first sale for metadata
        const { data: sample } = await adminClient.from('sales_history').select('*').in('id', sale_ids).limit(1).single();
        if (sample) {
          await adminClient.from('cards_normalized').upsert({
            card_identity_key: new_key,
            sport: 'sports',
            player_name: null,
          }, { onConflict: 'card_identity_key' });
          await adminClient.from('sales_history').update({ card_identity_key: new_key }).in('id', sale_ids);
          keysToRecompute.push(new_key, sample.card_identity_key);
        }
        break;
      }
      case 'override_metadata': {
        const { card_identity_key, fields } = body;
        if (!card_identity_key || !fields) throw new Error('card_identity_key and fields required');
        const allowed = ['brand', 'set_name', 'player_name', 'year', 'card_number', 'parallel', 'subset', 'variation'];
        const updates: Record<string, any> = {};
        for (const [k, v] of Object.entries(fields)) {
          if (allowed.includes(k)) updates[k] = v;
        }
        if (Object.keys(updates).length > 0) {
          await adminClient.from('cards_normalized').update(updates).eq('card_identity_key', card_identity_key);
        }
        break;
      }
      case 'map_psa_population': {
        const { card_identity_key, psa_set_name, psa_subject, psa_card_number, psa_search_query, psa_population_url, notes: mappingNotes } = body;
        if (!card_identity_key) throw new Error('card_identity_key required');
        await adminClient.from('psa_population_mapping').upsert({
          card_identity_key,
          psa_set_name: psa_set_name || null,
          psa_subject: psa_subject || null,
          psa_card_number: psa_card_number || null,
          psa_search_query: psa_search_query || null,
          psa_population_url: psa_population_url || null,
          notes: mappingNotes || null,
          psa_population_source: 'manual',
          mapping_confidence: 'manual',
        }, { onConflict: 'card_identity_key' });
        break;
      }
      case 'verify_psa_mapping': {
        const { card_identity_key } = body;
        if (!card_identity_key) throw new Error('card_identity_key required');
        await adminClient.from('psa_population_mapping')
          .update({ is_admin_verified: true, mapping_confidence: 'verified' })
          .eq('card_identity_key', card_identity_key);
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Trigger recompute for affected keys
    for (const key of keysToRecompute) {
      await fetch(`${SUPABASE_URL}/functions/v1/recompute-card-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ card_identity_key: key, force: true }),
      });
    }

    return new Response(JSON.stringify({ success: true, action, recomputed: keysToRecompute }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
