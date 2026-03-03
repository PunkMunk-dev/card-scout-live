import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'npm:xlsx@0.18.5/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseDollar(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  if (s === '$-' || s === '-' || s === '') return null;
  if (s.startsWith('$(') && s.endsWith(')')) {
    return -1 * parseFloat(s.replace(/[$(),]/g, ''));
  }
  const n = parseFloat(s.replace(/[$,]/g, ''));
  return isNaN(n) ? null : n;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Clear existing data first
    await supabase.from('roi_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Fetch the xlsx file
    const response = await fetch(url);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    const rows = data
      .filter((row: any) => row['Sport'] && row['Card'])
      .map((row: any) => ({
        sport: String(row['Sport']).trim(),
        card_name: String(row['Card']).trim(),
        raw_avg: parseDollar(row['Raw Avg.']),
        psa9_avg: parseDollar(row['PSA 9 Avg.']),
        psa9_gain: parseDollar(row['Potential gain/loss with PSA 9']),
        multiplier: row['Multiplier'] != null ? parseFloat(String(row['Multiplier']).replace(/,/g, '')) || null : null,
        psa10_avg: parseDollar(row['PSA 10 Avg.']),
        psa10_profit: parseDollar(row['Potential Profit']),
      }));

    let inserted = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200);
      const { error } = await supabase.from('roi_cards').insert(batch);
      if (error) {
        return new Response(JSON.stringify({ error: error.message, inserted, failedAt: i }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      inserted += batch.length;
    }

    return new Response(JSON.stringify({ inserted, total: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
