import { useState, useMemo, useCallback } from 'react';
import { MarketModule } from '@/components/MarketModule';
import { QueryHeaderDropdown } from '@/components/sports-lab/QueryHeaderDropdown';
import { EbayResultsPanel } from '@/components/sports-lab/EbayResultsPanel';
import { ResultsGrid } from '@/components/sports-lab/ResultsGrid';
import { useSportsRulesetSnapshot } from '@/hooks/useSportsRulesetSnapshot';
import { useSportsQueryBuilderState } from '@/hooks/useSportsQueryBuilderState';
import { Skeleton } from '@/components/ui/skeleton';

interface SportsModuleProps {
  globalQuery?: string;
}

export function SportsModule({ globalQuery }: SportsModuleProps) {
  const { data: snapshot, isLoading: snapshotLoading } = useSportsRulesetSnapshot();
  const [resultCount, setResultCount] = useState<number | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);

  const { state, setSportKey, selectPlayer, selectBrand, setShowAllBrands } =
    useSportsQueryBuilderState(snapshot?.rule_items ?? []);

  const filteredPlayers = useMemo(
    () => snapshot?.players.filter(p => p.sport_key === state.sport_key) ?? [],
    [snapshot?.players, state.sport_key]
  );
  const filteredRuleItems = useMemo(
    () => snapshot?.rule_items.filter(ri => ri.sport_key === state.sport_key) ?? [],
    [snapshot?.rule_items, state.sport_key]
  );

  const selectedPlayerNames = useMemo(
    () => filteredPlayers.filter(p => state.selected_player_ids.includes(p.id)).map(p => p.name),
    [filteredPlayers, state.selected_player_ids]
  );
  const selectedBrand = filteredRuleItems.find(ri => ri.kind === 'brand' && state.selected_rule_item_ids.includes(ri.id));
  const selectedTraitLabels = useMemo(
    () => filteredRuleItems.filter(ri => ri.kind === 'trait' && state.selected_rule_item_ids.includes(ri.id)).map(ri => ri.label),
    [filteredRuleItems, state.selected_rule_item_ids]
  );

  const hasPlayer = state.selected_player_ids.length > 0;
  const hasBrandOrShowAll = !!selectedBrand || state.show_all_brands;
  const canSearchGuided = hasPlayer && hasBrandOrShowAll;

  const sportOptions = useMemo(
    () => (snapshot?.sports ?? []).map(s => ({ id: s.key, label: s.label })),
    [snapshot?.sports]
  );
  const playerOptions = useMemo(
    () => filteredPlayers.map(p => ({ id: p.id, label: p.name })),
    [filteredPlayers]
  );
  const brandOptions = useMemo(() => {
    const brands = filteredRuleItems.filter(ri => ri.kind === 'brand');
    const opts = brands.map(b => ({ id: b.id, label: b.label }));
    return [{ id: '__all__', label: 'All Brands' }, ...opts];
  }, [filteredRuleItems]);

  const handleResultCount = useCallback((c: number) => setResultCount(c), []);
  const handleLoading = useCallback((l: boolean) => setIsSearching(l), []);

  const useGlobal = !!globalQuery?.trim();

  const quickSearchParams = useMemo(() => ({
    playerName: globalQuery?.trim() || '',
    freeFormSearch: true as const,
  }), [globalQuery]);

  if (snapshotLoading) {
    return (
      <MarketModule title="Sports Market" subtitle="Loading…">
        <div className="px-4 py-6"><Skeleton className="h-8 w-48 om-shimmer" /></div>
      </MarketModule>
    );
  }

  const filters = (
    <div className="flex items-center gap-1.5 flex-wrap px-4 py-2">
      <QueryHeaderDropdown
        label="Sport" value={sportOptions.find(s => s.id === state.sport_key)?.label || ''}
        placeholder="Select" options={sportOptions} selectedId={state.sport_key}
        onSelect={(id) => setSportKey(id)}
      />
      {state.sport_key && (
        <QueryHeaderDropdown
          label="Player" value={playerOptions.find(p => p.id === state.selected_player_ids[0])?.label || ''}
          placeholder="Select" options={playerOptions} selectedId={state.selected_player_ids[0] ?? null}
          onSelect={selectPlayer} searchable={playerOptions.length > 8}
        />
      )}
      {hasPlayer && (
        <QueryHeaderDropdown
          label="Brand" value={state.show_all_brands ? 'All Brands' : (selectedBrand?.label || '')}
          placeholder="Select" options={brandOptions}
          selectedId={state.show_all_brands ? '__all__' : (selectedBrand?.id ?? null)}
          onSelect={(id) => id === '__all__' ? setShowAllBrands(true) : selectBrand(id)}
        />
      )}
      {isSearching && (
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--om-text-3)' }}>Loading…</span>
      )}
      {!isSearching && (canSearchGuided || useGlobal) && resultCount !== undefined && resultCount > 0 && (
        <span className="om-pill om-pill-active tabular-nums text-[10px]">{resultCount}</span>
      )}
    </div>
  );

  const emptyState = (
    <div className="flex flex-col items-center py-10 text-center px-4">
      <p className="text-xs" style={{ color: 'var(--om-text-3)' }}>
        {globalQuery ? `Searching Sports for "${globalQuery}"…` : 'Select a sport, player, and brand above, or use the global search.'}
      </p>
    </div>
  );

  return (
    <MarketModule title="Sports Market" subtitle="Basketball · Football · Baseball · Soccer">
      {filters}
      <div className="px-4 pb-4">
        {useGlobal ? (
          <EbayResultsPanel
            searchParams={quickSearchParams}
            sportKey={state.sport_key}
            onResultCountChange={handleResultCount}
            onLoadingChange={handleLoading}
          />
        ) : canSearchGuided ? (
          <ResultsGrid
            playerNames={selectedPlayerNames}
            brandLabel={state.show_all_brands ? undefined : selectedBrand?.label}
            traitLabels={selectedTraitLabels}
            sportKey={state.sport_key}
            onResultCountChange={handleResultCount}
            onLoadingChange={handleLoading}
          />
        ) : (
          emptyState
        )}
      </div>
    </MarketModule>
  );
}
