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
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">{subtitle}</p>
        {selectedGame && (
          <div className="mt-7 w-full">
            <TrendingRail onSelectTarget={onSelectTarget} game={selectedGame} />
          </div>
        )}
      </div>
    </div>
  );
}
