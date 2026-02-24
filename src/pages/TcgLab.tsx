import { useState } from 'react';
import { TcgHeader } from '@/components/tcg-lab/TcgHeader';
import { TcgEmptyState } from '@/components/tcg-lab/TcgEmptyState';
import { TerminalView } from '@/components/tcg-lab/TerminalView';
import { useSets } from '@/hooks/useTcgData';
import type { Game, TcgTarget } from '@/types/tcg';

export default function TcgLab() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<TcgTarget | null>(null);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [setSelectorOpen, setSetSelectorOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [mode, setMode] = useState<'guided' | 'quick'>('guided');
  const [quickQuery, setQuickQuery] = useState('');

  const { data: sets = [] } = useSets(selectedGame);

  const handleGameChange = (game: Game) => {
    setSelectedGame(game);
    setSelectedTarget(null);
    setSelectedSetId(null);
  };

  const handleTrendingSelect = (target: TcgTarget, game: Game) => {
    setSelectedGame(game);
    setSelectedTarget(target);
    setSelectedSetId(null);
  };

  const selectedSet = sets.find(s => s.id === selectedSetId);

  return (
    <div className="min-h-[calc(100vh-48px)] bg-background relative pb-16 sm:pb-0">
      <TcgHeader
        selectedGame={selectedGame}
        onGameChange={handleGameChange}
        selectedTarget={selectedTarget}
        onTargetChange={setSelectedTarget}
        sets={sets}
        selectedSetId={selectedSetId}
        onSetChange={setSelectedSetId}
        setSelectorOpen={setSelectorOpen}
        onSetSelectorOpenChange={setSetSelectorOpen}
        mode={mode}
        onModeChange={setMode}
        quickQuery={quickQuery}
        onQuickQueryChange={setQuickQuery}
        totalCount={totalCount}
        isSearchLoading={isSearchLoading}
      />

      <main className="container py-6">
        {mode === 'quick' && quickQuery.trim() ? (
          <TerminalView
            game={selectedGame ?? 'pokemon'}
            freeQuery={quickQuery.trim()}
            selectedSetId={null}
            sets={[]}
            onTotalCountChange={setTotalCount}
            onLoadingChange={setIsSearchLoading}
          />
        ) : mode === 'guided' && selectedTarget && selectedGame ? (
          <TerminalView 
            target={selectedTarget} 
            game={selectedGame} 
            selectedSetId={selectedSetId}
            sets={sets}
            onTotalCountChange={setTotalCount}
            onLoadingChange={setIsSearchLoading}
          />
        ) : (
          <TcgEmptyState 
            selectedGame={selectedGame}
            onSelectTarget={handleTrendingSelect} 
          />
        )}
      </main>
    </div>
  );
}
