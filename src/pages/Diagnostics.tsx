import { useState, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { maskKey, safeJsonStringify, inferRlsHint } from '@/lib/diagnostics';
import { toast } from 'sonner';
import { Loader2, ChevronDown, Copy, ClipboardCheck, Play, RefreshCw } from 'lucide-react';

/* ── types ── */
type Status = 'idle' | 'running' | 'ok' | 'warn' | 'fail';

interface DbResult {
  table: string;
  status: Status;
  count: number | null;
  sample: unknown;
  error: unknown;
  sampleError: unknown;
  hint: string | null;
}

interface EdgeResult {
  name: string;
  status: Status;
  data: unknown;
  error: unknown;
  ms: number;
}

/* ── constants ── */
const DB_TABLES = ['roi_cards', 'roi_live_auctions'] as const;

const EDGE_FUNCTIONS: { name: string; body: Record<string, unknown> }[] = [
  { name: 'tcg-ebay-search', body: { action: 'active', query: 'test', limit: 1, offset: 0 } },
  { name: 'sports-ebay-search', body: { query: 'test', limit: 1 } },
  { name: 'roi-auction-scanner', body: { limitCards: 1, batch: 1, cursor: 0 } },
  { name: 'roi-ebay-listings', body: { cardName: 'test' } },
  { name: 'roi-ebay-listings-batch', body: { cardNames: ['test'] } },
  { name: 'ebay-search', body: { query: 'test', limit: 1 } },
  { name: 'sports-ebay-gem-rate', body: { query: 'test' } },
  { name: 'sports-ebay-psa10-active', body: { query: 'test' } },
  { name: 'sports-ebay-search', body: { query: 'test', limit: 1 } },
  { name: 'sports-ebay-sold-psa', body: { query: 'test' } },
];

// dedupe by name
const UNIQUE_EDGE_FUNCTIONS = EDGE_FUNCTIONS.filter(
  (f, i, arr) => arr.findIndex((x) => x.name === f.name) === i,
);

/* ── helpers ── */
const statusBadge = (s: Status) => {
  if (s === 'ok') return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">OK</Badge>;
  if (s === 'warn') return <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">WARN</Badge>;
  if (s === 'fail') return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">FAIL</Badge>;
  if (s === 'running') return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  return <Badge variant="outline">—</Badge>;
};

function JsonBlock({ data, label }: { data: unknown; label?: string }) {
  const text = safeJsonStringify(data);
  return (
    <div className="relative">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <pre className="text-xs font-mono p-3 rounded-md bg-muted/50 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
        {text}
      </pre>
      <button
        className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
        onClick={() => { navigator.clipboard.writeText(text); toast.success('Copied'); }}
      >
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

/* ── page ── */
export default function Diagnostics() {
  const [dbResults, setDbResults] = useState<DbResult[]>([]);
  const [edgeResults, setEdgeResults] = useState<EdgeResult[]>([]);
  const [runningDb, setRunningDb] = useState(false);
  const [runningEdge, setRunningEdge] = useState(false);
  const bundleRef = useRef<Record<string, unknown>>({});

  /* env */
  const url = import.meta.env.VITE_SUPABASE_URL ?? '';
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
  const urlHost = url ? new URL(url).host : '(missing)';

  /* db tests */
  const runDbTests = useCallback(async () => {
    setRunningDb(true);
    const results: DbResult[] = [];
    for (const table of DB_TABLES) {
      const entry: DbResult = { table, status: 'running', count: null, sample: null, error: null, sampleError: null, hint: null };
      try {
        const { count, error: countErr } = await supabase.from(table).select('id', { count: 'exact', head: true });
        if (countErr) {
          entry.status = 'fail';
          entry.error = countErr;
          entry.hint = inferRlsHint(countErr);
        } else {
          entry.count = count;
          const { data: sample, error: sampleErr } = await supabase.from(table).select('*').limit(1);
          if (sampleErr) {
            entry.status = 'warn';
            entry.sampleError = sampleErr;
            entry.hint = inferRlsHint(null, count, sampleErr);
          } else {
            entry.sample = sample;
            entry.status = count === 0 ? 'warn' : 'ok';
            entry.hint = inferRlsHint(null, count);
          }
        }
      } catch (e: unknown) {
        entry.status = 'fail';
        entry.error = e instanceof Error ? e.message : String(e);
      }
      results.push(entry);
    }
    setDbResults(results);
    bundleRef.current.db = results;
    setRunningDb(false);
  }, []);

  /* edge tests */
  const runEdgeTests = useCallback(async () => {
    setRunningEdge(true);
    const results: EdgeResult[] = [];
    for (const fn of UNIQUE_EDGE_FUNCTIONS) {
      const entry: EdgeResult = { name: fn.name, status: 'running', data: null, error: null, ms: 0 };
      const t0 = performance.now();
      try {
        const { data, error } = await supabase.functions.invoke(fn.name, { body: fn.body });
        entry.ms = Math.round(performance.now() - t0);
        if (error) {
          entry.status = 'fail';
          entry.error = { message: error.message, name: error.name, context: (error as any).context };
        } else {
          entry.status = 'ok';
          entry.data = data;
        }
      } catch (e: unknown) {
        entry.ms = Math.round(performance.now() - t0);
        entry.status = 'fail';
        entry.error = e instanceof Error ? e.message : String(e);
      }
      results.push(entry);
      setEdgeResults([...results]);
    }
    bundleRef.current.edge = results;
    setRunningEdge(false);
  }, []);

  const runAll = async () => {
    await Promise.all([runDbTests(), runEdgeTests()]);
  };

  /* support bundle */
  const copyBundle = () => {
    const bundle = {
      timestamp: new Date().toISOString(),
      env: { urlPresent: !!url, keyPresent: !!key, urlHost },
      db: bundleRef.current.db ?? dbResults,
      edge: bundleRef.current.edge ?? edgeResults,
      userAgent: navigator.userAgent,
      route: window.location.pathname,
    };
    navigator.clipboard.writeText(safeJsonStringify(bundle));
    toast.success('Support bundle copied');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <PageHeader
        title="Diagnostics"
        subtitle="Environment, database & edge function health checks"
        rightSlot={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={runAll} disabled={runningDb || runningEdge}>
              <RefreshCw className="w-4 h-4 mr-1" /> Run All
            </Button>
            <Button size="sm" variant="outline" onClick={copyBundle}>
              <ClipboardCheck className="w-4 h-4 mr-1" /> Copy Support Bundle
            </Button>
          </div>
        }
      />

      {/* ── Environment ── */}
      <section className="om-card rounded-lg border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Environment</h2>
        <div className="grid gap-2 text-sm font-mono">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">SUPABASE_URL:</span>
            {url ? <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">Present</Badge> : <Badge className="bg-red-600/20 text-red-400 border-red-600/30">Missing</Badge>}
            <span className="text-xs text-muted-foreground">{urlHost}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">ANON_KEY:</span>
            {key ? <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">Present</Badge> : <Badge className="bg-red-600/20 text-red-400 border-red-600/30">Missing</Badge>}
            <span className="text-xs text-muted-foreground">{maskKey(key)}</span>
          </div>
        </div>
      </section>

      {/* ── DB Tests ── */}
      <section className="om-card rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Database Tests</h2>
          <Button size="sm" variant="ghost" onClick={runDbTests} disabled={runningDb}>
            {runningDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
        {dbResults.length === 0 && !runningDb && (
          <p className="text-sm text-muted-foreground">Click Run to test database connectivity.</p>
        )}
        {dbResults.map((r) => (
          <div key={r.table} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              {statusBadge(r.status)}
              <span className="font-mono text-sm font-medium">{r.table}</span>
              {r.count !== null && <span className="text-xs text-muted-foreground">{r.count} rows</span>}
            </div>
            {r.hint && <p className="text-xs text-amber-400">{r.hint}</p>}
            {r.error && <JsonBlock data={r.error} label="Error" />}
            {r.sampleError && <JsonBlock data={r.sampleError} label="Sample Error" />}
            {r.sample && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ChevronDown className="w-3.5 h-3.5" /> Sample row
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <JsonBlock data={r.sample} />
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        ))}
      </section>

      {/* ── Edge Function Tests ── */}
      <section className="om-card rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Edge Function Tests</h2>
          <Button size="sm" variant="ghost" onClick={runEdgeTests} disabled={runningEdge}>
            {runningEdge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
        {edgeResults.length === 0 && !runningEdge && (
          <p className="text-sm text-muted-foreground">Click Run to invoke edge functions with minimal payloads.</p>
        )}
        {edgeResults.map((r) => (
          <Collapsible key={r.name}>
            <div className="border rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2">
                {statusBadge(r.status)}
                <span className="font-mono text-sm font-medium">{r.name}</span>
                {r.ms > 0 && <span className="text-xs text-muted-foreground">{r.ms}ms</span>}
              </div>
              {(r.data || r.error) && (
                <>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <ChevronDown className="w-3.5 h-3.5" /> Response
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <JsonBlock data={r.error ?? r.data} />
                  </CollapsibleContent>
                </>
              )}
            </div>
          </Collapsible>
        ))}
      </section>
    </div>
  );
}
