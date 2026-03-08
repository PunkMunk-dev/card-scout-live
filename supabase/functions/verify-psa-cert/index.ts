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
    const PSA_API_TOKEN = Deno.env.get('PSA_API_TOKEN');

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

    const body = await req.json();
    const { cert_number, force_refresh } = body;

    if (!cert_number || typeof cert_number !== 'string') {
      return new Response(JSON.stringify({ error: 'cert_number required' }), { status: 400, headers: corsHeaders });
    }

    const cleanCert = cert_number.trim();

    // Check cache first (fresh if < 24h old)
    if (!force_refresh) {
      const { data: cached } = await adminClient
        .from('psa_cert_cache')
        .select('*')
        .eq('cert_number', cleanCert)
        .single();

      if (cached) {
        const age = Date.now() - new Date(cached.last_verified_at).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (age < twentyFourHours) {
          return new Response(JSON.stringify({ source: 'cache', data: cached }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Call PSA API
    if (!PSA_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'PSA_API_TOKEN not configured' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const psaRes = await fetch(
      `https://api.psacard.com/publicapi/cert/GetByCertNumber/${encodeURIComponent(cleanCert)}`,
      { headers: { Authorization: `bearer ${PSA_API_TOKEN}` } }
    );

    if (!psaRes.ok) {
      const errText = await psaRes.text();
      return new Response(JSON.stringify({ error: `PSA API error: ${psaRes.status}`, detail: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const psaData = await psaRes.json();

    // Normalize PSA response
    const certRecord = psaData?.PSACert || psaData;
    const normalized = {
      cert_number: cleanCert,
      grade: certRecord?.CardGrade ?? certRecord?.Grade ?? null,
      player_name: certRecord?.Subject ?? null,
      year: certRecord?.Year ?? null,
      set_name: certRecord?.SetName ?? certRecord?.Brand ?? null,
      card_number: certRecord?.CardNumber ?? null,
      image_url: certRecord?.ImageURL ?? certRecord?.CertImageUrl ?? null,
      raw_response_json: psaData,
      last_verified_at: new Date().toISOString(),
    };

    // Upsert into cache
    const { data: upserted, error: upsertErr } = await adminClient
      .from('psa_cert_cache')
      .upsert(normalized, { onConflict: 'cert_number' })
      .select()
      .single();

    if (upsertErr) {
      console.error('Upsert error:', upsertErr);
      return new Response(JSON.stringify({ error: 'Failed to cache cert data', detail: upsertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ source: 'psa_api', data: upserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
