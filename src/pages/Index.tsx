import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StickyScannerHeader } from '@/components/scanner/StickyScannerHeader';
import { StickyFilterBar } from '@/components/scanner/StickyFilterBar';
import { ScannerSidebar } from '@/components/scanner/ScannerSidebar';
import { OpportunityResultsFeed } from '@/components/scanner/OpportunityResultsFeed';
import { ListingDetailsDrawer } from '@/components/scanner/ListingDetailsDrawer';
import { SimilarListingsDrawer } from '@/components/scanner/SimilarListingsDrawer';
import { ScannerEmptyState } from '@/components/scanner/ScannerEmptyState';
import { RawToPsaView } from '@/components/scanner/RawToPsaView';
import { useScanner } from '@/hooks/useScannerState';

export default function Index() {
  const { state, runSearch, activeModeState } = useScanner();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  // Sync URL query to scanner
  useEffect(() => {
    if (urlQuery && urlQuery !== state.query) {
      runSearch(urlQuery);
    }
  }, [urlQuery]);

  const isRawToPsa = state.viewMode === 'rawToPsa';
  const { results, isLoading, hasSearched } = activeModeState;
  const hasResults = results.length > 0 || isLoading;
  const drawerOpen = state.drawerMode === 'details' || state.drawerMode === 'compare';

  console.log(`[Index] viewMode=${state.viewMode} hasSearched=${hasSearched} results=${results.length} isLoading=${isLoading}`);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh)', background: 'var(--om-bg-0)' }}>
      <StickyScannerHeader />
      <StickyFilterBar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ScannerSidebar />

        {isRawToPsa ? (
          hasResults ? (
            <RawToPsaView />
          ) : hasSearched ? (
            <div className="flex-1 flex items-center justify-center p-8" style={{ color: 'var(--om-text-3)' }}>
              <p className="text-sm">No raw listings found for this query</p>
            </div>
          ) : (
            <ScannerEmptyState />
          )
        ) : hasResults ? (
          <OpportunityResultsFeed />
        ) : hasSearched ? (
          <div className="flex-1 flex items-center justify-center p-8" style={{ color: 'var(--om-text-3)' }}>
            <p className="text-sm">No results found</p>
          </div>
        ) : (
          <ScannerEmptyState />
        )}

        {/* Drawers only in scanner mode */}
        {!isRawToPsa && drawerOpen && state.drawerMode === 'details' && <ListingDetailsDrawer />}
        {!isRawToPsa && drawerOpen && state.drawerMode === 'compare' && <SimilarListingsDrawer />}
      </div>
    </div>
  );
}
