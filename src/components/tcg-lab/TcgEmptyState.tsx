import { TrendingRail } from './TrendingRail';
import { Terminal, Crosshair, Anchor } from 'lucide-react';
import type { TcgTarget, Game } from '@/types/tcg';

interface TcgEmptyStateProps {
  selectedGame: Game | null;
  onSelectTarget: (target: TcgTarget, game: Game) => void;
}

export function TcgEmptyState({ selectedGame, onSelectTarget }: TcgEmptyStateProps) {
  const getContent = () => {
    if (!selectedGame) {
      return {
        icon: Terminal,
        title: "Market Intelligence Terminal",
        subtitle: "Select a TCG to begin scanning the market.",
      };
    }
    if (selectedGame === 'pokemon') {
      return {
        icon: Crosshair,
        title: "Select Your Chase",
        subtitle: "Choose a target to analyze market activity.",
      };
    }
    return {
      icon: Anchor,
      title: "Select Your Bounty",
      subtitle: "Choose a target to scan the Grand Line.",
    };
  };

  const { icon: Icon, title, subtitle } = getContent();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="flex flex-col items-center text-center w-full max-w-[540px] px-6">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full scale-150" />
          <div className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg bg-secondary/40 border border-border/20">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-[22px] font-semibold text-foreground tracking-tight leading-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground/80 max-w-xs leading-relaxed">{subtitle}</p>
        {selectedGame && (
          <div className="mt-7 w-full">
            <TrendingRail onSelectTarget={onSelectTarget} game={selectedGame} />
          </div>
        )}
      </div>
    </div>
  );
}
