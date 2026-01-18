import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GemScoreState } from "@/types/gemScore";

interface GemScoreBadgeProps {
  state: GemScoreState | undefined;
  className?: string;
}

export function GemScoreBadge({ state, className }: GemScoreBadgeProps) {
  // Not yet loaded/requested
  if (!state) {
    return null;
  }
  
  const { loading, result } = state;
  
  // Loading state
  if (loading) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md",
        "bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm",
        "text-xs font-medium text-muted-foreground",
        className
      )}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Gem: …</span>
      </div>
    );
  }
  
  // No result or error
  if (!result || result.gemScore === null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
              "bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm",
              "text-xs font-medium text-muted-foreground",
              className
            )}>
              <Sparkles className="h-3 w-3" />
              <span>Gem: —</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-sm">{result?.error || 'Unable to grade this listing'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Success - show score with likelihood
  const { gemScore, psa10Likelihood, confidence, subgrades } = result;
  
  const likelihoodColors: Record<string, string> = {
    High: 'text-green-500',
    Medium: 'text-yellow-500',
    Low: 'text-muted-foreground'
  };
  
  const badgeColors: Record<string, string> = {
    High: 'border-green-500/30 bg-green-500/10',
    Medium: 'border-yellow-500/30 bg-yellow-500/10',
    Low: 'border-border/50 bg-background/90'
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
            "backdrop-blur-sm shadow-sm",
            "text-xs font-medium",
            badgeColors[psa10Likelihood],
            className
          )}>
            <Sparkles className={cn("h-3 w-3", likelihoodColors[psa10Likelihood])} />
            <span>
              Gem: {gemScore} | <span className={likelihoodColors[psa10Likelihood]}>{psa10Likelihood}</span>
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">PSA-10 Likelihood:</span>
              <span className={cn("font-medium", likelihoodColors[psa10Likelihood])}>
                {psa10Likelihood}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-medium">{confidence.toFixed(2)}</span>
            </div>
            {subgrades && Object.keys(subgrades).length > 0 && (
              <div className="pt-1 border-t border-border/50">
                <p className="text-muted-foreground mb-1">Subgrades:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {subgrades.centering !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Centering:</span>
                      <span>{subgrades.centering.toFixed(1)}</span>
                    </div>
                  )}
                  {subgrades.corners !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Corners:</span>
                      <span>{subgrades.corners.toFixed(1)}</span>
                    </div>
                  )}
                  {subgrades.edges !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edges:</span>
                      <span>{subgrades.edges.toFixed(1)}</span>
                    </div>
                  )}
                  {subgrades.surface !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Surface:</span>
                      <span>{subgrades.surface.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <p className="pt-1 text-xs text-muted-foreground italic border-t border-border/50">
              Photo-based estimate; not a guarantee.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
