import { Shield, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PsaCertData, PsaPopulationData } from '@/hooks/usePsaCertData';
import { Skeleton } from '@/components/ui/skeleton';

interface PsaDataSectionProps {
  certData: PsaCertData[] | null;
  populationData: PsaPopulationData | null;
  isLoading: boolean;
}

function MetricRow({ label, value, dimmed }: { label: string; value: string; dimmed?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={cn("text-[11px]", dimmed && "italic")} style={{ color: 'var(--om-text-2)' }}>{label}</span>
      <span className={cn("text-[11px] font-semibold tabular-nums", dimmed && "opacity-50")} style={{ color: 'var(--om-text-0)' }}>
        {value}
      </span>
    </div>
  );
}

export function PsaDataSection({ certData, populationData, isLoading }: PsaDataSectionProps) {
  if (isLoading) {
    return (
      <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--om-divider)' }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Shield className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--om-text-3)' }}>PSA Data</span>
        </div>
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  const hasAnyCert = certData && certData.length > 0;
  const hasPop = populationData !== null;

  // Don't render the section at all if there's no data
  if (!hasAnyCert && !hasPop) {
    return (
      <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--om-divider)' }}>
        <div className="flex items-center gap-1.5 mb-1">
          <Shield className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--om-text-3)' }}>PSA Data</span>
        </div>
        <MetricRow label="Cert Status" value="Not Verified" dimmed />
        <MetricRow label="Population" value="Unavailable" dimmed />
      </div>
    );
  }

  const latestCert = hasAnyCert ? certData![0] : null;

  return (
    <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--om-divider)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        {hasAnyCert ? (
          <ShieldCheck className="h-3 w-3" style={{ color: 'hsl(142 71% 45%)' }} />
        ) : (
          <Shield className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--om-text-3)' }}>PSA Data</span>
      </div>

      <MetricRow
        label="Cert Status"
        value={hasAnyCert ? 'Verified' : 'Not Verified'}
        dimmed={!hasAnyCert}
      />

      {latestCert?.grade && (
        <MetricRow label="Grade" value={`PSA ${latestCert.grade}`} />
      )}

      {hasPop ? (
        <MetricRow
          label="Population"
          value={populationData!.total_population.toLocaleString()}
        />
      ) : (
        <MetricRow label="Population" value="Unavailable" dimmed />
      )}
    </div>
  );
}
