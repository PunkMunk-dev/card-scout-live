import React from 'react';
import { TerminalCard } from './TerminalCard';
import { PackageX } from 'lucide-react';
import { ResultsSkeletonGrid } from './ResultsSkeletonGrid';
import type { EbayListing, SearchFilters } from '@/types/tcg';
import type { ProcessedListing } from '@/types/tcgFilters';

interface TerminalGridProps {
  listings: (EbayListing | ProcessedListing)[] | undefined;
  isLoading: boolean;
  error: Error | null;
  setName?: string;
  tierLabel?: string;
  activeSort?: SearchFilters['sort'];
}

export const TerminalGrid = React.forwardRef<HTMLDivElement, TerminalGridProps>(
  ({ listings, isLoading, error, setName, tierLabel, activeSort }, ref) => {
    if (isLoading) return <ResultsSkeletonGrid />;

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <PackageX className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-xs text-muted-foreground">Failed to load listings</p>
        </div>
      );
    }

    if (!listings || listings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PackageX className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No cards found for this search.</p>
          <p className="text-xs text-muted-foreground/70">Try adjusting your filters or selecting a different set.</p>
        </div>
      );
    }

    return (
      <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.map((listing, index) => (
          <TerminalCard
            key={listing.itemId}
            listing={listing}
            setName={setName}
            rarityTag={tierLabel}
            rank={index + 1}
            activeSort={activeSort}
          />
        ))}
      </div>
    );
  }
);

TerminalGrid.displayName = 'TerminalGrid';
