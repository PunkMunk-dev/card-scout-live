import { TrendingRail } from './TrendingRail';
import { Terminal, Crosshair, Anchor } from 'lucide-react';
import { PokeballIcon } from '@/components/icons/PokeballIcon';
import { StrawHatIcon } from '@/components/icons/StrawHatIcon';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
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
  const useStrawHat = selectedGame === 'one_piece';
  const DecoIcon = useStrawHat ? StrawHatIcon : PokeballIcon;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] relative overflow-hidden">
      {/* Decorative background icons */}
      <DecoIcon className="absolute top-8 right-12 w-64 h-64 text-muted-foreground opacity-[0.04] rotate-[15deg] pointer-events-none" />
      <DecoIcon className="absolute bottom-12 left-8 w-48 h-48 text-muted-foreground opacity-[0.03] -rotate-[20deg] pointer-events-none" />
      <DecoIcon className="absolute top-1/3 left-16 w-32 h-32 text-muted-foreground opacity-[0.05] rotate-[30deg] pointer-events-none" />

      <div className="flex flex-col items-center text-center w-full max-w-[540px] px-6 relative z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 cursor-default">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Select a TCG for guided or use quick search to search market
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
