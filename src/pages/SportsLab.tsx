import { useMemo, useState, useCallback, useEffect } from 'react';
import { Target, Search, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCard } from '@/components/sports-lab/SkeletonCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { QueryHeader } from '@/components/sports-lab/QueryHeader';
import { ResultsGrid } from '@/components/sports-lab/ResultsGrid';
import { WatchlistPanel } from '@/components/sports-lab/WatchlistPanel';
import { EbayResultsPanel } from '@/components/sports-lab/EbayResultsPanel';
import { useSportsRulesetSnapshot } from '@/hooks/useSportsRulesetSnapshot';
import { useSportsQueryBuilderState } from '@/hooks/useSportsQueryBuilderState';
import { useSportsWatchlist } from '@/contexts/SportsWatchlistContext';
import { Card, CardContent } from '@/components/ui/card';
import type { SearchMode } from '@/components/sports-lab/SearchModeToggle';

export default function SportsLab() {
  const { data: snapshot, isLoading, error } = useSportsRulesetSnapshot();
  const [resultCount, setResultCount] = useState<number | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { count: watchlistCount } = useSportsWatchlist();
  const [searchMode, setSearchMode] = useState<SearchMode>('guided');
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { state, setSportKey, selectPlayer, selectBrand, setShowAllBrands, toggleTrait, clearTraits, reset } = useSportsQueryBuilderState(snapshot?.rule_items ?? []);

  const filteredPlayers = useMemo(() => snapshot?.players.filter(p => p.sport_key === state.sport_key) ?? [], [snapshot?.players, state.sport_key]);
  const filteredRuleItems = useMemo(() => snapshot?.rule_items.filter(ri => ri.sport_key === state.sport_key) ?? [], [snapshot?.rule_items, state.sport_key]);
  const selectedPlayerNames = filteredPlayers.filter(p => state.selected_player_ids.includes(p.id)).map(p => p.name);
  const selectedBrand = filteredRuleItems.find(ri => ri.kind === 'brand' && state.selected_rule_item_ids.includes(ri.id));
  const selectedTraitIds = state.selected_rule_item_ids.filter(id => { const item = filteredRuleItems.find(ri => ri.id === id); return item && item.kind === 'trait'; });
  const selectedTraitLabels = filteredRuleItems.filter(ri => ri.kind === 'trait' && state.selected_rule_item_ids.includes(ri.id)).map(ri => ri.label);

  const hasPlayer = state.selected_player_ids.length > 0;
  const hasBrandOrShowAll = !!selectedBrand || state.show_all_brands;
  const canSearchGuided = hasPlayer && hasBrandOrShowAll;
  const canSearchQuick = quickSearchQuery.trim().length >= 3;

  const handleResultCountChange = useCallback((count: number) => setResultCount(count), []);
  const handleLoadingChange = useCallback((loading: boolean) => setIsSearching(loading), []);
  const handleSearchModeChange = useCallback((mode: SearchMode) => { setSearchMode(mode); setResultCount(undefined); }, []);

  if (isLoading) return (
    <div className="min-h-[calc(100vh-48px)]">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border"><div className="max-w-6xl mx-auto px-4 py-4"><Skeleton className="h-8 w-48" /></div></div>
      <div className="max-w-6xl mx-auto p-4"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div></div>
    </div>
  );

  if (error) return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="pt-6"><p className="text-destructive text-center">Failed to load ruleset. Please try again later.</p></CardContent></Card>
    </div>
  );

  if (!snapshot?.ruleset) return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="pt-6 text-center space-y-4">
        <p className="text-muted-foreground">No published ruleset available yet. An admin needs to create and publish a ruleset first.</p>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-48px)] flex flex-col pb-16 sm:pb-0">
      <QueryHeader
        sports={snapshot.sports} players={filteredPlayers} ruleItems={filteredRuleItems}
        sportKey={state.sport_key} selectedPlayerId={state.selected_player_ids[0] ?? null}
        selectedBrandId={selectedBrand?.id ?? null} showAllBrands={state.show_all_brands} selectedTraitIds={selectedTraitIds}
        onSportChange={setSportKey} onSelectPlayer={selectPlayer} onSelectBrand={selectBrand}
        onSelectShowAll={() => setShowAllBrands(true)} onToggleTrait={toggleTrait} onClearTraits={clearTraits} onReset={reset}
        resultCount={(searchMode === 'guided' ? canSearchGuided : canSearchQuick) ? resultCount : undefined}
        isLoading={isSearching} watchlistOpen={watchlistOpen} onWatchlistToggle={() => setWatchlistOpen(!watchlistOpen)}
        watchlistCount={watchlistCount} searchMode={searchMode} onSearchModeChange={handleSearchModeChange}
        quickSearchQuery={quickSearchQuery} onQuickSearchChange={setQuickSearchQuery}
      />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {searchMode === 'quick' ? (
          !canSearchQuick ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4"><Search className="w-6 h-6 text-muted-foreground" /></div>
              <h2 className="text-lg font-semibold mb-2">Quick Search</h2>
              <p className="text-sm text-muted-foreground/70 max-w-md">Type at least 3 characters to search for any card on eBay.</p>
            </div>
          ) : <EbayResultsPanel searchParams={{ playerName: quickSearchQuery.trim(), freeFormSearch: true }} sportKey={state.sport_key} onResultCountChange={handleResultCountChange} onLoadingChange={handleLoadingChange} />
        ) : (
          !hasPlayer ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4"><Target className="w-6 h-6 text-muted-foreground" /></div>
              <h2 className="text-lg font-semibold mb-2">Select a Player</h2>
              <p className="text-sm text-muted-foreground/70 max-w-md">Choose a player from the dropdown above to start searching.</p>
            </div>
          ) : !hasBrandOrShowAll ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4"><Target className="w-6 h-6 text-muted-foreground" /></div>
              <h2 className="text-lg font-semibold mb-2">Select a Brand</h2>
              <p className="text-sm text-muted-foreground/70 max-w-md">Choose a brand or "All Brands" to search eBay.</p>
            </div>
          ) : <ResultsGrid playerNames={selectedPlayerNames} brandLabel={state.show_all_brands ? undefined : selectedBrand?.label} traitLabels={selectedTraitLabels} sportKey={state.sport_key} onResultCountChange={handleResultCountChange} onLoadingChange={handleLoadingChange} />
        )}
      </main>
      <Sheet open={watchlistOpen} onOpenChange={setWatchlistOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border"><SheetTitle>Watchlist</SheetTitle></SheetHeader>
          <WatchlistPanel sportKey={state.sport_key} />
        </SheetContent>
      </Sheet>
      <Button variant="outline" size="icon"
        className={cn("fixed bottom-6 right-6 z-50 rounded-full shadow-md transition-opacity duration-300", showScrollTop ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <ChevronUp className="h-5 w-5" />
      </Button>
    </div>
  );
}
