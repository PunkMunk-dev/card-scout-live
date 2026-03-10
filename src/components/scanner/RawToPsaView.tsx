import { useState, useMemo } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useScanner } from '@/hooks/useScannerState';
import { useRawToPsa } from '@/hooks/useRawToPsa';
import { computeMetrics, deriveConfidence } from '@/lib/computeRawToPsaMetrics';

export function RawToPsaView() {
  const { state, activeModeState } = useScanner();
  const { results, isLoading } = activeModeState;

  const [gradingCost, setGradingCost] = useState(150);
  const [sellFee, setSellFee] = useState(13);
  const [desiredProfit, setDesiredProfit] = useState(300);
  const [minSales, setMinSales] = useState(2);
  const [minRoi, setMinRoi] = useState(50);

  // Filter to non-junk raw listings only
  const rawListings = useMemo(
    () => results.filter(r => !r.isLikelyJunk),
    [results],
  );

  const psaMap = useRawToPsa(rawListings);

  // Build rows with metrics
  const rows = useMemo(() => {
    return rawListings.map(listing => {
      const psa = psaMap.get(listing.id);
      const rawPrice = listing.price ?? 0;
      const shipping = listing.shipping ?? 0;
      const medianSold = psa?.stats.medianSold ?? 0;
      const avgSold = psa?.stats.avgSold ?? 0;
      const salesCount = psa?.stats.salesCount ?? 0;
      const confidence = deriveConfidence(salesCount);

      const metrics = medianSold > 0
        ? computeMetrics(rawPrice, shipping, medianSold, gradingCost, sellFee, desiredProfit)
        : null;

      return {
        listing,
        psa,
        rawPrice,
        shipping,
        medianSold,
        avgSold,
        salesCount,
        confidence,
        metrics,
      };
    });
  }, [rawListings, psaMap, gradingCost, sellFee, desiredProfit]);

  // Apply filters
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (r.salesCount < minSales && r.salesCount > 0) return false;
      if (r.metrics && r.metrics.roiPercent < minRoi) return false;
      return true;
    });
  }, [rows, minSales, minRoi]);

  // Sort by ROI desc
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const roiA = a.metrics?.roiPercent ?? -9999;
      const roiB = b.metrics?.roiPercent ?? -9999;
      return roiB - roiA;
    });
  }, [filtered]);

  const anyLoading = Array.from(psaMap.values()).some(p => p.isLoading);

  if (!results.length && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" style={{ color: 'var(--om-text-3)' }}>
        <p className="text-sm">Search for a card to see Raw → PSA 10 analysis</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto p-3 md:p-4" style={{ background: 'var(--om-bg-0)' }}>
      {/* User inputs */}
      <div
        className="flex flex-wrap gap-3 mb-3 p-3 rounded-lg text-xs"
        style={{ background: 'var(--om-bg-1)', border: '1px solid var(--om-border-0)' }}
      >
        <InputField label="Grading Cost" value={gradingCost} onChange={setGradingCost} prefix="$" />
        <InputField label="Sell Fee %" value={sellFee} onChange={setSellFee} suffix="%" />
        <InputField label="Desired Profit" value={desiredProfit} onChange={setDesiredProfit} prefix="$" />
        <InputField label="Min Sales" value={minSales} onChange={setMinSales} />
        <InputField label="Min ROI %" value={minRoi} onChange={setMinRoi} suffix="%" />
        {anyLoading && (
          <div className="flex items-center gap-1.5 ml-auto" style={{ color: 'var(--om-text-3)' }}>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Fetching PSA data…</span>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-2 text-[11px]" style={{ color: 'var(--om-text-3)' }}>
        {sorted.length} of {rawListings.length} listings
        {minSales > 0 && ` (min ${minSales} comps)`}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: 'var(--om-bg-2)' }}>
              {['Card', 'Raw $', 'Ship', 'Total Buy', 'PSA 10 Avg', 'PSA 10 Med', 'Sales', 'Net Profit', 'ROI %', 'Max Buy', 'Conf.', ''].map(h => (
                <th
                  key={h}
                  className="px-2 py-1.5 text-left font-medium whitespace-nowrap"
                  style={{ color: 'var(--om-text-2)', borderBottom: '1px solid var(--om-border-0)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr
                key={row.listing.id}
                className="transition-colors"
                style={{ borderBottom: '1px solid var(--om-border-0)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--om-bg-1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="px-2 py-1.5 max-w-[240px]">
                  <div className="flex items-center gap-2">
                    {row.listing.imageUrl && (
                      <img src={row.listing.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                    )}
                    <span className="truncate" style={{ color: 'var(--om-text-0)' }} title={row.listing.title}>
                      {row.listing.normalizedLabel || row.listing.cleanedTitle}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1.5" style={{ color: 'var(--om-text-1)' }}>${row.rawPrice.toFixed(2)}</td>
                <td className="px-2 py-1.5" style={{ color: 'var(--om-text-2)' }}>${row.shipping.toFixed(2)}</td>
                <td className="px-2 py-1.5 font-medium" style={{ color: 'var(--om-text-0)' }}>
                  ${row.metrics?.totalBuyCost.toFixed(2) ?? (row.rawPrice + row.shipping).toFixed(2)}
                </td>
                <PsaCell value={row.avgSold} loading={row.psa?.isLoading} />
                <PsaCell value={row.medianSold} loading={row.psa?.isLoading} />
                <td className="px-2 py-1.5" style={{ color: row.salesCount > 0 ? 'var(--om-text-1)' : 'var(--om-text-3)' }}>
                  {row.psa?.isLoading ? '…' : row.salesCount || '—'}
                </td>
                <ProfitCell value={row.metrics?.netProfit ?? null} loading={row.psa?.isLoading} />
                <RoiCell value={row.metrics?.roiPercent ?? null} loading={row.psa?.isLoading} />
                <PsaCell value={row.metrics?.maxBuyPrice ?? 0} loading={row.psa?.isLoading} />
                <td className="px-2 py-1.5">
                  <ConfidenceBadge confidence={row.confidence} />
                </td>
                <td className="px-2 py-1.5">
                  {row.listing.ebayUrl && (
                    <a
                      href={row.listing.ebayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-[var(--om-bg-3)] inline-flex"
                      style={{ color: 'var(--om-text-2)' }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {sorted.map(row => (
          <div
            key={row.listing.id}
            className="p-3 rounded-lg text-xs"
            style={{ background: 'var(--om-bg-1)', border: '1px solid var(--om-border-0)' }}
          >
            <div className="flex items-start gap-2 mb-2">
              {row.listing.imageUrl && (
                <img src={row.listing.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--om-text-0)' }}>
                  {row.listing.normalizedLabel || row.listing.cleanedTitle}
                </p>
                <p style={{ color: 'var(--om-text-3)' }}>
                  Raw: ${row.rawPrice.toFixed(2)} + ${row.shipping.toFixed(2)} ship
                </p>
              </div>
              <ConfidenceBadge confidence={row.confidence} />
            </div>
            {row.metrics && row.medianSold > 0 ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <MobileStat label="PSA 10 Med" value={`$${row.medianSold.toFixed(0)}`} />
                <MobileStat
                  label="Net Profit"
                  value={`${row.metrics.netProfit >= 0 ? '+' : ''}$${row.metrics.netProfit.toFixed(0)}`}
                  color={row.metrics.netProfit >= 0 ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)'}
                />
                <MobileStat
                  label="ROI"
                  value={`${row.metrics.roiPercent >= 0 ? '+' : ''}${row.metrics.roiPercent.toFixed(0)}%`}
                  color={row.metrics.roiPercent >= 0 ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)'}
                />
              </div>
            ) : row.psa?.isLoading ? (
              <div className="flex items-center justify-center gap-1.5 py-2" style={{ color: 'var(--om-text-3)' }}>
                <Loader2 className="h-3 w-3 animate-spin" /> Loading PSA data…
              </div>
            ) : (
              <p className="text-center py-1" style={{ color: 'var(--om-text-3)' }}>No graded sales found</p>
            )}
            {row.listing.ebayUrl && (
              <a
                href={row.listing.ebayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-medium"
                style={{ background: 'var(--om-bg-2)', color: 'var(--om-text-1)' }}
              >
                <ExternalLink className="h-3 w-3" /> Open on eBay
              </a>
            )}
          </div>
        ))}
      </div>

      {sorted.length === 0 && !state.isLoading && (
        <p className="text-center text-sm py-8" style={{ color: 'var(--om-text-3)' }}>
          No results match your filters. Try lowering the minimum sales count.
        </p>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function InputField({ label, value, onChange, prefix, suffix }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span style={{ color: 'var(--om-text-2)' }}>{label}</span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--om-text-3)' }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className="w-16 h-6 rounded text-xs text-right om-input"
          style={{ paddingLeft: prefix ? '14px' : '6px', paddingRight: suffix ? '18px' : '6px' }}
        />
        {suffix && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--om-text-3)' }}>
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function PsaCell({ value, loading }: { value: number; loading?: boolean }) {
  if (loading) return <td className="px-2 py-1.5" style={{ color: 'var(--om-text-3)' }}>…</td>;
  if (!value) return <td className="px-2 py-1.5" style={{ color: 'var(--om-text-3)' }}>—</td>;
  return <td className="px-2 py-1.5" style={{ color: 'var(--om-text-1)' }}>${value.toFixed(2)}</td>;
}

function ProfitCell({ value, loading }: { value: number | null; loading?: boolean }) {
  if (loading) return <td className="px-2 py-1.5" style={{ color: 'var(--om-text-3)' }}>…</td>;
  if (value === null) return <td className="px-2 py-1.5" style={{ color: 'var(--om-text-3)' }}>—</td>;
  const color = value >= 0 ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)';
  return (
    <td className="px-2 py-1.5 font-medium" style={{ color }}>
      {value >= 0 ? '+' : ''}${value.toFixed(2)}
    </td>
  );
}

function RoiCell({ value, loading }: { value: number | null; loading?: boolean }) {
  if (loading) return <td className="px-2 py-1.5" style={{ color: 'var(--om-text-3)' }}>…</td>;
  if (value === null) return <td className="px-2 py-1.5" style={{ color: 'var(--om-text-3)' }}>—</td>;
  const color = value >= 0 ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)';
  return (
    <td className="px-2 py-1.5 font-medium" style={{ color }}>
      {value >= 0 ? '+' : ''}{value.toFixed(1)}%
    </td>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: 'hsla(142,71%,45%,0.15)', text: 'hsl(142 71% 45%)', label: 'High' },
    medium: { bg: 'hsla(45,93%,47%,0.15)', text: 'hsl(45 93% 47%)', label: 'Med' },
    low: { bg: 'hsla(25,95%,53%,0.15)', text: 'hsl(25 95% 53%)', label: 'Low' },
    none: { bg: 'hsla(0,0%,50%,0.1)', text: 'var(--om-text-3)', label: 'N/A' },
  };
  const s = styles[confidence] || styles.none;
  return (
    <span
      className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function MobileStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>{label}</p>
      <p className="font-medium" style={{ color: color || 'var(--om-text-0)' }}>{value}</p>
    </div>
  );
}
