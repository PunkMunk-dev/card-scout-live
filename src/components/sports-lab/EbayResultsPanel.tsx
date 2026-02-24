import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Loader2, AlertCircle, ArrowUpDown, Target, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EbayListingCard } from './EbayListingCard';
import { SkeletonCard } from './SkeletonCard';
import { useSportsEbaySearch } from '@/hooks/useSportsEbaySearch';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EbaySearchParams, SortOption, EbayListing } from '@/types/sportsEbay';

const GRADING_COST = 25;

function sortListings(listings: EbayListing[], sortOption: SortOption): EbayListing[] {
  const sorted = [...listings];
  switch (sortOption) {
    case 'price-high': return sorted.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    case 'price-low': return sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    case 'quality-high': return sorted.sort((a, b) => (b.imageQualityScore ?? -999) - (a.imageQualityScore ?? -999));
    case 'ending-soon': return sorted.sort((a, b) => (a.itemEndDate ? new Date(a.itemEndDate).getTime() : Infinity) - (b.itemEndDate ? new Date(b.itemEndDate).getTime() : Infinity));
    case 'newest': default: return sorted.sort((a, b) => (b.listingDate ? new Date(b.listingDate).getTime() : 0) - (a.listingDate ? new Date(a.listingDate).getTime() : 0));
  }
}

interface EbayResultsPanelProps {
  searchParams: EbaySearchParams; traitLabels?: string[]; sportKey?: string | null;
  onResultCountChange?: (count: number) => void; onLoadingChange?: (loading: boolean) => void; onReset?: () => void;
}

type PriceRange = 'all' | '10-50' | '50-100' | '100-250' | '250-500' | '500+';
const PRICE_RANGES: { value: PriceRange; label: string; min: number; max: number | null }[] = [
  { value: 'all', label: 'All Prices', min: 10, max: null },
  { value: '10-50', label: '$10-$50', min: 10, max: 50 },
  { value: '50-100', label: '$50-$100', min: 50, max: 100 },
  { value: '100-250', label: '$100-$250', min: 100, max: 250 },
  { value: '250-500', label: '$250-$500', min: 250, max: 500 },
  { value: '500+', label: '$500+', min: 500, max: null },
];

export const EbayResultsPanel = React.forwardRef<HTMLDivElement, EbayResultsPanelProps>(function EbayResultsPanel({ searchParams, traitLabels, sportKey, onResultCountChange, onLoadingChange, onReset }: EbayResultsPanelProps, ref) {
  const { listings, isLoading, isLoadingMore, isLoadingAll, error, hasMore, search, loadMore, loadAll, cancelLoadAll } = useSportsEbaySearch();
  const lastSearchRef = useRef<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('quality-high');
  const [showAuctionsOnly, setShowAuctionsOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const filteredCountRef = useRef(0);
  const loadAllTriggeredRef = useRef(false);

  useEffect(() => { setSortOption(showAuctionsOnly ? 'ending-soon' : 'quality-high'); }, [showAuctionsOnly]);

  useEffect(() => {
    if (!searchParams.playerName) return;
    const key = JSON.stringify({ playerName: searchParams.playerName, brand: searchParams.brand, traits: searchParams.traits });
    if (key !== lastSearchRef.current) {
      lastSearchRef.current = key;
      loadAllTriggeredRef.current = false;
      search(searchParams);
    }
    return () => {
      lastSearchRef.current = '';
    };
  }, [searchParams, search]);

  useEffect(() => { onLoadingChange?.(isLoading); }, [isLoading, onLoadingChange]);
  useEffect(() => { onResultCountChange?.(listings.length); }, [listings.length, onResultCountChange]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isLoadingAll) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading && !isLoadingAll) loadMore();
    }, { threshold: 0.1, rootMargin: '200px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, isLoadingAll, loadMore]);

  const filteredListings = useMemo(() => {
    let filtered = listings.filter(l => l.price !== null && l.price >= 10);
    if (showAuctionsOnly) filtered = filtered.filter(l => l.buyingOptions?.includes('AUCTION'));
    else filtered = filtered.filter(l => !l.buyingOptions?.includes('AUCTION'));
    const range = PRICE_RANGES.find(r => r.value === priceRange);
    if (range) filtered = filtered.filter(l => { const p = l.price ?? 0; return p >= range.min && (range.max === null || p <= range.max); });
    if (traitLabels && traitLabels.length > 1) {
      filtered = filtered.filter(l => { const tl = l.title.toLowerCase(); return traitLabels.every(t => tl.includes(t.toLowerCase())); });
    }
    filteredCountRef.current = filtered.length;
    return filtered;
  }, [listings, showAuctionsOnly, priceRange, traitLabels]);

  useEffect(() => {
    if (!isLoading && listings.length > 0 && hasMore && !isLoadingAll && !loadAllTriggeredRef.current) {
      loadAllTriggeredRef.current = true;
      loadAll(() => filteredCountRef.current);
    }
  }, [isLoading, listings.length > 0, hasMore]);

  const sortedListings = useMemo(() => sortListings(filteredListings, sortOption), [filteredListings, sortOption]);

  if (isLoading) return (
    <div className="space-y-4"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div></div>
  );

  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;

  if (listings.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-lg border shadow-sm bg-card px-10 py-12 max-w-md">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-5 mx-auto"><Target className="w-7 h-7 text-muted-foreground" /></div>
        <h2 className="text-lg font-bold mb-2">No listings found</h2>
        <p className="text-sm text-muted-foreground mb-6">Try adjusting filters or expanding your search.</p>
        {onReset && <Button variant="outline" size="sm" onClick={onReset} className="gap-2"><RotateCcw className="h-3.5 w-3.5" />Clear filters</Button>}
      </div>
    </div>
  );

  return (
    <div ref={ref} className="space-y-4">
      {(isLoadingAll || isLoadingMore) && <div className="h-0.5 w-full rounded-full overflow-hidden bg-muted/30"><div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} /></div>}
      <div className="flex items-center justify-between bg-secondary/30 rounded-md px-3 py-2.5 flex-nowrap overflow-x-auto border border-border">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-xs tabular-nums">
            <span className="font-semibold">{sortedListings.length}</span>
            {listings.length !== sortedListings.length && <span className="text-muted-foreground">/ {listings.length}</span>}
            <span className="text-muted-foreground ml-0.5">{hasMore ? 'loaded · more available' : 'cards'}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-nowrap">
          <button onClick={() => setShowAuctionsOnly(!showAuctionsOnly)}
            className={cn("px-2.5 py-1 text-xs font-semibold rounded-full border transition-all whitespace-nowrap",
              showAuctionsOnly ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/50")}>
            Auctions
          </button>
          <Select value={priceRange} onValueChange={(v) => setPriceRange(v as PriceRange)}>
            <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue placeholder="Price" /></SelectTrigger>
            <SelectContent>{PRICE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
          {hasMore && !isLoadingAll && <button onClick={() => loadAll(() => filteredCountRef.current)} className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-transparent text-muted-foreground border-border hover:border-primary/50 whitespace-nowrap">Load more</button>}
          {isLoadingAll && <button onClick={cancelLoadAll} className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-orange-500/10 text-orange-500 border-orange-500/30 flex items-center gap-1.5 whitespace-nowrap"><Loader2 className="h-3 w-3 animate-spin" />Cancel</button>}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {showAuctionsOnly && <SelectItem value="ending-soon">Ending Soonest</SelectItem>}
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="quality-high">Best Match</SelectItem>
                <SelectItem value="price-low">Price: Low → High</SelectItem>
                <SelectItem value="price-high">Price: High → Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {sortedListings.map((listing, i) => <EbayListingCard key={`${listing.itemId}-${i}`} listing={listing} sportKey={sportKey} isAuctionMode={showAuctionsOnly} />)}
      </div>
      {hasMore && <div ref={sentinelRef} className="flex items-center justify-center py-8">
        {isLoadingMore ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span className="text-sm">Loading more cards...</span></div> : <div className="h-8" />}
      </div>}
    </div>
  );
});
