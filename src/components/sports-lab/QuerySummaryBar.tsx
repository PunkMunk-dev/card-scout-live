import { cn } from '@/lib/utils';

interface QuerySummaryBarProps {
  playerName?: string; sportLabel?: string; brandLabel?: string; showAllBrands?: boolean;
  traitLabels?: string[]; resultCount?: number; isLoading?: boolean;
}

export function QuerySummaryBar({ playerName, sportLabel, brandLabel, showAllBrands, traitLabels = [], resultCount, isLoading }: QuerySummaryBarProps) {
  if (!playerName) return (
    <div className="px-4 py-2 border-b border-border"><p className="text-xs text-muted-foreground">Select a player to begin searching</p></div>
  );

  const parts: string[] = [];
  if (playerName) parts.push(playerName);
  if (showAllBrands) parts.push('All Brands');
  else if (brandLabel) parts.push(brandLabel);
  if (traitLabels.length > 0) parts.push(...traitLabels);
  parts.push('Raw Only');

  const hasQuery = !!playerName && (!!brandLabel || showAllBrands);

  return (
    <div className="h-8 px-4 flex items-center border-b border-border/20 bg-secondary/10">
      <div className="flex items-center justify-between gap-4 text-xs w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-muted-foreground">Showing:</span>
          <span className="font-medium text-muted-foreground truncate">
            {parts.map((part, i) => (<span key={i}>{i > 0 && <span className="mx-1.5 opacity-50">·</span>}{part}</span>))}
          </span>
        </div>
        {hasQuery && (
          <div className="flex-shrink-0">
            {isLoading ? <span className="text-muted-foreground animate-pulse">Searching...</span> :
              resultCount !== undefined ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground tabular-nums">{resultCount} cards</span> :
              <span className="text-muted-foreground">Ready</span>}
          </div>
        )}
      </div>
    </div>
  );
}
