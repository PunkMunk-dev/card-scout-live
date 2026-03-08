import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VALID_GRADES = ['1','1.5','2','2.5','3','3.5','4','4.5','5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','auth','a'];
const MAX_CARDS_PER_RUN = 50;
const RATE_LIMIT_HOURS = 1;

interface GradePayload {
  psa_grade: string;
  population_count: number;
}

interface SyncPayload {
  card_identity_key: string;
  source_url?: string;
  source_label?: string;
  psa_set_name?: string;
  psa_subject?: string;
  psa_card_number?: string;
  grades: GradePayload[];
  synced_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

  try {
    // Auth check — admin only
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
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleCheck } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const mode: string = body.mode || 'ingest'; // modes: ingest, sync_all, sync_single, dry_run

    // Create sync run log
    const { data: syncRun } = await adminClient.from('psa_sync_runs').insert({
      status: 'running',
      source_type: mode,
    }).select('id').single();
    const runId = syncRun?.id;

    const errorLog: { key?: string; error: string }[] = [];
    let recordsSeen = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    if (mode === 'ingest' || mode === 'dry_run') {
      // Receive parsed population payloads from external scraper
      const payloads: SyncPayload[] = body.payloads || (body.card_identity_key ? [body] : []);

      if (!payloads.length) {
        await finishRun(adminClient, runId, 'error', 0, 0, 0, [{ error: 'No payloads provided' }]);
        return new Response(JSON.stringify({ error: 'No payloads provided' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      for (const payload of payloads) {
        recordsSeen++;
        try {
          const validationError = validatePayload(payload);
          if (validationError) {
            recordsFailed++;
            errorLog.push({ key: payload.card_identity_key, error: validationError });
            continue;
          }

          // Verify card_identity_key exists
          const { data: card } = await adminClient
            .from('cards_normalized')
            .select('card_identity_key')
            .eq('card_identity_key', payload.card_identity_key)
            .maybeSingle();

          if (!card) {
            recordsFailed++;
            errorLog.push({ key: payload.card_identity_key, error: 'card_identity_key not found' });
            continue;
          }

          // Verify mapping exists
          const { data: mapping } = await adminClient
            .from('psa_population_mapping')
            .select('*')
            .eq('card_identity_key', payload.card_identity_key)
            .maybeSingle();

          if (!mapping) {
            recordsFailed++;
            errorLog.push({ key: payload.card_identity_key, error: 'No population mapping exists' });
            continue;
          }

          // If not force mode, check source_url matches mapping
          if (!body.force && mapping.psa_population_url && payload.source_url && mapping.psa_population_url !== payload.source_url) {
            recordsFailed++;
            errorLog.push({ key: payload.card_identity_key, error: 'source_url does not match mapping' });
            continue;
          }

          // Rate limit: skip if recently synced (unless force)
          if (!body.force && mapping.last_synced_at) {
            const lastSync = new Date(mapping.last_synced_at).getTime();
            if (Date.now() - lastSync < RATE_LIMIT_HOURS * 60 * 60 * 1000) {
              errorLog.push({ key: payload.card_identity_key, error: 'Rate limited — recently synced' });
              continue;
            }
          }

          if (mode === 'dry_run') {
            recordsUpdated++;
            continue;
          }

          // Upsert grade-level population rows
          const syncTime = payload.synced_at || new Date().toISOString();
          let psa10Pop: number | null = null;
          let totalPop = 0;

          for (const grade of payload.grades) {
            totalPop += grade.population_count;
            if (grade.psa_grade === '10') psa10Pop = grade.population_count;

            await adminClient.from('psa_population').upsert({
              card_identity_key: payload.card_identity_key,
              psa_grade: grade.psa_grade,
              population_count: grade.population_count,
              psa_set: payload.psa_set_name || mapping.psa_set_name,
              psa_subject: payload.psa_subject || mapping.psa_subject,
              source_url: payload.source_url || null,
              source_label: payload.source_label || null,
              source_last_synced_at: syncTime,
              last_synced: syncTime,
            }, { onConflict: 'card_identity_key,psa_grade', ignoreDuplicates: false });
          }

          // Update card_market_metrics
          await adminClient.from('card_market_metrics').upsert({
            card_identity_key: payload.card_identity_key,
            population: totalPop,
            psa10_population: psa10Pop,
            pop_last_synced_at: syncTime,
          }, { onConflict: 'card_identity_key' });

          // Update mapping last_synced_at
          await adminClient.from('psa_population_mapping').update({
            last_synced_at: syncTime,
            psa_population_url: payload.source_url || mapping.psa_population_url,
          }).eq('card_identity_key', payload.card_identity_key);

          recordsUpdated++;
        } catch (e) {
          recordsFailed++;
          errorLog.push({ key: payload.card_identity_key, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }
    } else if (mode === 'sync_single') {
      // Sync a single card from existing psa_population data
      const { card_identity_key } = body;
      if (!card_identity_key) {
        await finishRun(adminClient, runId, 'error', 0, 0, 0, [{ error: 'card_identity_key required' }]);
        return new Response(JSON.stringify({ error: 'card_identity_key required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      recordsSeen = 1;
      const result = await syncSingleCard(adminClient, card_identity_key, body.force);
      if (result.success) recordsUpdated = 1;
      else {
        recordsFailed = 1;
        errorLog.push({ key: card_identity_key, error: result.error || 'Unknown' });
      }
    } else if (mode === 'sync_all') {
      // Sync all eligible mapped cards
      const { data: mappings } = await adminClient
        .from('psa_population_mapping')
        .select('card_identity_key')
        .or('is_admin_verified.eq.true,mapping_confidence.eq.verified,mapping_confidence.eq.manual')
        .limit(MAX_CARDS_PER_RUN);

      if (mappings) {
        for (const m of mappings) {
          recordsSeen++;
          const result = await syncSingleCard(adminClient, m.card_identity_key, body.force);
          if (result.success) recordsUpdated++;
          else {
            recordsFailed++;
            errorLog.push({ key: m.card_identity_key, error: result.error || 'Unknown' });
          }
        }
      }
    }

    const finalStatus = recordsFailed > 0 && recordsUpdated === 0 ? 'failed'
      : recordsFailed > 0 ? 'partial' : 'success';

    await finishRun(adminClient, runId, finalStatus, recordsSeen, recordsUpdated, recordsFailed, errorLog);

    return new Response(JSON.stringify({
      status: finalStatus,
      run_id: runId,
      records_seen: recordsSeen,
      records_updated: recordsUpdated,
      records_failed: recordsFailed,
      errors: errorLog,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function validatePayload(p: SyncPayload): string | null {
  if (!p.card_identity_key) return 'Missing card_identity_key';
  if (!Array.isArray(p.grades) || p.grades.length === 0) return 'Missing or empty grades array';
  for (const g of p.grades) {
    if (!g.psa_grade || !VALID_GRADES.includes(g.psa_grade.toLowerCase())) {
      return `Invalid psa_grade: ${g.psa_grade}`;
    }
    if (typeof g.population_count !== 'number' || g.population_count < 0) {
      return `Invalid population_count for grade ${g.psa_grade}`;
    }
  }
  return null;
}

async function syncSingleCard(client: any, cardKey: string, force?: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: mapping } = await client
      .from('psa_population_mapping')
      .select('*')
      .eq('card_identity_key', cardKey)
      .maybeSingle();

    if (!mapping) return { success: false, error: 'No mapping found' };

    if (!force && mapping.last_synced_at) {
      const lastSync = new Date(mapping.last_synced_at).getTime();
      if (Date.now() - lastSync < RATE_LIMIT_HOURS * 60 * 60 * 1000) {
        return { success: false, error: 'Rate limited' };
      }
    }

    // Read existing psa_population for this card
    const { data: popRows } = await client
      .from('psa_population')
      .select('psa_grade, population_count')
      .eq('card_identity_key', cardKey);

    if (!popRows || popRows.length === 0) {
      return { success: false, error: 'No population data cached' };
    }

    const totalPop = popRows.reduce((sum: number, r: any) => sum + (r.population_count ?? 0), 0);
    const psa10Row = popRows.find((r: any) => r.psa_grade === '10');
    const now = new Date().toISOString();

    await client.from('card_market_metrics').upsert({
      card_identity_key: cardKey,
      population: totalPop,
      psa10_population: psa10Row?.population_count ?? null,
      pop_last_synced_at: now,
    }, { onConflict: 'card_identity_key' });

    await client.from('psa_population_mapping').update({
      last_synced_at: now,
    }).eq('card_identity_key', cardKey);

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown' };
  }
}

async function finishRun(client: any, runId: string | undefined, status: string, seen: number, updated: number, failed: number, errors: any[]) {
  if (!runId) return;
  await client.from('psa_sync_runs').update({
    status,
    records_seen: seen,
    records_updated: updated,
    records_failed: failed,
    finished_at: new Date().toISOString(),
    error_log: errors,
  }).eq('id', runId);
}
