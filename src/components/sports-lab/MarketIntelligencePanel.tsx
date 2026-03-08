import { useEffect, useRef, useState } from 'react';
import { TrendingUp, BarChart3, ChevronDown, ChevronUp, ExternalLink, AlertTriangle } from 'lucide-react';
import { useCardMarketMetrics, getConfidenceLevel, RAW_THRESHOLD, PSA10_THRESHOLD, type SoldComp } from '@/hooks/useCardMarketMetrics';
import { usePsaCertData } from '@/hooks/usePsaCertData';
import { Skeleton } from '@/components/ui/skeleton';
import { CompManagementControls } from './CompManagementControls';
import { PsaDataSection } from './PsaDataSection';
import { PsaMappingControls } from './PsaMappingControls';
import { cn } from '@/lib/utils';

interface MarketIntelligencePanelProps {
  title: string;
  searchContext?: {
    playerName: string;
    brand?: string;
    year?: string;
  };
}

function MetricRow({ label, value, suffix, dimmed }: { label: string; value: string | null; suffix?: string; dimmed?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={cn("text-[11px]", dimmed && "italic")} style={{ color: 'var(--om-text-2)' }}>{label}</span>
      <span className={cn("text-[11px] font-semibold tabular-nums", dimmed && "opacity-50")} style={{ color: value ? 'var(--om-text-0)' : 'var(--om-text-3)' }}>
        {value ?? '—'}{suffix && value ? suffix : ''}
      </span>
    </div>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return '—'; }
}

function ConfidenceBadge({ level }: { level: 'full' | 'limited' | 'insufficient' }) {
  if (level === 'full') return null;
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
      style={{
        background: level === 'limited' ? 'hsl(45 93% 47% / 0.15)' : 'hsl(0 84% 60% / 0.15)',
        color: level === 'limited' ? 'hsl(45 93% 47%)' : 'hsl(0 84% 60%)',
      }}>
      <AlertTriangle className="h-2.5 w-2.5" />
      {level === 'limited' ? 'Limited data' : 'Insufficient data'}
    </div>
  );
}

function CompsSection({ comps, onMutated }: { comps: SoldComp[]; onMutated: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const exactComps = comps.filter(c => c.confidence_score === 'exact' && !c.excluded);
  const broadComps = comps.filter(c => c.confidence_score === 'high' && !c.excluded);
  const excludedComps = comps.filter(c => c.excluded || c.confidence_score === 'excluded' || c.confidence_score === 'low' || c.confidence_score === 'medium');

  if (comps.length === 0) return null;

  return (
    <div className="mt-1.5" style={{ borderTop: '1px solid var(--om-divider)' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between py-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--om-text-3)' }}>
          View comps used ({exactComps.length + broadComps.length})
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} /> : <ChevronDown className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />}
      </button>
      {expanded && (
        <div className="space-y-2 pb-1">
          {exactComps.length > 0 && <CompGroup label="Exact Match" comps={exactComps} onMutated={onMutated} />}
          {broadComps.length > 0 && <CompGroup label="Broad Match" comps={broadComps} onMutated={onMutated} />}
          {excludedComps.length > 0 && <CompGroup label="Excluded" comps={excludedComps} dimmed onMutated={onMutated} />}
        </div>
      )}
    </div>
  );
}

function CompGroup({ label, comps, dimmed, onMutated }: { label: string; comps: SoldComp[]; dimmed?: boolean; onMutated: () => void }) {
  return (
    <div>
      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: dimmed ? 'var(--om-text-3)' : 'var(--om-accent)' }}>
        {label} ({comps.length})
      </span>
      <div className="mt-0.5 space-y-0.5">
        {comps.slice(0, 10).map((c, i) => (
          <div key={i} className={cn("flex items-start gap-1.5 text-[9px] leading-tight py-0.5", dimmed && "opacity-40")}
            style={{ borderBottom: '1px solid var(--om-divider)' }}>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ color: 'var(--om-text-1)' }}>{c.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="tabular-nums font-medium" style={{ color: 'var(--om-text-0)' }}>${c.total_price.toFixed(2)}</span>
                <span style={{ color: 'var(--om-text-3)' }}>{formatDate(c.sold_at)}</span>
                <span className="uppercase" style={{ color: c.raw_or_graded === 'graded' ? 'var(--om-accent)' : 'var(--om-text-3)' }}>
                  {c.raw_or_graded === 'graded' && c.grader ? `${c.grader} ${c.grade}` : c.raw_or_graded}
                </span>
              </div>
              {c.match_reason && (
                <p className="text-[8px] mt-0.5 italic" style={{ color: 'var(--om-text-3)' }}>{c.match_reason}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {c.id && <CompManagementControls saleId={c.id} currentConfidence={c.confidence_score} onMutated={onMutated} />}
              {c.url && (
                <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-2.5 w-2.5 mt-0.5" style={{ color: 'var(--om-text-3)' }} />
                </a>
              )}
            </div>
          </div>
        ))}
        {comps.length > 10 && (
          <p className="text-[8px]" style={{ color: 'var(--om-text-3)' }}>+{comps.length - 10} more</p>
        )}
      </div>
    </div>
  );
}

export function MarketIntelligencePanel({ title, searchContext }: MarketIntelligencePanelProps) {
  const { metrics, comps, isLoading, error, fetchMetrics, refetch } = useCardMarketMetrics();
  const { certData, populationData, isLoading: psaLoading, fetchPsaData } = usePsaCertData();
  const fetchedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Fetch PSA data once metrics resolve with a card_identity_key
  useEffect(() => {
    if (metrics && (metrics as any).card_identity_key) {
      fetchPsaData((metrics as any).card_identity_key);
    }
  }, [metrics, fetchPsaData]);

  const handleMutated = () => {
    if (searchContext) refetch(title, searchContext);
  };

  if (!searchContext?.playerName) return null;

  const confidence = getConfidenceLevel(metrics);
  const showSpread = confidence === 'full';
  const cardIdentityKey = (metrics as any)?.card_identity_key;

  return (
    <div ref={containerRef} className="mt-2 rounded-lg p-2.5" style={{ background: 'var(--om-bg-2)', border: '1px solid var(--om-border-0)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 className="h-3 w-3" style={{ color: 'var(--om-accent)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--om-text-2)' }}>
          Market Intel
        </span>
        <div className="ml-auto">
          <ConfidenceBadge level={confidence} />
        </div>
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
            dimmed={metrics.raw_comp_count < RAW_THRESHOLD}
          />
          <MetricRow
            label="PSA 10 Median Sold"
            value={metrics.psa10_median_price !== null ? `$${metrics.psa10_median_price.toFixed(2)}` : null}
            dimmed={metrics.psa10_comp_count < PSA10_THRESHOLD}
          />
          <div style={{ borderTop: '1px solid var(--om-divider)', margin: '4px 0' }} />
          {showSpread ? (
            <>
              <MetricRow
                label="Spread ($)"
                value={metrics.spread_amount !== null ? `$${metrics.spread_amount.toFixed(2)}` : null}
              />
              <MetricRow
                label="Spread (%)"
                value={metrics.spread_percent !== null ? `${metrics.spread_percent.toFixed(0)}` : null}
                suffix="%"
              />
            </>
          ) : (
            <p className="text-[9px] italic py-1" style={{ color: 'var(--om-text-3)' }}>
              Need ≥{RAW_THRESHOLD} raw + ≥{PSA10_THRESHOLD} PSA10 comps for spread
            </p>
          )}
          <div style={{ borderTop: '1px solid var(--om-divider)', margin: '4px 0' }} />
          <MetricRow
            label="Raw Comp Count"
            value={metrics.raw_comp_count > 0 ? String(metrics.raw_comp_count) : null}
          />
          <MetricRow
            label="PSA10 Comp Count"
            value={metrics.psa10_comp_count > 0 ? String(metrics.psa10_comp_count) : null}
          />

          {showSpread && metrics.spread_percent !== null && metrics.spread_percent > 0 && (
            <div className="flex items-center gap-1 mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--om-divider)' }}>
              <TrendingUp className="h-3 w-3" style={{ color: 'hsl(142 71% 45%)' }} />
              <span className="text-[10px] font-medium" style={{ color: 'hsl(142 71% 45%)' }}>
                {metrics.spread_percent >= 200 ? 'High ROI potential' : metrics.spread_percent >= 100 ? 'Good spread' : 'Moderate spread'}
              </span>
            </div>
          )}

          <CompsSection comps={comps} onMutated={handleMutated} />
        </div>
      )}
    </div>
  );
}
