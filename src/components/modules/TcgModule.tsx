import { useState } from 'react';
import { MarketModule } from '@/components/MarketModule';
import { TerminalView } from '@/components/tcg-lab/TerminalView';
import { QueryHeaderDropdown } from '@/components/sports-lab/QueryHeaderDropdown';
import { CanonicalSetSelector } from '@/components/tcg-lab/CanonicalSetSelector';
import { useTargets, useSets } from '@/hooks/useTcgData';
import type { Game, TcgTarget } from '@/types/tcg';

const GAME_OPTIONS = [
  { id: 'pokemon', label: 'Pokémon' },
  { id: 'one_piece', label: 'One Piece' },
];

interface TcgModuleProps {
  globalQuery?: string;
}

export function TcgModule({ globalQuery }: TcgModuleProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<TcgTarget | null>(null);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [setSelectorOpen, setSetSelectorOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { data: targets = [] } = useTargets(selectedGame);
  const { data: sets = [] } = useSets(selectedGame);

  const handleGameChange = (id: string) => {
    setSelectedGame(id as Game);
    setSelectedTarget(null);
    setSelectedSetId(null);
  };

  const handleTargetChange = (id: string) => {
    const target = targets.find(t => t.id === id);
    setSelectedTarget(target || null);
  };

  const targetOptions = targets.map(t => ({ id: t.id, label: t.name }));
  const chaseName = selectedGame === 'one_piece' ? 'Bounty' : 'Chase';

  const useGlobal = !!globalQuery?.trim();
  const hasGuidedQuery = !!selectedTarget && !!selectedGame;
  const showResults = useGlobal || hasGuidedQuery;

  const filters = (
    <div className="flex items-center gap-1.5 flex-wrap px-4 py-2">
      <QueryHeaderDropdown
        label="TCG" value={GAME_OPTIONS.find(g => g.id === selectedGame)?.label || ''}
        placeholder="Select" options={GAME_OPTIONS} selectedId={selectedGame}
        onSelect={handleGameChange}
      />
      {selectedGame && (
        <QueryHeaderDropdown
          label={chaseName} value={targets.find(t => t.id === selectedTarget?.id)?.name || ''}
          placeholder="Select" options={targetOptions} selectedId={selectedTarget?.id || null}
          onSelect={handleTargetChange} searchable={targets.length > 8}
        />
      )}
      {selectedGame && selectedGame !== 'one_piece' && selectedTarget && (
        <CanonicalSetSelector
          sets={sets} selectedSetId={selectedSetId} onSetChange={setSelectedSetId}
          game={selectedGame} open={setSelectorOpen} onOpenChange={setSetSelectorOpen}
        />
      )}
      {isLoading && (
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--om-text-3)' }}>Loading…</span>
      )}
      {!isLoading && showResults && totalCount > 0 && (
        <span className="om-pill om-pill-active tabular-nums text-[10px]">{totalCount}</span>
      )}
    </div>
  );

  const emptyState = (
    <div className="flex flex-col items-center py-10 text-center px-4">
      <p className="text-xs" style={{ color: 'var(--om-text-3)' }}>
        {globalQuery ? `Searching TCG for "${globalQuery}"…` : 'Select a TCG and chase above, or use the global search.'}
      </p>
    </div>
  );

  return (
    <MarketModule title="TCG Market" subtitle="Pokémon · One Piece">
      {filters}
      <div className="px-4 pb-4">
        {useGlobal ? (
          <TerminalView
            game={selectedGame ?? 'pokemon'}
            freeQuery={globalQuery!.trim()}
            selectedSetId={null}
            sets={[]}
            onTotalCountChange={setTotalCount}
            onLoadingChange={setIsLoading}
          />
        ) : hasGuidedQuery ? (
          <TerminalView
            target={selectedTarget!}
            game={selectedGame!}
            selectedSetId={selectedSetId}
            sets={sets}
            onTotalCountChange={setTotalCount}
            onLoadingChange={setIsLoading}
          />
        ) : (
          emptyState
        )}
      </div>
    </MarketModule>
  );
}
