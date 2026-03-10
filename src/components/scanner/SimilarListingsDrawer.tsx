import { useMemo } from 'react';
import { X, ExternalLink, Clock } from 'lucide-react';
import { useScanner } from '@/hooks/useScannerState';
import type { NormalizedListing } from '@/types/scanner';

export function SimilarListingsDrawer() {
  const { state, dispatch } = useScanner();

  const selectedListing = useMemo(
    () => state.scanner.results.find(r => r.id === state.comparisonListingId) ?? null,
    [state.scanner.results, state.comparisonListingId],
  );

  const clusterMembers = useMemo(() => {
    if (!selectedListing?.activeClusterId) return [];
    return state.scanner.results
      .filter(r => r.activeClusterId === selectedListing.activeClusterId && r.id !== selectedListing.id)
      .sort((a, b) => (a.totalCost ?? Infinity) - (b.totalCost ?? Infinity));
  }, [state.scanner.results, selectedListing]);

  if (!selectedListing || state.drawerMode !== 'compare') return null;

  return (
    <aside
      className="fixed inset-0 z-50 md:static md:z-auto md:w-80 shrink-0 md:border-l overflow-y-auto"
      style={{ background: 'var(--om-bg-1)', borderColor: 'var(--om-border-0)', height: 'calc(100vh - 72px)' }}
    >
      <div className="flex items-center justify-between px-3 py-2 sticky top-0 z-10" style={{ background: 'var(--om-bg-1)', borderBottom: '1px solid var(--om-border-0)' }}>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--om-text-0)' }}>Active Listing Comparison</span>
        <button onClick={() => dispatch({ type: 'SET_DRAWER_MODE', mode: null })} className="p-1 rounded hover:bg-[var(--om-bg-2)]">
          <X className="h-3.5 w-3.5" style={{ color: 'var(--om-text-3)' }} />
        </button>
      </div>

      {/* Selected listing summary */}
      <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--om-border-0)', background: 'var(--om-bg-2)' }}>
        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--om-text-0)' }}>{selectedListing.normalizedLabel}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--om-text-0)' }}>
            ${selectedListing.totalCost?.toFixed(2) ?? '—'}
          </span>
          {selectedListing.activeDiscountPercent !== null && (
            <span className="text-[10px] font-semibold" style={{ color: selectedListing.activeDiscountPercent > 0 ? 'var(--om-success)' : 'var(--om-danger)' }}>
              {selectedListing.activeDiscountPercent > 0 ? '-' : '+'}{Math.abs(selectedListing.activeDiscountPercent)}% vs active median
            </span>
          )}
        </div>
      </div>

      {/* Cluster stats */}
      {selectedListing.clusterCount >= 2 && (
        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--om-border-0)' }}>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[9px] uppercase" style={{ color: 'var(--om-text-3)' }}>Min</p>
              <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--om-text-0)' }}>${selectedListing.clusterMin?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase" style={{ color: 'var(--om-text-3)' }}>Median</p>
              <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--om-text-0)' }}>${selectedListing.clusterMedian?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase" style={{ color: 'var(--om-text-3)' }}>Max</p>
              <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--om-text-0)' }}>${selectedListing.clusterMax?.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-[9px] text-center mt-1.5" style={{ color: 'var(--om-text-3)' }}>
            {selectedListing.clusterCount} similar active listings · {selectedListing.clusterConfidence} confidence
          </p>
        </div>
      )}

      {/* Comp listings */}
      {clusterMembers.length > 0 ? (
        <div className="p-2 space-y-1">
          {clusterMembers.map(comp => (
            <CompRow key={comp.id} listing={comp} selectedTotalCost={selectedListing.totalCost} />
          ))}
        </div>
      ) : (
        <div className="px-3 py-8 text-center">
          <p className="text-[11px]" style={{ color: 'var(--om-text-3)' }}>
            No similar active listings found in current results for comparison.
          </p>
        </div>
      )}
    </aside>
  );
}

function CompRow({ listing, selectedTotalCost }: { listing: NormalizedListing; selectedTotalCost: number | null }) {
  const delta = selectedTotalCost !== null && listing.totalCost !== null
    ? listing.totalCost - selectedTotalCost
    : null;

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[var(--om-bg-2)]"
      style={{ border: '1px solid var(--om-border-0)' }}
    >
      {listing.imageUrl ? (
        <img src={listing.imageUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" style={{ background: 'var(--om-bg-3)' }} />
      ) : (
        <div className="w-9 h-9 rounded shrink-0" style={{ background: 'var(--om-bg-3)' }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] truncate" style={{ color: 'var(--om-text-1)' }}>{listing.normalizedLabel}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--om-text-0)' }}>
            ${listing.totalCost?.toFixed(2) ?? '—'}
          </span>
          {delta !== null && (
            <span className="text-[10px] font-semibold" style={{ color: delta > 0 ? 'var(--om-danger)' : 'var(--om-success)' }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(2)}
            </span>
          )}
          {listing.timeLeftLabel && (
            <span className="text-[9px] flex items-center gap-0.5" style={{ color: 'var(--om-warning)' }}>
              <Clock className="h-2.5 w-2.5" />{listing.timeLeftLabel}
            </span>
          )}
        </div>
      </div>
      {listing.ebayUrl && (
        <a href={listing.ebayUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 rounded hover:bg-[var(--om-bg-3)]">
          <ExternalLink className="h-3 w-3" style={{ color: 'var(--om-text-3)' }} />
        </a>
      )}
    </div>
  );
}
