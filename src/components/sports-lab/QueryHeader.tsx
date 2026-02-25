import { useMemo } from 'react';
import { RotateCcw, Filter } from 'lucide-react';
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
  searchMode?: SearchMode; onSearchModeChange?: (mode: SearchMode) => void;
  quickSearchQuery?: string; onQuickSearchChange?: (query: string) => void;
}

export function QueryHeader({
  sports, players, ruleItems, sportKey, selectedPlayerId, selectedBrandId, showAllBrands, selectedTraitIds,
  onSportChange, onSelectPlayer, onSelectBrand, onSelectShowAll, onToggleTrait, onClearTraits, onReset,
  resultCount, isLoading,
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
      {sportKey && <QueryHeaderDropdown label="Player" value={selectedPlayer?.name || ''} placeholder="Select player" options={playerOptions} selectedId={selectedPlayerId} onSelect={onSelectPlayer} searchable />}
      {selectedPlayerId && brands.length > 0 && <QueryHeaderDropdown label="Brand" value={showAllBrands ? 'All Brands' : selectedBrand?.label || ''} placeholder="Select brand" options={brandOptions} selectedId={selectedBrandId} onSelect={onSelectBrand} showAllMode showAllActive={showAllBrands} onShowAll={onSelectShowAll} />}
      {(selectedBrandId || showAllBrands) && traits.length > 0 && <TraitsDropdown traits={traitOptions} selectedIds={selectedTraitIds} onToggle={onToggleTrait} onClear={onClearTraits} />}
      {selectedPlayerId && <Button variant="ghost" size="sm" onClick={onReset} className="h-9 px-2.5 text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></Button>}
    </div>
  );

  if (isMobile) {
    return (
      <div className="sticky top-0 z-40">
        <div className="bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {onSearchModeChange && <SearchModeToggle mode={searchMode} onModeChange={onSearchModeChange} className="scale-90 origin-left" />}
              </div>
              {searchMode === 'quick' && <QuickSearchInput value={quickSearchQuery} onChange={onQuickSearchChange || (() => {})} placeholder="Search any card..." className="mt-2" />}
            </div>
            <div className="flex items-center gap-2">
              <Sheet><SheetTrigger asChild><Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-3.5 w-3.5" />Filters</Button></SheetTrigger>
                <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl"><SheetHeader><SheetTitle>Search Filters</SheetTitle></SheetHeader>
                  <div className="py-4 space-y-4">{filterControls}</div></SheetContent></Sheet>
            </div>
          </div>
        </div>
        <QuerySummaryBar playerName={selectedPlayer?.name} sportLabel={selectedSport?.label} brandLabel={selectedBrand?.label} showAllBrands={showAllBrands} traitLabels={selectedTraitLabels} resultCount={resultCount} isLoading={isLoading} idleMessage="Select a sport to begin searching" />
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40">
      <div className="bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between py-4 gap-x-4 gap-y-2">
            <div className="flex items-center gap-4 flex-shrink-0">
              {onSearchModeChange && <SearchModeToggle mode={searchMode} onModeChange={onSearchModeChange} />}
            </div>
            <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end flex-wrap">
              {searchMode === 'quick' ? <QuickSearchInput value={quickSearchQuery} onChange={onQuickSearchChange || (() => {})} className="max-w-lg" /> : filterControls}
            </div>
          </div>
        </div>
      </div>
      {searchMode === 'guided' && <div className="max-w-6xl mx-auto"><QuerySummaryBar playerName={selectedPlayer?.name} sportLabel={selectedSport?.label} brandLabel={selectedBrand?.label} showAllBrands={showAllBrands} traitLabels={selectedTraitLabels} resultCount={resultCount} isLoading={isLoading} idleMessage="Select a sport to begin searching" /></div>}
      {searchMode === 'quick' && quickSearchQuery.trim().length >= 3 && <div className="max-w-6xl mx-auto"><QuerySummaryBar playerName={quickSearchQuery.trim()} resultCount={resultCount} isLoading={isLoading} idleMessage="Select a sport to begin searching" /></div>}
    </div>
  );
}
