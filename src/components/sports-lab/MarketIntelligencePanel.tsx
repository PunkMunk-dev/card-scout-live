import { useEffect, useRef } from 'react';
import { TrendingUp, BarChart3, Layers } from 'lucide-react';
import { useCardMarketMetrics, type CardMarketMetrics } from '@/hooks/useCardMarketMetrics';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketIntelligencePanelProps {
  title: string;
  searchContext?: {
    playerName: string;
    brand?: string;
    year?: string;
  };
}

function MetricRow({ label, value, suffix }: { label: string; value: string | null; suffix?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px]" style={{ color: 'var(--om-text-2)' }}>{label}</span>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color: value ? 'var(--om-text-0)' : 'var(--om-text-3)' }}>
        {value ?? '—'}{suffix && value ? suffix : ''}
      </span>
    </div>
  );
}

export function MarketIntelligencePanel({ title, searchContext }: MarketIntelligencePanelProps) {
  const { metrics, isLoading, error, fetchMetrics } = useCardMarketMetrics();
  const fetchedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only fetch when visible (viewport-triggered)
  useEffect(() => {
    if (fetchedRef.current || !searchContext?.playerName) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fetchedRef.current) {
        fetchedRef.current = true;
        fetchMetrics(title, searchContext);
        observer.disconnect();
      }
    }, { threshold: 0.1, rootMargin: '100px' });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [title, searchContext, fetchMetrics]);

  // Don't render if no search context
  if (!searchContext?.playerName) return null;

  return (
    <div ref={containerRef} className="mt-2 rounded-lg p-2.5" style={{ background: 'var(--om-bg-2)', border: '1px solid var(--om-border-0)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 className="h-3 w-3" style={{ color: 'var(--om-accent)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--om-text-2)' }}>
          Market Intel
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : error ? (
        <p className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>Unable to load metrics</p>
      ) : !metrics ? (
        <p className="text-[10px]" style={{ color: 'var(--om-text-3)' }}>No market data available</p>
      ) : (
        <div className="space-y-0.5">
          <MetricRow
            label="Raw Median Sold"
            value={metrics.raw_median_price !== null ? `$${metrics.raw_median_price.toFixed(2)}` : null}
          />
          <MetricRow
            label="PSA 10 Median Sold"
            value={metrics.psa10_median_price !== null ? `$${metrics.psa10_median_price.toFixed(2)}` : null}
          />
          <div style={{ borderTop: '1px solid var(--om-divider)', margin: '4px 0' }} />
          <MetricRow
            label="Spread ($)"
            value={metrics.spread_amount !== null ? `$${metrics.spread_amount.toFixed(2)}` : null}
          />
          <MetricRow
            label="Spread (%)"
            value={metrics.spread_percent !== null ? `${metrics.spread_percent.toFixed(0)}` : null}
            suffix="%"
          />
          <div style={{ borderTop: '1px solid var(--om-divider)', margin: '4px 0' }} />
          <MetricRow
            label="Raw Comp Count"
            value={metrics.raw_comp_count > 0 ? String(metrics.raw_comp_count) : null}
          />
          <MetricRow
            label="PSA10 Comp Count"
            value={metrics.psa10_comp_count > 0 ? String(metrics.psa10_comp_count) : null}
          />
          {metrics.population !== null && (
            <MetricRow
              label="PSA Population"
              value={String(metrics.population)}
            />
          )}

          {/* Spread indicator */}
          {metrics.spread_percent !== null && metrics.spread_percent > 0 && (
            <div className="flex items-center gap-1 mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--om-divider)' }}>
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-[10px] font-medium text-green-500">
                {metrics.spread_percent >= 200 ? 'High ROI potential' : metrics.spread_percent >= 100 ? 'Good spread' : 'Moderate spread'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
