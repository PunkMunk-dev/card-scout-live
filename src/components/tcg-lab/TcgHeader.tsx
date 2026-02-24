import { useState, useEffect, useMemo } from 'react';
import { Star, Filter } from 'lucide-react';
import { PokeballIcon } from '@/components/icons/PokeballIcon';
import { StrawHatIcon } from '@/components/icons/StrawHatIcon';
import { CanonicalSetSelector } from '@/components/tcg-lab/CanonicalSetSelector';
import { SearchModeToggle } from '@/components/sports-lab/SearchModeToggle';
import { QuickSearchInput } from '@/components/sports-lab/QuickSearchInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTcgWatchlist } from '@/hooks/useTcgWatchlist';
import { useTargets } from '@/hooks/useTcgData';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

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

  const guidedFilters = (
    <div className="flex items-center gap-1.5 flex-wrap">
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
    </div>
  );

  const watchlistButton = (
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
  );

  if (isMobile) {
    return (
      <div className="sticky top-0 z-40">
        <div className="bg-card/80 backdrop-blur-md border-b border-border mx-2 mt-2 rounded-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <SearchModeToggle mode={mode} onModeChange={onModeChange} className="scale-90 origin-left" />
              </div>
              {mode === 'quick' && (
                <QuickSearchInput
                  value={quickQuery}
                  onChange={onQuickQueryChange}
                  placeholder="Search any card... (e.g. Charizard VMAX)"
                  className="mt-2"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              {watchlistButton}
              {mode === 'guided' && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Filter className="h-3.5 w-3.5" />Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
                    <SheetHeader><SheetTitle>TCG Filters</SheetTitle></SheetHeader>
                    <div className="py-4 space-y-4">{guidedFilters}</div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40">
      <div className="bg-card/80 backdrop-blur-md border-b border-border mx-2 mt-2 rounded-xl">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between py-4 gap-x-4 gap-y-2">
            <div className="flex items-center gap-4 flex-shrink-0">
              <SearchModeToggle mode={mode} onModeChange={onModeChange} />
            </div>
            <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end flex-wrap">
              {mode === 'quick' ? (
                <QuickSearchInput
                  value={quickQuery}
                  onChange={onQuickQueryChange}
                  placeholder="Search any card... (e.g. Charizard VMAX)"
                  className="max-w-lg"
                />
              ) : (
                guidedFilters
              )}
              {watchlistButton}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
