import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseDollar(val: string): number | null {
  if (!val || val.trim() === '' || val.trim() === '$-' || val.trim() === '-') return null;
  const s = val.trim();
  if (s.startsWith('$(') && s.endsWith(')')) {
    return -1 * parseFloat(s.replace(/[$(),]/g, ''));
  }
  const n = parseFloat(s.replace(/[$,]/g, ''));
  return isNaN(n) ? null : n;
}

function parseMultiplier(val: string): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function parseMarkdownRows(text: string) {
  const lines = text.split('\n').filter(l => l.startsWith('|'));
  // Skip header and separator rows
  const dataLines = lines.filter(l => !l.includes('Sport') && !l.includes('|-'));
  
  return dataLines.map(line => {
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 8) return null;
    return {
      sport: cells[0],
      card_name: cells[1],
      raw_avg: parseDollar(cells[2]),
      psa9_avg: parseDollar(cells[3]),
      psa9_gain: parseDollar(cells[4]),
      multiplier: parseMultiplier(cells[5]),
      psa10_avg: parseDollar(cells[6]),
      psa10_profit: parseDollar(cells[7]),
    };
  }).filter(r => r && r.sport && r.card_name);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { rows, text, clear } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (clear) {
      await supabase.from('roi_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    let insertRows: any[];
    if (text) {
      insertRows = parseMarkdownRows(text);
    } else if (rows && Array.isArray(rows)) {
      insertRows = rows;
    } else {
      return new Response(JSON.stringify({ error: 'rows array or text required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (insertRows.length === 0) {
      return new Response(JSON.stringify({ error: 'no valid rows parsed', inserted: 0 }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insert in batches of 200
    let inserted = 0;
    for (let i = 0; i < insertRows.length; i += 200) {
      const batch = insertRows.slice(i, i + 200);
      const { error } = await supabase.from('roi_cards').insert(batch);
      if (error) {
        return new Response(JSON.stringify({ error: error.message, inserted, failedAt: i }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      inserted += batch.length;
    }

    return new Response(JSON.stringify({ inserted, total: insertRows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
