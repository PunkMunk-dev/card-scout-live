import { useMemo } from 'react';
import { RotateCcw, Filter, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { QueryHeaderDropdown, TraitsDropdown } from './QueryHeaderDropdown';
import { QuerySummaryBar } from './QuerySummaryBar';
import { SearchModeToggle, type SearchMode } from './SearchModeToggle';
import { QuickSearchInput } from './QuickSearchInput';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Sport, Player, RuleItem } from '@/types/sportsQueryBuilder';

interface QueryHeaderProps {
  sports: Sport[]; players: Player[]; ruleItems: RuleItem[];
  sportKey: string | null; selectedPlayerId: string | null; selectedBrandId: string | null;
  showAllBrands: boolean; selectedTraitIds: string[];
  onSportChange: (key: string | null) => void; onSelectPlayer: (id: string) => void;
  onSelectBrand: (id: string) => void; onSelectShowAll: () => void;
  onToggleTrait: (id: string) => void; onClearTraits?: () => void; onReset: () => void;
  resultCount?: number; isLoading?: boolean;
  watchlistOpen?: boolean; onWatchlistToggle?: () => void; watchlistCount?: number;
  searchMode?: SearchMode; onSearchModeChange?: (mode: SearchMode) => void;
  quickSearchQuery?: string; onQuickSearchChange?: (query: string) => void;
}

export function QueryHeader({
  sports, players, ruleItems, sportKey, selectedPlayerId, selectedBrandId, showAllBrands, selectedTraitIds,
  onSportChange, onSelectPlayer, onSelectBrand, onSelectShowAll, onToggleTrait, onClearTraits, onReset,
  resultCount, isLoading, watchlistOpen = false, onWatchlistToggle, watchlistCount = 0,
  searchMode = 'guided', onSearchModeChange, quickSearchQuery = '', onQuickSearchChange,
}: QueryHeaderProps) {
  const isMobile = useIsMobile();
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const selectedSport = sports.find(s => s.key === sportKey);
  const brands = useMemo(() => ruleItems.filter(ri => ri.kind === 'brand'), [ruleItems]);
  const allTraits = useMemo(() => ruleItems.filter(ri => ri.kind === 'trait'), [ruleItems]);
  const traits = useMemo(() => {
    if (showAllBrands || !selectedBrandId) return allTraits;
    return allTraits.filter(t => { const c = t.compatible_brand_ids ?? []; return c.length === 0 || c.includes(selectedBrandId); });
  }, [allTraits, showAllBrands, selectedBrandId]);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  const selectedTraitLabels = traits.filter(t => selectedTraitIds.includes(t.id)).map(t => t.label);
  const playerOptions = useMemo(() => players.map(p => ({ id: p.id, label: p.name, note: p.note || undefined })), [players]);
  const sportOptions = useMemo(() => sports.map(s => ({ id: s.key, label: s.label })), [sports]);
  const brandOptions = useMemo(() => brands.map(b => ({ id: b.id, label: b.label })), [brands]);
  const traitOptions = useMemo(() => traits.map(t => ({ id: t.id, label: t.label })), [traits]);

  const filterControls = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {sports.length > 1 && <QueryHeaderDropdown label="Sport" value={selectedSport?.label || ''} placeholder="Select" options={sportOptions} selectedId={sportKey} onSelect={onSportChange} />}
      <QueryHeaderDropdown label="Player" value={selectedPlayer?.name || ''} placeholder="Select player" options={playerOptions} selectedId={selectedPlayerId} onSelect={onSelectPlayer} searchable />
      {selectedPlayerId && brands.length > 0 && <QueryHeaderDropdown label="Brand" value={showAllBrands ? 'All Brands' : selectedBrand?.label || ''} placeholder="Select brand" options={brandOptions} selectedId={selectedBrandId} onSelect={onSelectBrand} showAllMode showAllActive={showAllBrands} onShowAll={onSelectShowAll} />}
      {(selectedBrandId || showAllBrands) && traits.length > 0 && <TraitsDropdown traits={traitOptions} selectedIds={selectedTraitIds} onToggle={onToggleTrait} onClear={onClearTraits} />}
      {selectedPlayerId && <Button variant="ghost" size="sm" onClick={onReset} className="h-9 px-2.5 text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></Button>}
    </div>
  );

  if (isMobile) {
    return (
      <div className="sticky top-0 z-40">
        <div className="bg-card/80 backdrop-blur-md border-b border-border mx-2 mt-2 rounded-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-sm font-bold truncate">Sports Card Lab</h1>
                {onSearchModeChange && <SearchModeToggle mode={searchMode} onModeChange={onSearchModeChange} className="scale-90 origin-left" />}
              </div>
              {searchMode === 'quick' ? <QuickSearchInput value={quickSearchQuery} onChange={onQuickSearchChange || (() => {})} placeholder="Search any card..." className="mt-2" /> :
                <p className="text-[10px] text-muted-foreground/60 tracking-wide">Data-Driven Card Selection</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant={watchlistOpen ? 'default' : 'outline'} size="sm" onClick={onWatchlistToggle} className="gap-1.5">
                <Star className="h-3.5 w-3.5 text-yellow-500" />Watchlist{watchlistCount > 0 && ` (${watchlistCount})`}
              </Button>
              <Sheet><SheetTrigger asChild><Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-3.5 w-3.5" />Filters</Button></SheetTrigger>
                <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl"><SheetHeader><SheetTitle>Search Filters</SheetTitle></SheetHeader>
                  <div className="py-4 space-y-4">{filterControls}</div></SheetContent></Sheet>
            </div>
          </div>
        </div>
        <QuerySummaryBar playerName={selectedPlayer?.name} sportLabel={selectedSport?.label} brandLabel={selectedBrand?.label} showAllBrands={showAllBrands} traitLabels={selectedTraitLabels} resultCount={resultCount} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40">
      <div className="bg-card/80 backdrop-blur-md border-b border-border mx-2 mt-2 rounded-xl">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between py-4 gap-x-4 gap-y-2">
            <div className="flex items-center gap-4 flex-shrink-0">
              <div><h1 className="text-lg font-bold">Sports Card Lab</h1><p className="text-xs text-muted-foreground/60">Data-Driven Card Selection</p></div>
              {onSearchModeChange && <SearchModeToggle mode={searchMode} onModeChange={onSearchModeChange} />}
            </div>
            <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end flex-wrap">
              {searchMode === 'quick' ? <QuickSearchInput value={quickSearchQuery} onChange={onQuickSearchChange || (() => {})} className="max-w-lg" /> : filterControls}
              <Button variant={watchlistOpen ? 'default' : 'ghost'} size="sm" onClick={onWatchlistToggle} className="h-9 px-3 gap-2">
                <Star className="h-4 w-4 text-yellow-500" />Watchlist{watchlistCount > 0 && <span className="ml-0.5 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-foreground/10">{watchlistCount}</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {searchMode === 'guided' && <div className="max-w-6xl mx-auto"><QuerySummaryBar playerName={selectedPlayer?.name} sportLabel={selectedSport?.label} brandLabel={selectedBrand?.label} showAllBrands={showAllBrands} traitLabels={selectedTraitLabels} resultCount={resultCount} isLoading={isLoading} /></div>}
      {searchMode === 'quick' && quickSearchQuery.trim().length >= 3 && <div className="max-w-6xl mx-auto"><QuerySummaryBar playerName={quickSearchQuery.trim()} resultCount={resultCount} isLoading={isLoading} /></div>}
    </div>
  );
}
