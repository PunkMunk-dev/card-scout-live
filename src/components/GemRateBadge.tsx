import { TrendingUp, Loader2, Award, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GemRateBreakdown } from "@/components/GemRateBreakdown";
import type { GemRateState } from "@/types/gemScore";

interface GemRateBadgeProps {
  state: GemRateState | undefined;
  className?: string;
}

export function GemRateBadge({ state, className }: GemRateBadgeProps) {
  if (!state) return null;
  
  const { loading, result } = state;
  
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
  
  if (!result || result.gemRate === null) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
            "bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm",
            "text-xs font-medium text-muted-foreground",
            "hover:bg-background transition-colors",
            className
          )}>
            <TrendingUp className="h-3 w-3" />
            <span>Gem: —</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-auto p-3">
          <p className="text-sm text-muted-foreground">{result?.error || 'Unable to analyze this listing'}</p>
        </PopoverContent>
      </Popover>
    );
  }
  
  // Certified grade - show special badge
  if (result.certifiedGrade) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
            "backdrop-blur-sm shadow-sm border",
            "text-xs font-medium",
            "hover:brightness-110 transition-all",
            "border-blue-500/30 bg-blue-500/10 text-blue-400",
            className
          )}>
            <Award className="h-3 w-3" />
            <span>{result.certifiedGrade.company} {result.certifiedGrade.grade}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-auto p-4">
          <GemRateBreakdown result={result} />
        </PopoverContent>
      </Popover>
    );
  }
  
  // Real pop data from listing - show special badge
  if (result.isRealData && result.psa10Count !== undefined) {
    const popColors: Record<string, string> = {
      High: 'border-green-500/30 bg-green-500/10 text-green-400',
      Medium: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
      Low: 'border-border/50 bg-background/90 text-muted-foreground'
    };
    
    // If we have a calculated gem rate, show it prominently
    if (result.gemRate !== null) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
              "backdrop-blur-sm shadow-sm border",
              "text-xs font-medium",
              "hover:brightness-110 transition-all",
              popColors[result.psa10Likelihood],
              className
            )}>
              <Database className="h-3 w-3" />
              <span>Gem: {result.gemRate}%</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-auto p-4">
            <GemRateBreakdown result={result} />
          </PopoverContent>
        </Popover>
      );
    }
    
    // Otherwise show just the pop count
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
            "backdrop-blur-sm shadow-sm border",
            "text-xs font-medium",
            "hover:brightness-110 transition-all",
            popColors[result.psa10Likelihood],
            className
          )}>
            <Database className="h-3 w-3" />
            <span>Pop: {result.psa10Count}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-auto p-4">
          <GemRateBreakdown result={result} />
        </PopoverContent>
      </Popover>
    );
  }
  
  const { gemRate, psa10Likelihood } = result;
  
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
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
          "backdrop-blur-sm shadow-sm border",
          "text-xs font-medium",
          "hover:brightness-110 transition-all",
          badgeColors[psa10Likelihood],
          className
        )}>
          <TrendingUp className={cn("h-3 w-3", likelihoodColors[psa10Likelihood])} />
          <span>
            Gem: {gemRate}% | <span className={likelihoodColors[psa10Likelihood]}>{psa10Likelihood}</span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-auto p-4">
        <GemRateBreakdown result={result} />
      </PopoverContent>
    </Popover>
  );
}

// Legacy export for backward compatibility
export { GemRateBadge as GemScoreBadge };
