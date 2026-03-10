import { useState, useMemo, useCallback } from 'react';
import {
  Search, Download, RefreshCw, Play, Loader2, ChevronRight, X,
  ExternalLink, AlertTriangle, CheckCircle2, HelpCircle, Database, Layers,
  Sprout,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useOnepieceMarket,
  useOnepieceIngest,
  useOnepieceListingDetails,
  useOnepieceDiagnostics,
  exportMarketCsv,
  type OnepieceMarketRow,
  type MarketFilters,
} from '@/hooks/useOnepieceMarket';

const DATE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: 'All', value: 0 },
];

const CONF_OPTIONS = [
  { label: 'High', value: 'high' as const },
  { label: 'Med+', value: 'medium_high' as const },
  { label: 'All', value: 'all' as const },
];

export default function AdminOnepieceMarket() {
  const [filters, setFilters] = useState<MarketFilters>({
    confidenceFilter: 'medium_high',
    language: '',
    setName: '',
    characterSearch: '',
    cardNumberSearch: '',
    minRawSales: 2,
    minPsa10Sales: 1,
    dateWindow: 0,
  });

  const [selectedRow, setSelectedRow] = useState<OnepieceMarketRow | null>(null);
  const [sortKey, setSortKey] = useState<string>('last_updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const { data: rows, isLoading, error, refetch } = useOnepieceMarket(filters);
  const { data: diagnostics, refetch: refetchDiag } = useOnepieceDiagnostics();
  const ingest = useOnepieceIngest();

  const sorted = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }, [sortKey]);

  const runAction = useCallback((action: string, label: string) => {
    setLastError(null);
    setLastResult(null);
    ingest.mutate({ action }, {
      onSuccess: (data: any) => {
        const msg = JSON.stringify(data);
        setLastResult(`${label}: ${msg}`);
        toast.success(`${label} complete`, { description: msg });
        refetchDiag();
      },
      onError: (err: any) => {
        const msg = String(err);
        setLastError(`${label}: ${msg}`);
        toast.error(`${label} failed`, { description: msg });
      },
    });
  }, [ingest, refetchDiag]);

  const updateFilter = useCallback((key: keyof MarketFilters, value: unknown) => {
    setFilters(f => ({ ...f, [key]: value }));
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--om-bg-0)', color: 'var(--om-text-0)' }}>
      {/* Sticky header controls */}
      <div
        className="sticky top-0 z-30 p-3 border-b flex flex-wrap gap-2 items-center text-xs"
        style={{ background: 'var(--om-bg-1)', borderColor: 'var(--om-border-0)' }}
      >
        <span className="font-semibold text-sm mr-2" style={{ color: 'var(--om-text-0)' }}>
          OP Market Admin
        </span>

        <button
          onClick={() => runAction('seed', 'Seed')}
          disabled={ingest.isPending}
          className="om-btn-sm flex items-center gap-1"
        >
          {ingest.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sprout className="h-3 w-3" />}
          Seed Test Data
        </button>
        <button
          onClick={() => runAction('group', 'Group')}
          disabled={ingest.isPending}
          className="om-btn-sm flex items-center gap-1"
        >
          {ingest.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
          Run Grouping
        </button>
        <button onClick={() => refetch()} className="om-btn-sm flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
        <button
          onClick={() => rows && exportMarketCsv(rows)}
          disabled={!rows?.length}
          className="om-btn-sm flex items-center gap-1"
        >
          <Download className="h-3 w-3" /> Export CSV
        </button>

        <span className="w-px h-5 mx-1" style={{ background: 'var(--om-border-0)' }} />

        {/* Date window */}
        <div className="flex gap-0.5 rounded overflow-hidden" style={{ border: '1px solid var(--om-border-0)' }}>
          {DATE_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => updateFilter('dateWindow', o.value)}
              className="px-2 py-1 text-[11px] transition-colors"
              style={{
                background: filters.dateWindow === o.value ? 'var(--om-accent)' : 'transparent',
                color: filters.dateWindow === o.value ? 'var(--om-bg-0)' : 'var(--om-text-2)',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Confidence */}
        <div className="flex gap-0.5 rounded overflow-hidden" style={{ border: '1px solid var(--om-border-0)' }}>
          {CONF_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => updateFilter('confidenceFilter', o.value)}
              className="px-2 py-1 text-[11px] transition-colors"
              style={{
                background: filters.confidenceFilter === o.value ? 'var(--om-accent)' : 'transparent',
                color: filters.confidenceFilter === o.value ? 'var(--om-bg-0)' : 'var(--om-text-2)',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        <span className="w-px h-5 mx-1" style={{ background: 'var(--om-border-0)' }} />

        <FilterInput
          placeholder="Character"
          value={filters.characterSearch}
          onChange={v => updateFilter('characterSearch', v)}
        />
        <FilterInput
          placeholder="Card #"
          value={filters.cardNumberSearch}
          onChange={v => updateFilter('cardNumberSearch', v)}
        />
        <FilterInput
          placeholder="Set"
          value={filters.setName}
          onChange={v => updateFilter('setName', v)}
        />
        <FilterInput
          placeholder="Lang"
          value={filters.language}
          onChange={v => updateFilter('language', v)}
          width="w-14"
        />

        <label className="flex items-center gap-1" style={{ color: 'var(--om-text-2)' }}>
          Raw≥
          <input
            type="number"
            value={filters.minRawSales}
            onChange={e => updateFilter('minRawSales', Number(e.target.value) || 0)}
            className="w-10 h-6 rounded text-xs text-center om-input"
          />
        </label>
        <label className="flex items-center gap-1" style={{ color: 'var(--om-text-2)' }}>
          PSA≥
          <input
            type="number"
            value={filters.minPsa10Sales}
            onChange={e => updateFilter('minPsa10Sales', Number(e.target.value) || 0)}
            className="w-10 h-6 rounded text-xs text-center om-input"
          />
        </label>

        {rows && (
          <span className="ml-auto text-[11px]" style={{ color: 'var(--om-text-3)' }}>
            {sorted.length} rows
          </span>
        )}
      </div>

      {/* Diagnostics bar */}
      <div
        className="px-3 py-1.5 border-b flex flex-wrap gap-4 items-center text-[11px]"
        style={{ background: 'var(--om-bg-0)', borderColor: 'var(--om-border-0)' }}
      >
        <span className="flex items-center gap-1" style={{ color: 'var(--om-text-2)' }}>
          <Database className="h-3 w-3" />
          Cache: <strong style={{ color: 'var(--om-text-0)' }}>{diagnostics?.cacheCount ?? '—'}</strong>
        </span>
        <span className="flex items-center gap-1" style={{ color: 'var(--om-text-2)' }}>
          <Layers className="h-3 w-3" />
          Grouped: <strong style={{ color: 'var(--om-text-0)' }}>{diagnostics?.groupedCount ?? '—'}</strong>
        </span>
        {lastResult && (
          <span className="flex items-center gap-1" style={{ color: 'hsl(142 71% 45%)' }}>
            <CheckCircle2 className="h-3 w-3" />
            {lastResult}
          </span>
        )}
        {lastError && (
          <span className="flex items-center gap-1" style={{ color: 'hsl(0 84% 60%)' }}>
            <AlertTriangle className="h-3 w-3" />
            {lastError}
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 flex min-h-0">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full gap-2" style={{ color: 'var(--om-text-3)' }}>
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full gap-2 text-sm" style={{ color: 'hsl(0 84% 60%)' }}>
              <AlertTriangle className="h-4 w-4" /> {String(error)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--om-text-3)' }}>
              <HelpCircle className="h-6 w-6" />
              <p className="text-sm">No market data found</p>
              <p className="text-xs">Click "Seed Test Data" → then "Run Grouping" to populate</p>
            </div>
          ) : (
            <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background: 'var(--om-bg-2)' }}>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className="px-2 py-1.5 text-left font-medium whitespace-nowrap cursor-pointer select-none"
                      style={{ color: 'var(--om-text-2)', borderBottom: '1px solid var(--om-border-0)' }}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                  ))}
                  <th className="px-2 py-1.5" style={{ borderBottom: '1px solid var(--om-border-0)' }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map(row => (
                  <tr
                    key={row.normalized_card_key}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--om-border-0)' }}
                    onClick={() => setSelectedRow(row)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--om-bg-1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-2 py-1.5" style={{ color: 'var(--om-text-0)' }}>{row.character || '—'}</td>
                    <td className="px-2 py-1.5 font-mono" style={{ color: 'var(--om-text-1)' }}>{row.card_number || '—'}</td>
                    <td className="px-2 py-1.5" style={{ color: 'var(--om-text-2)' }}>{row.set_name || '—'}</td>
                    <td className="px-2 py-1.5" style={{ color: 'var(--om-text-2)' }}>{row.variant || '—'}</td>
                    <td className="px-2 py-1.5" style={{ color: 'var(--om-text-2)' }}>{row.language || '—'}</td>
                    <td className="px-2 py-1.5" style={{ color: 'var(--om-text-1)' }}>
                      {row.raw_avg_price_usd != null ? `$${row.raw_avg_price_usd.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-2 py-1.5" style={{ color: row.raw_sale_count > 0 ? 'var(--om-text-1)' : 'var(--om-text-3)' }}>
                      {row.raw_sale_count}
                    </td>
                    <td className="px-2 py-1.5" style={{ color: 'var(--om-text-1)' }}>
                      {row.psa10_avg_price_usd != null ? `$${row.psa10_avg_price_usd.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-2 py-1.5" style={{ color: row.psa10_sale_count > 0 ? 'var(--om-text-1)' : 'var(--om-text-3)' }}>
                      {row.psa10_sale_count}
                    </td>
                    <SpreadCell value={row.price_spread_usd} />
                    <td className="px-2 py-1.5" style={{ color: 'var(--om-text-1)' }}>
                      {row.multiple != null ? `${row.multiple.toFixed(1)}x` : '—'}
                    </td>
                    <td className="px-2 py-1.5"><ConfBadge v={row.match_confidence} /></td>
                    <td className="px-2 py-1.5" style={{ color: 'var(--om-text-3)' }}>
                      {row.last_updated_at ? new Date(row.last_updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-2 py-1.5">
                      <ChevronRight className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail drawer */}
        {selectedRow && (
          <DetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
        )}
      </div>
    </div>
  );
}

// ─── Column config ───
const COLUMNS = [
  { key: 'character', label: 'Character' },
  { key: 'card_number', label: 'Card #' },
  { key: 'set_name', label: 'Set' },
  { key: 'variant', label: 'Variant' },
  { key: 'language', label: 'Lang' },
  { key: 'raw_avg_price_usd', label: 'Raw Avg' },
  { key: 'raw_sale_count', label: 'Raw Sales' },
  { key: 'psa10_avg_price_usd', label: 'PSA 10 Avg' },
  { key: 'psa10_sale_count', label: 'PSA 10 Sales' },
  { key: 'price_spread_usd', label: 'Spread' },
  { key: 'multiple', label: 'Multiple' },
  { key: 'match_confidence', label: 'Conf.' },
  { key: 'last_updated_at', label: 'Updated' },
];

// ─── Sub-components ───

function FilterInput({ placeholder, value, onChange, width = 'w-24' }: {
  placeholder: string; value: string; onChange: (v: string) => void; width?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
      <input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${width} h-6 rounded text-xs pl-5 pr-1.5 om-input`}
      />
    </div>
  );
}

function SpreadCell({ value }: { value: number | null }) {
  if (value == null) return <td className="px-2 py-1.5" style={{ color: 'var(--om-text-3)' }}>—</td>;
  const color = value >= 0 ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)';
  return (
    <td className="px-2 py-1.5 font-medium" style={{ color }}>
      {value >= 0 ? '+' : ''}${value.toFixed(2)}
    </td>
  );
}

function ConfBadge({ v }: { v: string | null }) {
  const styles: Record<string, { bg: string; fg: string }> = {
    high: { bg: 'hsla(142,71%,45%,0.15)', fg: 'hsl(142 71% 45%)' },
    medium: { bg: 'hsla(45,93%,47%,0.15)', fg: 'hsl(45 93% 47%)' },
    low: { bg: 'hsla(25,95%,53%,0.15)', fg: 'hsl(25 95% 53%)' },
  };
  const s = styles[v || ''] || { bg: 'hsla(0,0%,50%,0.1)', fg: 'var(--om-text-3)' };
  return (
    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: s.bg, color: s.fg }}>
      {v || 'N/A'}
    </span>
  );
}

function DetailDrawer({ row, onClose }: { row: OnepieceMarketRow; onClose: () => void }) {
  const { data: listings, isLoading } = useOnepieceListingDetails(row.normalized_card_key);

  const rawListings = listings?.filter((l: any) => l.listing_type === 'raw') || [];
  const psaListings = listings?.filter((l: any) => l.listing_type === 'psa10') || [];

  return (
    <div
      className="w-[420px] border-l overflow-y-auto flex-shrink-0"
      style={{ background: 'var(--om-bg-1)', borderColor: 'var(--om-border-0)' }}
    >
      <div className="sticky top-0 z-10 p-3 border-b flex items-center justify-between" style={{ background: 'var(--om-bg-1)', borderColor: 'var(--om-border-0)' }}>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--om-text-0)' }}>
            {row.character || 'Unknown'} — {row.card_number || '?'}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--om-text-3)' }}>
            {row.set_name || ''} {row.variant ? `· ${row.variant}` : ''} {row.language ? `· ${row.language}` : ''}
          </p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--om-bg-2)]">
          <X className="h-4 w-4" style={{ color: 'var(--om-text-2)' }} />
        </button>
      </div>

      <div className="p-3 space-y-4 text-xs">
        <Section title="Card Identity">
          <DetailRow label="Normalized Key" value={row.normalized_card_key} />
          <DetailRow label="Confidence" value={row.match_confidence || 'N/A'} />
          {row.notes && <DetailRow label="Notes" value={row.notes} />}
        </Section>

        <Section title="Parser Details">
          <DetailRow label="Card Number" value={row.card_number || 'not detected'} />
          <DetailRow label="Language" value={row.language || 'not detected'} />
          <DetailRow label="Set" value={row.set_name || 'not detected'} />
          <DetailRow label="Variant" value={row.variant || 'not detected'} />
          <DetailRow
            label="Why this confidence"
            value={
              row.match_confidence === 'high'
                ? 'Exact card number match, no conflicts'
                : row.match_confidence === 'medium'
                ? 'Card number matches but some metadata missing'
                : 'Missing card number or metadata conflicts detected'
            }
          />
        </Section>

        <Section title="Market Summary">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Raw Avg" value={row.raw_avg_price_usd != null ? `$${row.raw_avg_price_usd.toFixed(2)}` : '—'} />
            <StatCard label="Raw Sales" value={String(row.raw_sale_count)} />
            <StatCard label="PSA 10 Avg" value={row.psa10_avg_price_usd != null ? `$${row.psa10_avg_price_usd.toFixed(2)}` : '—'} />
            <StatCard label="PSA 10 Sales" value={String(row.psa10_sale_count)} />
            <StatCard
              label="Spread"
              value={row.price_spread_usd != null ? `$${row.price_spread_usd.toFixed(2)}` : '—'}
              color={row.price_spread_usd != null && row.price_spread_usd >= 0 ? 'hsl(142 71% 45%)' : undefined}
            />
            <StatCard label="Multiple" value={row.multiple != null ? `${row.multiple.toFixed(1)}x` : '—'} />
          </div>
        </Section>

        <Section title={`Raw Sold Comps (${rawListings.length})`}>
          {isLoading ? (
            <div className="flex items-center gap-1" style={{ color: 'var(--om-text-3)' }}>
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          ) : rawListings.length === 0 ? (
            <p style={{ color: 'var(--om-text-3)' }}>No raw comps</p>
          ) : (
            <div className="space-y-1.5">
              {rawListings.map((l: any) => <CompRow key={l.id} listing={l} />)}
            </div>
          )}
        </Section>

        <Section title={`PSA 10 Sold Comps (${psaListings.length})`}>
          {isLoading ? (
            <div className="flex items-center gap-1" style={{ color: 'var(--om-text-3)' }}>
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          ) : psaListings.length === 0 ? (
            <p style={{ color: 'var(--om-text-3)' }}>No PSA 10 comps</p>
          ) : (
            <div className="space-y-1.5">
              {psaListings.map((l: any) => <CompRow key={l.id} listing={l} />)}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-[11px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--om-text-3)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span style={{ color: 'var(--om-text-2)' }}>{label}</span>
      <span className="text-right max-w-[60%] break-all" style={{ color: 'var(--om-text-0)' }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2 rounded" style={{ background: 'var(--om-bg-2)' }}>
      <p className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>{label}</p>
      <p className="font-medium" style={{ color: color || 'var(--om-text-0)' }}>{value}</p>
    </div>
  );
}

function CompRow({ listing }: { listing: any }) {
  return (
    <div className="p-2 rounded flex items-start gap-2" style={{ background: 'var(--om-bg-2)' }}>
      <div className="flex-1 min-w-0">
        <p className="truncate" style={{ color: 'var(--om-text-0)' }} title={listing.title}>
          {listing.title}
        </p>
        <div className="flex gap-3 mt-0.5" style={{ color: 'var(--om-text-2)' }}>
          <span>{listing.sold_price_usd != null ? `$${Number(listing.sold_price_usd).toFixed(2)}` : '—'}</span>
          <span>{listing.sold_date ? new Date(listing.sold_date).toLocaleDateString() : '—'}</span>
          {listing.outlier_flag && (
            <span className="flex items-center gap-0.5" style={{ color: 'hsl(25 95% 53%)' }}>
              <AlertTriangle className="h-3 w-3" /> outlier
            </span>
          )}
        </div>
      </div>
      {listing.listing_url && (
        <a
          href={listing.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded hover:bg-[var(--om-bg-3)] flex-shrink-0"
          style={{ color: 'var(--om-text-2)' }}
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
