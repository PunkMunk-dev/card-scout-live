import { useState, useEffect } from 'react';
import { Star, Search } from 'lucide-react';
import { PokeballIcon } from '@/components/icons/PokeballIcon';
import { StrawHatIcon } from '@/components/icons/StrawHatIcon';
import { CanonicalSetSelector } from '@/components/tcg-lab/CanonicalSetSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTcgWatchlist } from '@/hooks/useTcgWatchlist';
import { useTargets } from '@/hooks/useTcgData';
import { Input } from '@/components/ui/input';
import type { Game, TcgTarget, TcgSet } from '@/types/tcg';

interface TcgHeaderProps {
  selectedGame: Game | null;
  onGameChange: (game: Game) => void;
  selectedTarget: TcgTarget | null;
  onTargetChange: (target: TcgTarget | null) => void;
  sets: TcgSet[];
  selectedSetId: string | null;
  onSetChange: (setId: string | null) => void;
  setSelectorOpen: boolean;
  onSetSelectorOpenChange: (open: boolean) => void;
  mode: 'guided' | 'quick';
  onModeChange: (mode: 'guided' | 'quick') => void;
  quickQuery: string;
  onQuickQueryChange: (query: string) => void;
}

export function TcgHeader({
  selectedGame,
  onGameChange,
  selectedTarget,
  onTargetChange,
  sets,
  selectedSetId,
  onSetChange,
  setSelectorOpen,
  onSetSelectorOpenChange,
  mode,
  onModeChange,
  quickQuery,
  onQuickQueryChange,
}: TcgHeaderProps) {
  const { data: watchlist } = useTcgWatchlist();
  const { data: targets = [] } = useTargets(selectedGame);
  const watchlistCount = watchlist?.length || 0;
  const [targetOpen, setTargetOpen] = useState(false);

  useEffect(() => {
    if (selectedGame && !selectedTarget && targets.length > 0) {
      const timer = setTimeout(() => setTargetOpen(true), 150);
      return () => clearTimeout(timer);
    }
  }, [selectedGame, targets.length]);

  const handleTargetChange = (value: string) => {
    const target = targets.find(t => t.id === value);
    onTargetChange(target || null);
  };

  const chaseName = selectedGame === 'one_piece' ? 'Bounty' : 'Chase';

  return (
    <div className="w-full border-b border-border/30 bg-card/50 backdrop-blur-sm">
      <div className="container flex h-12 items-center gap-4">
        {/* Mode Tabs */}
        <div className="flex items-center bg-secondary/40 rounded-md p-0.5 border border-border/30 shrink-0">
          <button
            onClick={() => onModeChange('guided')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              mode === 'guided'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Guided
          </button>
          <button
            onClick={() => onModeChange('quick')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              mode === 'quick'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Quick Search
          </button>
        </div>

        {/* Selectors Row */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {mode === 'quick' ? (
            <div className="flex-1 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search any card... (e.g. Charizard VMAX)"
                value={quickQuery}
                onChange={(e) => onQuickQueryChange(e.target.value)}
                className="h-8 pl-9 text-xs bg-secondary/30 border-border/30 placeholder:text-muted-foreground/50 font-mono"
                autoFocus
              />
            </div>
          ) : (
            <>
              {/* Game Toggle */}
              <div className="flex items-center bg-secondary/40 rounded-md p-0.5 border border-border/30 shrink-0">
                <button
                  onClick={() => onGameChange('pokemon')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    selectedGame === 'pokemon'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PokeballIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pokémon</span>
                </button>
                <button
                  onClick={() => onGameChange('one_piece')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    selectedGame === 'one_piece'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <StrawHatIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">One Piece</span>
                </button>
              </div>

              {/* Target Selector */}
              {selectedGame && (
                <Select
                  open={targetOpen}
                  onOpenChange={setTargetOpen}
                  value={selectedTarget?.id || ''}
                  onValueChange={handleTargetChange}
                >
                  <SelectTrigger className="w-[160px] h-8 bg-secondary/30 border-border/30 text-xs shrink-0">
                    <SelectValue placeholder={`${chaseName}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((target) => (
                      <SelectItem key={target.id} value={target.id} className="text-xs">
                        {target.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Set Selector */}
              {selectedGame && selectedGame !== 'one_piece' && selectedTarget && (
                <CanonicalSetSelector
                  sets={sets}
                  selectedSetId={selectedSetId}
                  onSetChange={onSetChange}
                  game={selectedGame}
                  open={setSelectorOpen}
                  onOpenChange={onSetSelectorOpenChange}
                />
              )}
            </>
          )}
        </div>

        {/* Watchlist badge */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Star className="h-3.5 w-3.5" />
            {watchlistCount > 0 && (
              <Badge variant="outline" className="h-4 min-w-4 justify-center px-1 text-[9px] font-mono">
                {watchlistCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
